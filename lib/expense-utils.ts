import type { ExpenseEntry, ParsedExpenses, ExpenseList } from "@/app/page"

/**
 * 将ParsedExpenses转换为扁平化的ExpenseList
 */
export function parsedToFlatList(parsed: ParsedExpenses): ExpenseList {
  const entries: ExpenseEntry[] = []
  Object.entries(parsed).forEach(([category, categoryEntries]) => {
    categoryEntries.forEach((entry) => {
      entries.push({ ...entry, category })
    })
  })
  return { entries }
}

/**
 * 将ExpenseList转换回ParsedExpenses
 */
export function flatListToParsed(expenseList: ExpenseList): ParsedExpenses {
  const parsed: ParsedExpenses = {}
  expenseList.entries.forEach((entry) => {
    if (!parsed[entry.category]) {
      parsed[entry.category] = []
    }
    parsed[entry.category].push(entry)
  })
  return parsed
}

/**
 * 为ParsedExpenses中的所有条目添加ID（如果还没有）
 */
export function addIdsToParsed(parsed: ParsedExpenses): ParsedExpenses {
  const result: ParsedExpenses = {}
  
  Object.entries(parsed).forEach(([category, entries]) => {
    result[category] = entries.map((entry) => {
      if (entry.id) {
        return entry
      }
      return {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`,
      }
    })
  })
  
  return result
}

