import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
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

// 根据ID查找文件
async function findFileById(id: string): Promise<string | null> {
  const files = await fs.readdir(DATA_DIR)
  for (const file of files) {
    if (!file.endsWith(".txt")) continue
    const parsed = parseFilename(file)
    if (parsed && parsed.id === id) {
      return file
    }
  }
  return null
}

// GET: 获取单个账单
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDataDir()
    
    const params = context.params instanceof Promise ? await context.params : context.params
    const id = params.id
    
    const filename = await findFileById(id)
    if (!filename) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }
    
    const filePath = path.join(DATA_DIR, filename)
    const rawInput = await fs.readFile(filePath, "utf-8")
    const expenses = parseExpenseInput(rawInput)
    const stats = await fs.stat(filePath)
    const parsed = parseFilename(filename)
    
    return NextResponse.json({
      id,
      name: parsed?.name || id,
      rawInput,
      expenses,
      createdAt: stats.birthtimeMs || stats.mtimeMs,
    })
  } catch (error) {
    console.error("Error fetching bill:", error)
    return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 })
  }
}

// PUT: 更新账单
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDataDir()
    
    const params = context.params instanceof Promise ? await context.params : context.params
    const id = params.id
    const { name, rawInput } = await request.json()
    
    const oldFilename = await findFileById(id)
    if (!oldFilename) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }
    
    // 如果名称改变，删除旧文件并创建新文件
    const newFilename = generateFilename(id, name)
    const newFilePath = path.join(DATA_DIR, newFilename)
    
    if (oldFilename !== newFilename) {
      const oldFilePath = path.join(DATA_DIR, oldFilename)
      await fs.unlink(oldFilePath)
    }
    
    await fs.writeFile(newFilePath, rawInput || "", "utf-8")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating bill:", error)
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 })
  }
}

// DELETE: 删除账单
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDataDir()
    
    const params = context.params instanceof Promise ? await context.params : context.params
    const id = params.id
    
    const filename = await findFileById(id)
    if (!filename) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }
    
    const filePath = path.join(DATA_DIR, filename)
    await fs.unlink(filePath)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bill:", error)
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 })
  }
}

