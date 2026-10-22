import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase connection. URL and anon key are public by design (access is enforced by
 * row-level security in supabase/schema.sql). Without them the planner runs in
 * local mode: plans stay in this browser.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

/** A second client that never touches the signed-in session — used to create client accounts. */
export const signupClient = (): SupabaseClient | null =>
  url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'yp-signup' } }) : null

/** Readable random password, e.g. «kafu-4729-mepo». */
export function generatePassword(): string {
  const consonants = 'bcdfghjkmnprstvz'
  const vowels = 'aeiou'
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n
  const syl = () => consonants[rnd(consonants.length)] + vowels[rnd(vowels.length)]
  const digits = String(1000 + rnd(9000))
  return `${syl()}${syl()}-${digits}-${syl()}${syl()}`
}
