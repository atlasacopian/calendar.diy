import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import pLimit from 'p-limit'

// ---- env vars ----
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  KROGER_CLIENT_ID,
  KROGER_CLIENT_SECRET,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}
if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET) {
  console.error('❌  KROGER_CLIENT_ID and KROGER_CLIENT_SECRET must be set')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// (reverted) – use hard-coded table name throughout

let currentToken

async function getToken() {
  const basic = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  })
  if (!res.ok) {
    throw new Error(`Token request failed ${res.status}: ${await res.text()}`)
  }
  const { access_token } = await res.json()
  return access_token
}

async function refreshToken() {
  currentToken = await getToken()
  return currentToken
}

// prime the token once (will refresh later on 401)
await refreshToken()

// utility sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Fetch with retry/back-off for 401/429
async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    let res = await fetch(url, { headers: { Authorization: `Bearer ${currentToken}` } })

    // token expired
    if (res.status === 401) {
      console.log('🔑 token expired, refreshing…')
      await refreshToken()
      res = await fetch(url, { headers: { Authorization: `Bearer ${currentToken}` } })
    }

    // rate limited
    if (res.status === 429) {
      const headerWait = Number(res.headers.get('Retry-After'))
      const waitSec = headerWait > 0 ? headerWait : Math.pow(2, attempt) // 2,4,8,16,32
      console.log(`⚠️  429 – waiting ${waitSec}s then retry (attempt ${attempt}/5) `)
      await sleep(waitSec * 1000)
      continue
    }

    return res // either ok or other error status handled by caller
  }
  return { ok: false, status: 429, text: async () => 'max retries' }
}

async function fetchStoreIds() {
  const ids = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('kroger_stores')
      .select('location_id')
      .order('location_id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data?.length) break
    ids.push(...data.map((r) => r.location_id))
    if (data.length < pageSize) break // last page
  }
  return ids
}

export function isTwelveCountProduct(product) {
  const desc = (product.description ?? '').toLowerCase()
  const size = (product.items?.[0]?.size ?? '').toLowerCase()

  const check = (txt) => {
    if (!txt) return false
    if (/(18|24|30|36|48|60)[ ]?(ct|count)/.test(txt)) return false // skip bigger packs
    return (
      /12[ ]?(ct|count|pk|pack|pc|dz)/.test(txt) ||
      /1[ ]?(dozen|dz|doz)/.test(txt) ||
      /one[ ]?dozen/.test(txt) ||
      (txt.includes('dozen') && !txt.match(/(18|24|30|36|48|60)/))
    )
  }

  return check(desc) || check(size)
}

export function isShellEggProduct(product) {
  const desc = (product.description ?? '').toLowerCase();
  // Must contain "egg", "eggs" or "shell"
  if (!desc.includes('egg') && !desc.includes('shell')) return false;

  // Exclude common non-egg items containing "egg"
  const exclusionKeywords = [
    'sandwich', 'sandwiches', 'croissant', 'bites', 'bite', 'yogurt', 'cookie', 'cheese', 'sausage',
    'patty', 'patties', 'wrap', 'wraps', 'burrito', 'scramble', 'omelet', 'drink', 'nog', 'substitute',
    'milk', 'dog', 'cat', 'jerky', 'food', 'smoothie', 'meal', 'kit', 'dough', 'bake', 'candy',
    'chocolate', 'liquid', 'mix', 'easter', 'holiday', 'plastic', 'decoration', 'fill eggs'
  ];
  if (exclusionKeywords.some(keyword => desc.includes(keyword))) {
    return false;
  }

  // Could add more checks here if needed (e.g., based on category)
  return true; // Assume it's shell eggs if it passes exclusions
}

export function isOrganic(product) {
  const desc = (product.description ?? '').toLowerCase()
  const size = (product.items?.[0]?.size ?? '').toLowerCase()
  const text = desc + ' ' + size
  // broadened keywords
  const keywords = ['organic', 'orgnc', 'org', 'o r g', 'o.r.g.']
  return keywords.some(k => text.includes(k))
}

