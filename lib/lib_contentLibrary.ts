// lib/contentLibrary.ts
// Supabase query helpers for the content_library table.
// All functions are server-safe (use the Supabase client from lib/supabase.ts).

import { createClient } from '@supabase/supabase-js'
import type {
  ContentLibraryKey,
  HdType,
  HdAuthority,
  HdProfile,
  HdCenter,
  HdChannel,
  HdCenterName,
  HdCenterState,
} from './contentLibraryTypes'

export type {
  ContentLibraryKey,
  HdType,
  HdAuthority,
  HdProfile,
  HdCenter,
  HdChannel,
}

export {
  typeToKey,
  authorityToKey,
  profileToKey,
  centerToKey,
  channelToKey,
} from './contentLibraryTypes'

// ─── Supabase client ──────────────────────────────────────────────────────────
// Re-use the project's existing client pattern. Swap for your server client
// (service role) if calling from API routes / server components.

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// ─── Core fetchers ────────────────────────────────────────────────────────────

/**
 * Fetch a single content block by its exact key.
 * Returns null if the key doesn't exist.
 *
 * @example
 *   const body = await getContent('type_generator')
 */
export async function getContent(key: ContentLibraryKey): Promise<string | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('content_library')
    .select('body')
    .eq('key', key)
    .single()

  if (error || !data) return null
  return data.body
}

/**
 * Fetch multiple content blocks in a single query.
 * Returns a Map<key, body> so you can look up each block by key.
 *
 * @example
 *   const blocks = await getContentMany([
 *     'type_generator',
 *     'authority_sacral',
 *     'profile_1_3',
 *   ])
 *   const typeBody = blocks.get('type_generator')
 */
export async function getContentMany(
  keys: ContentLibraryKey[]
): Promise<Map<ContentLibraryKey, string>> {
  if (keys.length === 0) return new Map()

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('content_library')
    .select('key, body')
    .in('key', keys)

  if (error || !data) return new Map()

  return new Map(data.map((row) => [row.key as ContentLibraryKey, row.body]))
}

// ─── Typed convenience fetchers ───────────────────────────────────────────────

/** Fetch content for a specific HD Type. */
export async function getTypeContent(key: HdType): Promise<string | null> {
  return getContent(key)
}

/** Fetch content for a specific Authority. */
export async function getAuthorityContent(key: HdAuthority): Promise<string | null> {
  return getContent(key)
}

/** Fetch content for a specific Profile. */
export async function getProfileContent(key: HdProfile): Promise<string | null> {
  return getContent(key)
}

/** Fetch content for a specific Center (defined or open). */
export async function getCenterContent(key: HdCenter): Promise<string | null> {
  return getContent(key)
}

/** Fetch content for a specific Channel. */
export async function getChannelContent(key: HdChannel): Promise<string | null> {
  return getContent(key)
}

// ─── Report assembly helper ───────────────────────────────────────────────────

export interface ChartContentInput {
  /** e.g. 'type_generator' */
  typeKey: HdType
  /** e.g. 'authority_sacral' */
  authorityKey: HdAuthority
  /** e.g. 'profile_1_3' */
  profileKey: HdProfile
  /**
   * All 9 centers with their defined/open state.
   * e.g. [{ name: 'head', defined: false }, { name: 'sacral', defined: true }, ...]
   */
  centers: Array<{ name: HdCenterName; defined: boolean }>
  /**
   * Only the user's active channels.
   * e.g. [{ gate1: 1, gate2: 8 }, { gate1: 34, gate2: 57 }]
   */
  channels: Array<{ gate1: number; gate2: number }>
}

export interface ChartContent {
  type: string
  authority: string
  profile: string
  /** Map from center key → body text */
  centers: Map<HdCenter, string>
  /** Map from channel key → body text */
  channels: Map<HdChannel, string>
}

/**
 * Fetch ALL content blocks needed to render a user's full HD report in one
 * round-trip. Returns a structured object ready for the PDF assembler.
 *
 * @example
 *   const content = await getChartContent({
 *     typeKey:      'type_generator',
 *     authorityKey: 'authority_sacral',
 *     profileKey:   'profile_1_3',
 *     centers: [
 *       { name: 'head',         defined: false },
 *       { name: 'ajna',         defined: false },
 *       { name: 'throat',       defined: true  },
 *       { name: 'g',            defined: true  },
 *       { name: 'heart',        defined: false },
 *       { name: 'sacral',       defined: true  },
 *       { name: 'solar_plexus', defined: false },
 *       { name: 'spleen',       defined: true  },
 *       { name: 'root',         defined: false },
 *     ],
 *     channels: [
 *       { gate1: 34, gate2: 57 },
 *       { gate1: 10, gate2: 57 },
 *     ],
 *   })
 */
export async function getChartContent(
  input: ChartContentInput
): Promise<ChartContent> {
  const { typeKey, authorityKey, profileKey, centers, channels } = input

  // Build center keys
  const centerKeys: HdCenter[] = centers.map(({ name, defined }) => {
    const state: HdCenterState = defined ? 'defined' : 'open'
    return `center_${name}_${state}` as HdCenter
  })

  // Build channel keys (lower gate first)
  const channelKeys: HdChannel[] = channels.map(({ gate1, gate2 }) => {
    const [lo, hi] = gate1 < gate2 ? [gate1, gate2] : [gate2, gate1]
    return `channel_${lo}_${hi}` as HdChannel
  })

  // Single query for everything
  const allKeys: ContentLibraryKey[] = [
    typeKey,
    authorityKey,
    profileKey,
    ...centerKeys,
    ...channelKeys,
  ]

  const blocks = await getContentMany(allKeys)

  // Assemble structured result
  const centerMap = new Map<HdCenter, string>()
  for (const key of centerKeys) {
    const body = blocks.get(key)
    if (body) centerMap.set(key, body)
  }

  const channelMap = new Map<HdChannel, string>()
  for (const key of channelKeys) {
    const body = blocks.get(key)
    if (body) channelMap.set(key, body)
  }

  return {
    type:      blocks.get(typeKey)      ?? '',
    authority: blocks.get(authorityKey) ?? '',
    profile:   blocks.get(profileKey)   ?? '',
    centers:   centerMap,
    channels:  channelMap,
  }
}
