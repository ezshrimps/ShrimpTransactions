import { NextRequest, NextResponse } from "next/server"
import { parseExpenseInput } from "@/lib/expense-parser"
import { createClient } from "@supabase/supabase-js"

// GET: 获取单个账单
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const incomingUserId = request.headers.get('x-user-id') || null
    if (!incomingUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const params = context.params instanceof Promise ? await context.params : context.params
    const id = params.id
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error("Supabase env missing:", { url: !!url, key: !!key })
      return NextResponse.json({ error: "Supabase env missing (URL/KEY)" }, { status: 500 })
    }
    const token = request.headers.get('authorization') || undefined
    const supabase = createClient(url, key, {
      global: token ? { headers: { Authorization: token } } : undefined,
    })
    const { data, error } = await supabase
      .from("bills")
      .select("id,name,raw_input,created_at,user_id")
      .eq("id", id)
      .maybeSingle()
    if (error) {
      console.error("Supabase select error:", error)
      return NextResponse.json({ error: error.message || "Supabase error" }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    if (data.user_id && data.user_id !== incomingUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rawInput = data.raw_input || ""
    const expenses = parseExpenseInput(rawInput)
    return NextResponse.json({
      id: data.id,
      name: data.name,
      rawInput,
      expenses,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    })
  } catch (error) {
    console.error("Error fetching bill:", error)
    return NextResponse.json({ error: (error as any)?.message || "Failed to fetch bill" }, { status: 500 })
  }
}

// PUT: 更新账单
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const incomingUserId = request.headers.get('x-user-id') || null
    if (!incomingUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const params = context.params instanceof Promise ? await context.params : context.params
    const id = params.id
    const { name, rawInput } = await request.json()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error("Supabase env missing:", { url: !!url, key: !!key })
      return NextResponse.json({ error: "Supabase env missing (URL/KEY)" }, { status: 500 })
    }
    const tokenPut = request.headers.get('authorization') || undefined
    const supabasePut = createClient(url, key, {
      global: tokenPut ? { headers: { Authorization: tokenPut } } : undefined,
    })
    const { error } = await supabasePut
      .from("bills")
      .update({ name, raw_input: rawInput || "" })
      .eq("id", id)
      .eq("user_id", incomingUserId)
    if (error) {
      console.error("Supabase update error:", error)
      return NextResponse.json({ error: error.message || "Supabase error" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating bill:", error)
    return NextResponse.json({ error: (error as any)?.message || "Failed to update bill" }, { status: 500 })
  }
}

// DELETE: 删除账单
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const incomingUserId = request.headers.get('x-user-id') || null
    if (!incomingUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const params = context.params instanceof Promise ? await context.params : context.params
    const id = params.id
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.error("Supabase env missing:", { url: !!url, key: !!key })
      return NextResponse.json({ error: "Supabase env missing (URL/KEY)" }, { status: 500 })
    }
    const tokenDel = request.headers.get('authorization') || undefined
    const supabaseDel = createClient(url, key, {
      global: tokenDel ? { headers: { Authorization: tokenDel } } : undefined,
    })
    const { error } = await supabaseDel
      .from("bills")
      .delete()
      .eq("id", id)
      .eq("user_id", incomingUserId)
    if (error) {
      console.error("Supabase delete error:", error)
      return NextResponse.json({ error: error.message || "Supabase error" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bill:", error)
    return NextResponse.json({ error: (error as any)?.message || "Failed to delete bill" }, { status: 500 })
  }
}

