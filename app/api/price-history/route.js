import { supabaseServer } from '../../../lib/supabase'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('store_id')
  const productType = searchParams.get('product_type') || 'regular' // Default to regular

  if (!storeId) {
    return Response.json({ error: 'store_id is required' }, { status: 400 })
  }

  const sb = supabaseServer()
  let query
  let isKroger = false // Flag to determine if it's a Kroger store_id (location_id)

  // Heuristic: Kroger location_ids are often longer and not purely numeric, or don't start with 'T'
  // Target store_ids from target_egg_price_stats might be just numbers, or T + number
  if (typeof storeId === 'string' && !storeId.startsWith('T') && isNaN(Number(storeId.substring(1)))) {
    isKroger = true
  }
  if (storeId.startsWith('K')) { // More explicit Kroger check if you use K-prefixes
      isKroger = true;
  }

  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 90); // Fetch last 90 days of history
  const dateLimitIso = dateLimit.toISOString();

  if (isKroger) {
    const priceColumn = productType === 'organic' ? 'organic_avg' : 'regular_avg'
    query = sb
      .from('kroger_egg_prices_new')
      .select(`captured_at, ${priceColumn}`)
      .eq('location_id', storeId)
      .gte('captured_at', dateLimitIso)
      .order('captured_at', { ascending: true })
  } else {
    // Assuming Target or other stores that use a numeric store_id or T-prefixed numeric ID
    const actualStoreId = storeId.startsWith('T') ? storeId.substring(1) : storeId;
    query = sb
      .from('target_egg_price_stats') // Assuming target_egg_price_stats for non-Kroger
      .select('captured_at, avg_price')
      .eq('store_id', actualStoreId)
      .eq('product_type', productType)
      .gte('captured_at', dateLimitIso)
      .order('captured_at', { ascending: true })
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching price history:', error)
    return Response.json({ error: 'Failed to fetch price history', details: error.message }, { status: 500 })
  }

  const chartData = (data || []).map(r => ({
    date: r.captured_at,
    price: isKroger ? r[productType === 'organic' ? 'organic_avg' : 'regular_avg'] : r.avg_price,
  })).filter(d => d.price != null); // Ensure no null prices make it to chart

  return Response.json(chartData)
} 