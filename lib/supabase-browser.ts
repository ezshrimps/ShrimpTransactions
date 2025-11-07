"use client"

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createClient(url, anonKey)

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabaseBrowser.auth.getSession()
    return data.session?.access_token || null
  } catch {
    return null
  }
}


