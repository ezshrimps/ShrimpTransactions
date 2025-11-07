import { NextRequest, NextResponse } from "next/server"
import type { ExpenseConfig } from "@/app/page"
import { parseExpenseInput } from "@/lib/expense-parser"
import { createClient } from "@supabase/supabase-js"

// GET: 获取所有账单
export async function GET(request: NextRequest) {
  try {
    const incomingUserId = request.headers.get('x-user-id') || null
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error("Supabase env missing:", { url: !!url, key: !!key })
      return NextResponse.json({ error: "Supabase env missing (URL/KEY)" }, { status: 500 })
    }
    const supabase = createClient(url, key)
    
    // 如果有用户ID，只查询该用户的账单；否则查询所有（兼容未登录用户）
    let query = supabase
      .from("bills")
      .select("id,name,raw_input,created_at,user_id")
      .order("created_at", { ascending: false })
    
    if (incomingUserId) {
      query = query.eq("user_id", incomingUserId)
    }
    
    const { data, error } = await query
    if (error) {
      console.error("Supabase select error:", error)
      return NextResponse.json({ error: error.message || "Supabase error" }, { status: 500 })
    }

    const filtered = data || []

    const bills: ExpenseConfig[] = filtered.map((row: any) => ({
      id: row.id,
      name: row.name,
      rawInput: row.raw_input || "",
      expenses: parseExpenseInput(row.raw_input || ""),
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    }))

    return NextResponse.json(bills)
  } catch (error) {
    console.error("Error fetching bills:", error)
    return NextResponse.json({ error: (error as any)?.message || "Failed to fetch bills" }, { status: 500 })
  }
}

// POST: 创建新账单
export async function POST(request: NextRequest) {
  try {
    const { id, name, rawInput } = await request.json()
    const incomingUserId = request.headers.get('x-user-id') || null
    
    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error("Supabase env missing:", { url: !!url, key: !!key })
      return NextResponse.json({ error: "Supabase env missing (URL/KEY)" }, { status: 500 })
    }
    const supabasePost = createClient(url, key)
    const { error } = await supabasePost
      .from("bills")
      .insert({ id, name, raw_input: rawInput || "", user_id: incomingUserId })
    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: error.message || "Supabase error" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating bill:", error)
    return NextResponse.json({ error: (error as any)?.message || "Failed to create bill" }, { status: 500 })
  }
}