export async function fetchEggProducts(locationId) {
  const products = []
  const limit = 50 // API max
  const terms = ['eggs','egg','dozen eggs','12 ct eggs','12 count eggs','1 dozen','large eggs']
  for (const term of terms) {
    for (let start = 1; start <= 250; start += limit) {
      const url = new URL('https://api.kroger.com/v1/products')
      url.searchParams.set('filter.term', term)
      url.searchParams.set('filter.locationId', locationId)
      url.searchParams.set('filter.limit', limit)
      url.searchParams.set('filter.start', start)
      url.searchParams.set('filter.fulfillment', 'inStore')
      let res = await fetchWithRetry(url)
      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        console.log(`⏺ store ${locationId}: products request failed – ${res.status} ${errBody}`)
        break
      }
      const { data = [] } = await res.json()
      products.push(...data)
      if (data.length < limit) break // last page
      await sleep(1500) // pacing to avoid rate limit
    }
  }
  // Deduplicate products
  const seen = new Set()
  const unique = []
  for (const p of products) {
    const id = p.productId || p.upc || p.description
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(p)
  }
  // Debug hash of product IDs
  const identifiers = unique.map(p => p.productId || p.upc).sort().join(',')
  const hashCode = identifiers.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)
  console.log(`🔍 Store ${locationId} products hash: ${hashCode} (${unique.length} products)`)
  return unique
}

export async function summarizeEggPrices(locationId) {
  const data = await fetchEggProducts(locationId)
  console.log(`⏺ store ${locationId}: raw products = ${data.length}`)

  const regPrices = []
  const orgPrices = []
  const regDetails = []
  const orgDetails = []
  let foundDozen = false

  for (const p of data) {
    if (!isShellEggProduct(p)) continue;   // FIRST: Check if it's likely shell eggs
    if (!isTwelveCountProduct(p)) continue; // SECOND: Check if it's a dozen count
    foundDozen = true
    let price = null
    // Only consider items stocked in-store
    const instore = (p.items ?? []).filter(it => it.fulfillment?.includes('inStore'))
    for (const it of instore) {
      const pr = it.price ?? {}
      let potentialPrice = null;

      // Prioritize promo price if it's valid (> 0.01)
      const promoPrice = Number(pr.promo);
      if (!isNaN(promoPrice) && promoPrice > 0.01) {
          potentialPrice = promoPrice;
      } else {
          // Otherwise, try the regular price
          const regularPrice = Number(pr.regular);
          if (!isNaN(regularPrice) && regularPrice > 0.01) {
              potentialPrice = regularPrice;
          } else {
              // Fallback to other fields if necessary
              const fallbackRaw = pr.original ?? pr.final ?? pr.current ?? pr.retail ?? null;
              const fallbackPrice = Number(fallbackRaw);
              if (!isNaN(fallbackPrice) && fallbackPrice > 0.01) {
                  potentialPrice = fallbackPrice;
              }
          }
      }

      if (potentialPrice !== null && potentialPrice < 1) {
          potentialPrice = null; // filter unrealistically low
      }

      if (potentialPrice !== null) {
          price = potentialPrice;
          break;
      }
    }
    const isOrg = isOrganic(p)
    if (price == null) {
      // Log details if organic price extraction failed (No longer needed with fixed logic, but keep for now)
      if (isOrg) {
          // console.log(`  DEBUG Organic product price not found: ${p.description}`); // Keep commented out for now
          // console.log(`    Items:`, JSON.stringify(p.items, null, 2));           // Keep commented out for now
          orgPrices.push(null)
          orgDetails.push({ price: null, desc: p.description })
      } else {
          regPrices.push(null)
          regDetails.push({ price: null, desc: p.description })
      }
      // record presence but price unavailable (out of stock)
      // if (isOrg) orgPrices.push(null) // Now handled above
      // else regPrices.push(null)      // Now handled above
      continue
    }
    if (price != null && price < 1) price = null;
    if (isOrg) {
        orgPrices.push(price)
        orgDetails.push({ price, desc: p.description })
    } else {
        regPrices.push(price)
        regDetails.push({ price, desc: p.description })
    }
  }
  console.log(`⏺ store ${locationId}: regular dozen = ${regPrices.length}, organic dozen = ${orgPrices.length}`)
  // console.log(`  DEBUG orgPrices array:`, orgPrices); // Ensure this is removed or commented out

  if (orgPrices.length === 0) {
    // log sample dozen products that may be organic but not detected
    const sample = data.filter(isTwelveCountProduct).slice(0, 3)
    sample.forEach(s => {
      console.log('🧐 sample dozen product:', s.description, ' size:', s.items?.[0]?.size)
    })
  }

  const calc = (arr, fn) => {
    const nums = arr.filter(v => v != null && v > 0.01)
    return nums.length ? fn(nums) : null
  }
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

  let status
  const regHasPrice = regPrices.some(v=>v!=null)
  const orgHasPrice = orgPrices.some(v=>v!=null)
  if (!foundDozen) status = 'NO_DATA_FOUND'
  else if (!regHasPrice && !orgHasPrice) status = 'OUT_OF_STOCK'
  else status = 'OK'

  if (!regHasPrice && !orgHasPrice) return null // skip row if no priced cartons

  const now = new Date();
  const capturedDate = now.toISOString().split('T')[0]; // Extract YYYY-MM-DD

  // after the loop before calc
  console.log('⇢ Included regular products:', regDetails.map(d=>`${d.price} - ${d.desc}`))
  console.log('⇢ Included organic products:', orgDetails.map(d=>`${d.price} - ${d.desc}`))

  return {
    location_id: locationId,
    captured_at: now.toISOString(),
    captured_date: capturedDate, // Add the date-only field
    status,
    regular_min: calc(regPrices, (x) => Math.min(...x)),
    regular_avg: calc(regPrices, avg),
    regular_max: calc(regPrices, (x) => Math.max(...x)),
    organic_min: calc(orgPrices, (x) => Math.min(...x)),
    organic_avg: calc(orgPrices, avg),
    organic_max: calc(orgPrices, (x) => Math.max(...x)),
  }
}

