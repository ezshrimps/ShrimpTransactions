import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { ExpenseConfig } from "@/app/page"
import { parseExpenseInput } from "@/lib/expense-parser"

const DATA_DIR = path.join(process.cwd(), "data")

// 确保data目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// 从文件名解析ID和名称
function parseFilename(filename: string): { id: string; name: string } | null {
  // 格式: {id}-{name}.txt
  const match = filename.match(/^(.+?)-(.+)\.txt$/)
  if (!match) return null
  
  return {
    id: match[1],
    name: decodeURIComponent(match[2]),
  }
}

// 生成文件名
function generateFilename(id: string, name: string): string {
  return `${id}-${encodeURIComponent(name)}.txt`
}

// GET: 获取所有账单
export async function GET() {
  try {
    await ensureDataDir()
    
    const files = await fs.readdir(DATA_DIR)
    const bills: ExpenseConfig[] = []
    
    for (const file of files) {
      if (!file.endsWith(".txt")) continue
      
      const parsed = parseFilename(file)
      if (!parsed) continue
      
      try {
        const filePath = path.join(DATA_DIR, file)
        const rawInput = await fs.readFile(filePath, "utf-8")
        const expenses = parseExpenseInput(rawInput)
        
        // 获取文件创建时间
        const stats = await fs.stat(filePath)
        
        bills.push({
          id: parsed.id,
          name: parsed.name,
          rawInput,
          expenses,
          createdAt: stats.birthtimeMs || stats.mtimeMs,
        })
      } catch (error) {
        console.error(`Error reading file ${file}:`, error)
      }
    }
    
    // 按创建时间排序（最新的在前）
    bills.sort((a, b) => b.createdAt - a.createdAt)
    
    return NextResponse.json(bills)
  } catch (error) {
    console.error("Error fetching bills:", error)
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 })
  }
}

// POST: 创建新账单
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir()
    
    const { id, name, rawInput } = await request.json()
    
    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
    }
    
    const filename = generateFilename(id, name)
    const filePath = path.join(DATA_DIR, filename)
    
    await fs.writeFile(filePath, rawInput || "", "utf-8")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating bill:", error)
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 })
  }
}

