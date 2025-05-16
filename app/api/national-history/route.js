import { supabaseServer } from '../../../lib/supabase'

export async function GET() {
  const sb = supabaseServer()

  // Fetch weekly USDA national prices and pivot regular vs organic by ref_date
  let history = []
  try {
    const { data, error } = await sb
      .from('usda_weekly_egg_prices')
      .select('ref_date, product_type, price')
      .order('ref_date', { ascending: true })
    if (error) {
      console.error('Error fetching usda_weekly_egg_prices:', error)
    } else if (data) {
      const map = new Map()
      data.forEach(r => {
        const d = r.ref_date
        const entry = map.get(d) || { date: d }
        if (r.product_type === 'regular') entry.regular = r.price
        if (r.product_type === 'organic') entry.organic = r.price
        map.set(d, entry)
      })
      history = Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
    }
  } catch (err) {
    console.error('Error fetching USDA weekly history:', err)
  }

  return Response.json({ data: history })
} 