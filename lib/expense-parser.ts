import type { ParsedExpenses } from "@/app/page"

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 解析支出输入文本
 * 格式: 类别: 金额1, 金额2(备注), 金额3
 */
export function parseExpenseInput(input: string): ParsedExpenses {
  const result: ParsedExpenses = {}

  // 处理不同的换行符格式（\n, \r\n, \r）
  const normalizedInput = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = normalizedInput.split("\n").filter((line) => line.trim())

  for (const line of lines) {
    // 匹配 "类别: 金额列表" 格式
    const match = line.match(/^(.+?):\s*(.+)$/)
    if (!match) {
      continue
    }

    const category = match[1].trim()
    const amountsStr = match[2]

    // 解析金额和备注
    const validAmounts: { amount: number; description?: string }[] = []

    amountsStr.split(",").forEach((item) => {
      // 匹配 "金额(备注)" 或 "金额"
      const amountMatch = item.match(/^\s*([\d.]+)\s*(?:\(([^)]*)\))?\s*$/)
      if (!amountMatch) {
        return
      }

      const amount = Number.parseFloat(amountMatch[1])
      const description = amountMatch[2]?.trim() || undefined

      if (!isNaN(amount) && amount > 0) {
        validAmounts.push({ amount, description })
      }
    })

    if (validAmounts.length > 0) {
      result[category] = validAmounts.map((item) => ({
        id: generateId(),
        category,
        amount: item.amount,
        description: item.description,
      }))
    }
  }

  return result
}
