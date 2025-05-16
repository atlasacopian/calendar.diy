import { supabaseServer } from '../../../lib/supabase'

// Helper to get a specific day's start and end ISO strings
function getDayIsoRange(date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

// Helper to fetch and transform price data for a given day
async function fetchPriceDataForRange(sb, table, brand, startIso, endIso) {
  let records = [];
  if (table === 'kroger_egg_prices_new') {
    const { data, error } = await sb
      .from(table)
      .select('location_id, regular_min, organic_min, captured_at')
      .gte('captured_at', startIso)
      .lte('captured_at', endIso);
    if (error) {
      console.warn(`Error fetching ${table} for ${brand} in range`, error);
      return [];
    }
    (data || []).forEach(r => {
      if (r.regular_min != null) {
        records.push({ store_id: r.location_id, product_type: 'regular', price: r.regular_min, brand, captured_at: r.captured_at });
      }
      if (r.organic_min != null) {
        records.push({ store_id: r.location_id, product_type: 'organic', price: r.organic_min, brand, captured_at: r.captured_at });
      }
    });
  } else if (table === 'target_egg_price_stats') {
    const { data, error } = await sb
      .from(table)
      .select('store_id, product_type, avg_price, captured_at')
      .gte('captured_at', startIso)
      .lte('captured_at', endIso);
    if (error) {
      console.warn(`Error fetching ${table} for ${brand} in range`, error);
      return [];
    }
    (data || []).forEach(r => {
        if (r.avg_price != null && r.product_type) {
             records.push({ store_id: r.store_id, product_type: r.product_type, price: r.avg_price, brand, captured_at: r.captured_at });
        }
    });
  }
  return records;
}

export async function GET(req) {
  console.log('--- EXECUTING STORES API (with daily min change) ---');
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get('zip');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  let latitude = lat;
  let longitude = lon;
  const radiusMiles = parseInt(searchParams.get('radiusMiles') || '3');
  const storeLimit = parseInt(searchParams.get('limit') || '20');

  if ((!latitude || !longitude) && zip) {
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        latitude = geo?.places?.[0]?.latitude;
        longitude = geo?.places?.[0]?.longitude;
      } else { console.warn(`Failed to geocode zip ${zip}. Status: ${geoRes.status}`); }
    } catch (e) { console.warn('Zip geocode failed', e); }
  }

  const sb = supabaseServer();

  const todayRange = getDayIsoRange(new Date());
  
  // Define range for recent historical prices (e.g., 7 days before today)
  const historicalEndDate = new Date(todayRange.startIso);
  historicalEndDate.setMilliseconds(historicalEndDate.getMilliseconds() - 1); // End just before today starts
  // Use entire history so we can always grab the most recent prior price
  const historicalStartDate = new Date(0); // epoch
  const historicalRange = { startIso: historicalStartDate.toISOString(), endIso: historicalEndDate.toISOString() };

  // Pre-fetch price data
  const [
    krogerTodaysPrices, targetTodaysPrices,
    krogerHistoricalPrices, targetHistoricalPrices
  ] = await Promise.all([
    fetchPriceDataForRange(sb, 'kroger_egg_prices_new', 'Kroger', todayRange.startIso, todayRange.endIso),
    fetchPriceDataForRange(sb, 'target_egg_price_stats', 'Target', todayRange.startIso, todayRange.endIso),
    fetchPriceDataForRange(sb, 'kroger_egg_prices_new', 'Kroger', historicalRange.startIso, historicalRange.endIso),
    fetchPriceDataForRange(sb, 'target_egg_price_stats', 'Target', historicalRange.startIso, historicalRange.endIso)
  ]);

  const allTodaysPrices = [...krogerTodaysPrices, ...targetTodaysPrices];
  const allRecentHistoricalPrices = [...krogerHistoricalPrices, ...targetHistoricalPrices];
  
  console.log(`Pre-fetched ${allTodaysPrices.length} price points for today.`);
  console.log(`Pre-fetched ${allRecentHistoricalPrices.length} historical price points (last 7 days prior).`);

  let allStores = [];

  if (latitude && longitude) {
    // Process Kroger Stores
    try {
      const { data: nearbyKrogerStores, error: krogerRpcError } = await sb.rpc('nearby_kroger_stores', {
        lat_in: parseFloat(latitude),
        lon_in: parseFloat(longitude),
        radius_miles: parseInt(radiusMiles)
      });
      if (krogerRpcError) console.error('Kroger RPC error:', krogerRpcError);
      else if (nearbyKrogerStores) {
        nearbyKrogerStores.forEach(store => {
          const storeTodayPrices = allTodaysPrices.filter(p => p.store_id === store.location_id && p.brand === 'Kroger');
          // Find most recent historical price for this Kroger store
          const storeHistoricalRegPrices = allRecentHistoricalPrices.filter(p => p.store_id === store.location_id && p.brand === 'Kroger' && p.product_type === 'regular').sort((a,b) => new Date(b.captured_at) - new Date(a.captured_at));
          const storeHistoricalOrgPrices = allRecentHistoricalPrices.filter(p => p.store_id === store.location_id && p.brand === 'Kroger' && p.product_type === 'organic').sort((a,b) => new Date(b.captured_at) - new Date(a.captured_at));
          
          const todayRegMin = storeTodayPrices.find(p => p.product_type === 'regular')?.price;
          const todayOrgMin = storeTodayPrices.find(p => p.product_type === 'organic')?.price;
          
          const previousRegMin = storeHistoricalRegPrices[0]?.price;
          const previousOrgMin = storeHistoricalOrgPrices[0]?.price;

          let regChange = null;
          if (todayRegMin != null && previousRegMin != null && previousRegMin !== 0) {
            regChange = ((todayRegMin - previousRegMin) / previousRegMin) * 100;
          }
          let orgChange = null;
          if (todayOrgMin != null && previousOrgMin != null && previousOrgMin !== 0) {
            orgChange = ((todayOrgMin - previousOrgMin) / previousOrgMin) * 100;
          }
          
          const latestCapture = storeTodayPrices.reduce((latest, p) => (p.captured_at && new Date(p.captured_at) > new Date(latest) ? p.captured_at : latest), new Date(0).toISOString());

          allStores.push({
            name: store.name.replace(/^Kroger - /, '') || store.location_id,
            address: store.address, city: store.city, state: store.state, zip: store.zip,
            distance: store.distance_miles,
            brand: 'Kroger',
            store_identifier: store.location_id, 
            regular_price: todayRegMin,
            organic_price: todayOrgMin,
            regular_change_vs_yesterday_min: regChange,
            organic_change_vs_yesterday_min: orgChange,
            regular_diff_vs_yesterday_min: todayRegMin != null && previousRegMin != null ? todayRegMin - previousRegMin : null,
            organic_diff_vs_yesterday_min: todayOrgMin != null && previousOrgMin != null ? todayOrgMin - previousOrgMin : null,
            updated_at: latestCapture !== new Date(0).toISOString() ? latestCapture : null,
          });
        });
      }
    } catch(e) { console.error("Error processing Kroger stores:", e); }

    // Process Target Stores
    try {
        const { data: nearbyTargetStores, error: targetRpcError } = await sb.rpc('nearby_target_stores', {
            lat_in: parseFloat(latitude), lon_in: parseFloat(longitude), radius_miles: parseInt(radiusMiles)
        });
        if (targetRpcError) console.error('Target RPC error:', targetRpcError);
        else if (nearbyTargetStores) {
            nearbyTargetStores.forEach(store => {
                const storeTodayPrices_Target = allTodaysPrices.filter(p => p.store_id === String(store.store_id) && p.brand === 'Target');
                
                const findMinPrice = (prices, type) => {
                    const typePrices = prices.filter(p => p.product_type === type).map(p => p.price);
                    return typePrices.length > 0 ? Math.min(...typePrices) : null;
                };

                const todayRegMin_Target = findMinPrice(storeTodayPrices_Target, 'regular');
                const todayOrgMin_Target = findMinPrice(storeTodayPrices_Target, 'organic');

                // Find most recent historical price for this Target store
                const storeHistoricalRegPrices_Target = allRecentHistoricalPrices.filter(p => p.store_id === String(store.store_id) && p.brand === 'Target' && p.product_type === 'regular').sort((a,b) => new Date(b.captured_at) - new Date(a.captured_at));
                const storeHistoricalOrgPrices_Target = allRecentHistoricalPrices.filter(p => p.store_id === String(store.store_id) && p.brand === 'Target' && p.product_type === 'organic').sort((a,b) => new Date(b.captured_at) - new Date(a.captured_at));

                const previousRegMin_Target = storeHistoricalRegPrices_Target.length > 0 ? findMinPrice(storeHistoricalRegPrices_Target, 'regular') : null; // Need to find min among historical too if multiple entries for latest day
                const previousOrgMin_Target = storeHistoricalOrgPrices_Target.length > 0 ? findMinPrice(storeHistoricalOrgPrices_Target, 'organic') : null;
                
                let regChange_Target = null;
                if (todayRegMin_Target != null && previousRegMin_Target != null && previousRegMin_Target !== 0) {
                    regChange_Target = ((todayRegMin_Target - previousRegMin_Target) / previousRegMin_Target) * 100;
                }
                let orgChange_Target = null;
                if (todayOrgMin_Target != null && previousOrgMin_Target != null && previousOrgMin_Target !== 0) {
                    orgChange_Target = ((todayOrgMin_Target - previousOrgMin_Target) / previousOrgMin_Target) * 100;
                }

                const latestCapture_Target = storeTodayPrices_Target.reduce((latest, p) => (p.captured_at && new Date(p.captured_at) > new Date(latest) ? p.captured_at : latest), new Date(0).toISOString());

                allStores.push({
                    name: store.name || `Target ${store.store_id}`,
                    address: store.address, city: store.city, state: store.state, zip: store.zip,
                    distance: store.distance,
                    brand: 'Target',
                    store_identifier: String(store.store_id), 
                    regular_price: todayRegMin_Target,
                    organic_price: todayOrgMin_Target,
                    regular_change_vs_yesterday_min: regChange_Target,
                    organic_change_vs_yesterday_min: orgChange_Target,
                    regular_diff_vs_yesterday_min: todayRegMin_Target != null && previousRegMin_Target != null ? todayRegMin_Target - previousRegMin_Target : null,
                    organic_diff_vs_yesterday_min: todayOrgMin_Target != null && previousOrgMin_Target != null ? todayOrgMin_Target - previousOrgMin_Target : null,
                    updated_at: latestCapture_Target !== new Date(0).toISOString() ? latestCapture_Target : null,
                });
            });
        }
    } catch(e) { console.error("Error processing Target stores:", e); }
  } else {
    console.warn('Skipping store fetch due to missing coordinates.');
  }

  allStores.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  const finalStores = allStores.slice(0, storeLimit);
  
  const overallLastUpdated = finalStores.reduce((max, store) => {
    if (store.updated_at && new Date(store.updated_at) > new Date(max)) return store.updated_at;
    return max;
  }, new Date(0).toISOString());

  // --- Fetch National Averages (FRED, USDA) --- (This part remains unchanged for now)
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
      } else { console.warn('FRED error:', fredJson.error_message || `Status ${fredRes.status}`); }
    } else { console.warn("FRED_API_KEY missing"); }
  } catch(err) { console.error("FRED Error", err); }
   
  try {
    const usdaKey = process.env.USDA_API_KEY;
    if (usdaKey) { 
      const { data: usdaData, error: usdaError } = await sb
        .from('national_averages')
        .select('organic_price, date')
        .eq('source', 'USDA')
        .order('date', { ascending: false })
        .limit(1).maybeSingle();
      if (usdaError) console.error('Error fetching USDA average:', usdaError);
      else if (usdaData) {
        avgOrgNat = usdaData.organic_price;
        avgOrgNatDate = usdaData.date;
      }
    } else { console.warn("USDA_API_KEY missing"); }
  } catch(err) { console.error("USDA Error", err); }

  return Response.json({
    stores: finalStores,
    lastUpdated: overallLastUpdated !== new Date(0).toISOString() ? overallLastUpdated : null,
    avgRegNat, avgRegNatDate, avgOrgNat, avgOrgNatDate
  });
}
