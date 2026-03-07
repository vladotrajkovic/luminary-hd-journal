import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Use in Client Components
export const createBrowserClient = () => createClientComponentClient()

// Database types
export type HDType = 'Manifestor' | 'Generator' | 'Manifesting Generator' | 'Projector' | 'Reflector'
export type HDAuthority = 
  | 'Sacral' 
  | 'Emotional/Solar Plexus' 
  | 'Splenic' 
  | 'Ego/Heart'
  | 'G Center/Self' 
  | 'Mental/Environment' 
  | 'Lunar'
  | 'None/Outer Authority'

export type Profile = {
  id: string
  email: string
  full_name: string
  hd_type: HDType | null
  hd_authority: HDAuthority | null
  hd_profile: string | null
  hd_definition: string | null
  hd_incarnation_cross: string | null
  birth_date: string | null
  birth_time: string | null
  birth_city: string | null
  birth_country: string | null
  defined_centers: string[]
  active_gates: string[]
  active_channels: string[]
  notes: string | null
  created_at: string
}

export type JournalEntry = {
  id: string
  user_id: string
  entry_date: string
  title: string | null
  morning_reflection: string | null
  strategy_check: string | null
  authority_check: string | null
  open_centers_log: string | null
  deconditioning_notes: string | null
  body_awareness: string | null
  synchronicities: string | null
  gratitude: string | null
  evening_reflection: string | null
  energy_level: number | null
  followed_strategy: boolean | null
  mood_tags: string[]
  gate_of_the_day: string | null
  created_at: string
}

export type TransitLog = {
  id: string
  user_id: string
  log_date: string
  moon_phase: string | null
  current_gate: string | null
  transit_notes: string | null
  how_i_felt: string | null
  created_at: string
}
