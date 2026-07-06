import { isSupabaseConfigured } from '../env';

import { tryGetSupabase } from '../supabase/client';

import {

  clearStradaSession,

  isStradaSessionValid,

  readStradaSession,

} from './sessionStorage';



/** Token Bearer para llamadas al API Strada. Prioriza JWT propio; Supabase es fallback transitorio. */

export async function getBackendAccessToken(): Promise<string | null> {

  const session = readStradaSession();

  if (isStradaSessionValid(session)) {

    return session!.accessToken;

  }

  if (session) await clearStradaSession();



  if (!isSupabaseConfigured()) return null;

  const sb = tryGetSupabase();

  if (!sb) return null;

  const { data } = await sb.auth.getSession();

  return data.session?.access_token ?? null;

}


