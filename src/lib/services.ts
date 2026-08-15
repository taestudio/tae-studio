import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export type Service = {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  price_display: string
  price_dollars: number
  badge_text: string
  accent_color: 'gold' | 'lavender'
  cta_href: string
  page_href: string
  image_url: string
  icon: string
  features: string[]
  sort_order: number
  is_active: boolean
  is_featured: boolean
  stripe_price_id: string | null
  download_url: string | null
  created_at: string
  updated_at: string
}

export function useServices(activeOnly = true) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      let query = supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
      if (activeOnly) query = query.eq('is_active', true)
      const { data, error: err } = await query
      if (!cancelled) {
        if (err) setError(err.message)
        else setServices((data ?? []) as Service[])
        setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [activeOnly])

  return { services, loading, error, setServices }
}

export async function fetchServiceBySlug(slug: string): Promise<Service | null> {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data as Service | null
}

export async function fetchAllServices(): Promise<Service[]> {
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
  return (data ?? []) as Service[]
}
