// lib/contentLibraryTypes.ts
// Typed keys for every entry in the content_library table.
// Use these when calling contentLibrary helpers to get autocomplete + safety.

// ─── Types ────────────────────────────────────────────────────────────────────

export type HdType =
  | 'type_generator'
  | 'type_manifesting_generator'
  | 'type_manifestor'
  | 'type_projector'
  | 'type_reflector'

// ─── Authorities ──────────────────────────────────────────────────────────────

export type HdAuthority =
  | 'authority_sacral'
  | 'authority_emotional'
  | 'authority_splenic'
  | 'authority_ego_manifested'
  | 'authority_ego_projected'
  | 'authority_self_projected'
  | 'authority_mental_projector'
  | 'authority_lunar'

// ─── Profiles ─────────────────────────────────────────────────────────────────

export type HdProfile =
  | 'profile_1_3'
  | 'profile_1_4'
  | 'profile_2_4'
  | 'profile_2_5'
  | 'profile_3_5'
  | 'profile_3_6'
  | 'profile_4_6'
  | 'profile_4_1'
  | 'profile_5_1'
  | 'profile_5_2'
  | 'profile_6_2'
  | 'profile_6_3'

// ─── Centers ──────────────────────────────────────────────────────────────────

export type HdCenterName =
  | 'head'
  | 'ajna'
  | 'throat'
  | 'g'
  | 'heart'
  | 'sacral'
  | 'solar_plexus'
  | 'spleen'
  | 'root'

export type HdCenterState = 'defined' | 'open'

export type HdCenter = `center_${HdCenterName}_${HdCenterState}`

// ─── Channels ─────────────────────────────────────────────────────────────────

export type HdChannel =
  | 'channel_1_8'
  | 'channel_2_14'
  | 'channel_3_60'
  | 'channel_4_63'
  | 'channel_5_15'
  | 'channel_6_59'
  | 'channel_7_31'
  | 'channel_9_52'
  | 'channel_10_20'
  | 'channel_10_34'
  | 'channel_10_57'
  | 'channel_11_56'
  | 'channel_12_22'
  | 'channel_13_33'
  | 'channel_16_48'
  | 'channel_17_62'
  | 'channel_18_58'
  | 'channel_19_49'
  | 'channel_20_34'
  | 'channel_20_57'
  | 'channel_21_45'
  | 'channel_23_43'
  | 'channel_24_61'
  | 'channel_25_51'
  | 'channel_26_44'
  | 'channel_27_50'
  | 'channel_28_38'
  | 'channel_29_46'
  | 'channel_30_41'
  | 'channel_32_54'
  | 'channel_34_57'
  | 'channel_35_36'
  | 'channel_37_40'
  | 'channel_39_55'
  | 'channel_42_53'
  | 'channel_47_64'

// ─── Union ────────────────────────────────────────────────────────────────────

export type ContentLibraryKey =
  | HdType
  | HdAuthority
  | HdProfile
  | HdCenter
  | HdChannel

// ─── Helper: build keys from chart data ───────────────────────────────────────

/**
 * Convert a Human Design type string (as returned by the chart calculator)
 * into the matching content_library key.
 *
 * @example typeToKey('Generator') // → 'type_generator'
 */
export function typeToKey(type: string): HdType {
  const slug = type.toLowerCase().replace(/\s+/g, '_')
  return `type_${slug}` as HdType
}

/**
 * Convert an authority string into the matching content_library key.
 *
 * @example authorityToKey('Solar Plexus') // → 'authority_emotional'
 */
export function authorityToKey(authority: string): HdAuthority {
  const map: Record<string, HdAuthority> = {
    'sacral':             'authority_sacral',
    'solar plexus':       'authority_emotional',
    'emotional':          'authority_emotional',
    'splenic':            'authority_splenic',
    'spleen':             'authority_splenic',
    'ego manifested':     'authority_ego_manifested',
    'ego projected':      'authority_ego_projected',
    'self-projected':     'authority_self_projected',
    'self projected':     'authority_self_projected',
    'mental projector':   'authority_mental_projector',
    'mental':             'authority_mental_projector',
    'lunar':              'authority_lunar',
    'moon':               'authority_lunar',
  }
  const key = authority.toLowerCase().trim()
  const result = map[key]
  if (!result) throw new Error(`Unknown authority: "${authority}"`)
  return result
}

/**
 * Convert profile lines into the matching content_library key.
 *
 * @example profileToKey(1, 3) // → 'profile_1_3'
 */
export function profileToKey(line1: number, line2: number): HdProfile {
  return `profile_${line1}_${line2}` as HdProfile
}

/**
 * Convert a center name + defined state into the matching content_library key.
 *
 * @example centerToKey('Solar Plexus', true) // → 'center_solar_plexus_defined'
 */
export function centerToKey(centerName: string, defined: boolean): HdCenter {
  const nameMap: Record<string, HdCenterName> = {
    'head':         'head',
    'ajna':         'ajna',
    'throat':       'throat',
    'g':            'g',
    'g center':     'g',
    'identity':     'g',
    'heart':        'heart',
    'ego':          'heart',
    'will':         'heart',
    'sacral':       'sacral',
    'solar plexus': 'solar_plexus',
    'emotional':    'solar_plexus',
    'spleen':       'spleen',
    'splenic':      'spleen',
    'root':         'root',
  }
  const slug = nameMap[centerName.toLowerCase().trim()]
  if (!slug) throw new Error(`Unknown center: "${centerName}"`)
  const state: HdCenterState = defined ? 'defined' : 'open'
  return `center_${slug}_${state}`
}

/**
 * Convert a channel's two gate numbers into the matching content_library key.
 * Always puts the lower gate number first.
 *
 * @example channelToKey(34, 57) // → 'channel_34_57'
 * @example channelToKey(57, 34) // → 'channel_34_57'
 */
export function channelToKey(gate1: number, gate2: number): HdChannel {
  const [lo, hi] = gate1 < gate2 ? [gate1, gate2] : [gate2, gate1]
  return `channel_${lo}_${hi}` as HdChannel
}
