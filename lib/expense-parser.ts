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
 * 或: 类别：金额1，金额2（备注），金额3
 * 支持中文和英文标点符号：冒号(:/：)、逗号(,/,)、括号(()/（))
 */
export function parseExpenseInput(input: string): ParsedExpenses {
  const result: ParsedExpenses = {}

  // 处理不同的换行符格式（\n, \r\n, \r）
  const normalizedInput = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = normalizedInput.split("\n").filter((line) => line.trim())

  for (const line of lines) {
    // 匹配 "类别: 金额列表" 或 "类别：金额列表" 格式（支持中文和英文冒号）
    const match = line.match(/^(.+?)[:：]\s*(.+)$/)
    if (!match) {
      continue
    }

    const category = match[1].trim()
    const amountsStr = match[2]

    // 解析金额和备注
    const validAmounts: { amount: number; description?: string }[] = []

    // 支持中文和英文逗号分割（先将中文逗号标准化为英文逗号，然后分割）
    const normalizedAmountsStr = amountsStr.replace(/，/g, ",")
    normalizedAmountsStr.split(",").forEach((item) => {
      const trimmed = item.trim()
      
      // 先尝试匹配中文括号对：金额（备注）
      let amountMatch = trimmed.match(/^([\d.]+)\s*（([^）]*)）\s*$/)
      let description: string | undefined
      
      if (amountMatch) {
        // 匹配到中文括号
        description = amountMatch[2]?.trim() || undefined
      } else {
        // 尝试匹配英文括号对：金额(备注)
        amountMatch = trimmed.match(/^([\d.]+)\s*\(([^)]*)\)\s*$/)
        if (amountMatch) {
          description = amountMatch[2]?.trim() || undefined
        } else {
          // 没有括号，只有金额
          amountMatch = trimmed.match(/^([\d.]+)\s*$/)
        }
      }
      
      if (!amountMatch) {
        return
      }

      const amount = Number.parseFloat(amountMatch[1])
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
