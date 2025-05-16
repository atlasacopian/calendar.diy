import { supabaseServer } from '../../../lib/supabase'

export async function GET() {
  const sb = supabaseServer()

  // Define "today" in UTC
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayStartIso = todayStart.toISOString()

  const todayEnd = new Date()
  todayEnd.setUTCHours(23, 59, 59, 999)
  const todayEndIso = todayEnd.toISOString()

  const fetchPrices = async (table, brand) => {
    if (table === 'kroger_egg_prices_new') {
      const { data, error } = await sb
        .from(table)
        .select('location_id, regular_avg, organic_avg, captured_at')
        .gte('captured_at', todayStartIso)
        .lte('captured_at', todayEndIso)
        .limit(50000)
      if (error) {
        console.warn(`Error fetching ${table}`, error)
        return []
      }
      const transformed = []
      ;(data || []).forEach(r => {
        if (r.regular_avg != null) {
          transformed.push({ store_id: r.location_id, product_type: 'regular', avg_price: r.regular_avg, captured_at: r.captured_at, brand })
        }
        if (r.organic_avg != null) {
          transformed.push({ store_id: r.location_id, product_type: 'organic', avg_price: r.organic_avg, captured_at: r.captured_at, brand })
        }
      })
      return transformed
    } else { // Handles target_egg_price_stats
      const { data, error } = await sb
        .from(table)
        .select('store_id, product_type, avg_price, captured_at')
        .gte('captured_at', todayStartIso)
        .lte('captured_at', todayEndIso)
        .limit(50000)
      if (error) {
        console.warn(`Error fetching ${table}`, error)
        return []
      }
      return (data || []).map(r => ({ ...r, brand }))
    }
  }

  const krogerPrices = await fetchPrices('kroger_egg_prices_new', 'Kroger')
  const targetPrices = await fetchPrices('target_egg_price_stats', 'Target')

  console.log(`Fetched ${krogerPrices.length} Kroger prices (transformed).`);
  console.log(`Fetched ${targetPrices.length} Target prices.`);

  const all = [...krogerPrices, ...targetPrices]

  if (!all.length) {
    return Response.json({ error: 'No data for today' }, { status: 404 })
  }

  console.log('Sample of combined data (first 5 entries with brand):');
  all.slice(0, 5).forEach(p => console.log({ store_id: p.store_id, product_type: p.product_type, avg_price: p.avg_price, brand: p.brand, captured_at: p.captured_at }));

  // No longer need latestMap, use 'all' directly for today's data
  const latestArr = all // Rename for minimal changes below, but it's all of today's data

  const findExtreme = (type, kind) => {
    const arr = latestArr.filter(r => r.product_type === type && typeof r.avg_price === 'number')
    if (!arr.length) return null
    return arr.reduce((prev, curr) => {
      return kind === 'min' ? (curr.avg_price < prev.avg_price ? curr : prev) : (curr.avg_price > prev.avg_price ? curr : prev)
    })
  }

  const minReg = findExtreme('regular', 'min')
  const maxReg = findExtreme('regular', 'max')
  const minOrg = findExtreme('organic', 'min')
  const maxOrg = findExtreme('organic', 'max')

  const fetchStoreMeta = async (storeId) => {
    let { data } = await sb
      .from('stores')
      .select('name, city, state')
      .eq('store_identifier', storeId) // This will likely be Kroger's location_id or Target's store_id
      .maybeSingle()
    if (data) return data

    // Kroger stores are identified by location_id, which is text. Try direct match.
    if (typeof storeId === 'string' && !storeId.startsWith('T')) { // Heuristic: Kroger IDs aren't purely numeric like Target's
       const { data: kg } = await sb
        .from('kroger_stores')
        .select('name, city, state')
        .eq('location_id', storeId) // Querying by location_id for Kroger stores
        .maybeSingle()
      if (kg) return kg
    }
    
    // Target stores might be T + numeric ID or just numeric
    const numericStoreId = typeof storeId === 'string' && storeId.startsWith('T') ? storeId.substring(1) : storeId;
    const { data: tg } = await sb
      .from('target_stores')
      .select('name, city, state')
      .eq('store_id', numericStoreId) // Querying by store_id for Target stores
      .maybeSingle()
    if (tg) return tg

    return { name: String(storeId) } // Ensure name is a string
  }

  const decorate = async (rec) => {
    if (!rec) return null
    const meta = await fetchStoreMeta(rec.store_id) // rec.store_id is now Kroger location_id or Target store_id
    return { price: rec.avg_price, store_id: rec.store_id, brand: rec.brand, updated_at: rec.captured_at, ...meta }
  }

  const cheapest_regular = await decorate(minReg)
  const priciest_regular = await decorate(maxReg)
  const cheapest_organic = await decorate(minOrg)
  const priciest_organic = await decorate(maxOrg)

  // --- Fetch National Averages (FRED for regular, USDA for organic) ---
  let avgRegNat = null, avgRegNatDate = null, avgOrgNat = null, avgOrgNatDate = null;
  try {
    const fredKey = process.env.FRED_API_KEY;
    if (fredKey) {
      const regSeries = 'APU0000703111';
      const fredRes = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${regSeries}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`
      );
      const fredJson = await fredRes.json();
      if (fredRes.ok && !fredJson.error_code) {
        const obs = fredJson.observations?.[0];
        if (obs?.value != null && obs.value !== '.') avgRegNat = parseFloat(obs.value);
        avgRegNatDate = obs?.date || null;
      }
    }
  } catch (err) {
    console.error('FRED Error', err);
  }
  try {
    // USDA national averages table
    const { data: usdaData, error: usdaError } = await sb
      .from('national_averages')
      .select('organic_price, date')
      .eq('source', 'USDA')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (usdaError) console.error('USDA fetch error:', usdaError);
    else if (usdaData) {
      avgOrgNat = usdaData.organic_price;
      avgOrgNatDate = usdaData.date;
    }
  } catch (err) {
    console.error('USDA Error', err);
  }

  return Response.json({
    cheapest_regular,
    priciest_regular,
    cheapest_organic,
    priciest_organic,
    avgRegNat,
    avgRegNatDate,
    avgOrgNat,
    avgOrgNatDate,
    generated_at: new Date().toISOString(),
  })
}