// Parse CLI arguments to optionally limit run to specific store IDs
const args = process.argv.slice(2);
let onlyStores = [];
if (args.includes('--only')) {
  const idx = args.indexOf('--only');
  if (idx !== -1 && args[idx + 1]) {
    onlyStores = args[idx + 1].split(',');
    console.log(`🔍 Running only for stores: ${onlyStores.join(', ')}`);
  }
}

async function main() {
  console.time('egg-price-import')
  let storeIds = await fetchStoreIds()
  if (onlyStores.length) {
    storeIds = storeIds.filter(id => onlyStores.includes(id))
  }
  console.log(`📦 processing ${storeIds.length} stores`)

  // --- TEMPORARY LIMIT FOR TESTING (REMOVED) ---
  // storeIds = storeIds.slice(0, 10);
  // console.log(`🚨 TEMPORARY: Limiting run to first ${storeIds.length} stores for testing.`);
  // -------------------------------------------

  let processed = 0
  for (const loc of storeIds) {
    let row = null
    try {
      row = await summarizeEggPrices(loc)
    } catch (err) {
      console.warn('skip store', loc, err.message)
    }
    if (row) {
      // Perform upsert with proper onConflict array and capture data & error
      console.log(`Attempting to upsert store ${loc} with data: ${JSON.stringify(row)}`);
      const { data, error } = await sb.from('kroger_egg_prices_new').upsert(row, {
        onConflict: ['location_id', 'captured_date'], // unique key columns
        ignoreDuplicates: false,
      });
      console.log('Upsert response data:', data);
      if (error) {
        console.error('❌ Upsert failed for store', loc);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details || 'n/a');
        console.error('Error hint:', error.hint || 'n/a');
        console.error('Full error object:', error);
      } else {
        console.log(`✔︎ saved/updated store ${loc} for date ${row.captured_date} status=${row.status}`);
      }
    } else {
      console.log(`⚪️ skipped store ${loc} (no priced dozens found)`);
    }
    processed++
    if (processed % 100 === 0) console.log(`… processed ${processed}/${storeIds.length}`)
    await sleep(500)
  }
  console.timeEnd('egg-price-import')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}) 