import { useState, useCallback } from "react"
import type { ParsedExpenses, ExpenseList } from "@/app/page"

interface HistoryState {
  expenses: ParsedExpenses
  expenseList: ExpenseList
  rawInput: string
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const maxHistorySize = 50 // 最多保存50个历史状态

  // 添加新状态到历史（只保存当前账单的支出数据）
  const pushState = useCallback(
    (expenses: ParsedExpenses, expenseList: ExpenseList, rawInput: string) => {
      const newState: HistoryState = {
        expenses: JSON.parse(JSON.stringify(expenses)), // 深拷贝
        expenseList: JSON.parse(JSON.stringify(expenseList)), // 深拷贝
        rawInput: rawInput,
      }

      // 如果新状态与当前状态相同，不添加
      if (historyIndex >= 0 && historyIndex < history.length) {
        const current = history[historyIndex]
        if (
          JSON.stringify(current.expenses) === JSON.stringify(newState.expenses) &&
          JSON.stringify(current.expenseList) === JSON.stringify(newState.expenseList)
        ) {
          return
        }
      }

      // 删除当前索引之后的所有历史（如果用户撤销后又做了新操作）
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newState)

      // 限制历史记录数量
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        setHistoryIndex((prev) => prev - 1)
      } else {
        setHistoryIndex(newHistory.length - 1)
      }

      setHistory(newHistory)
    },
    [history, historyIndex],
  )

  // 清空历史（当切换账单时）
  const clearHistory = useCallback(() => {
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  // 撤销
  const undo = useCallback((): HistoryState | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      return history[newIndex]
    }
    return null
  }, [history, historyIndex])

  // 重做
  const redo = useCallback((): HistoryState | null => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      return history[newIndex]
    }
    return null
  }, [history, historyIndex])

  // 检查是否可以撤销
  const canUndo = historyIndex > 0

  // 检查是否可以重做
  const canRedo = historyIndex < history.length - 1

  return {
    pushState,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  }
}

