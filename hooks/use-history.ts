import { useState, useCallback } from "react"
import type { ExpenseConfig } from "@/app/page"

interface HistoryState {
  configs: ExpenseConfig[]
  currentConfigId: string | null
}

export function useHistory(initialConfigs: ExpenseConfig[], initialCurrentId: string | null) {
  const [history, setHistory] = useState<HistoryState[]>([
    {
      configs: initialConfigs,
      currentConfigId: initialCurrentId,
    },
  ])
  const [historyIndex, setHistoryIndex] = useState(0)
  const maxHistorySize = 50 // 最多保存50个历史状态

  // 获取当前状态
  const getCurrentState = useCallback((): HistoryState => {
    return history[historyIndex]
  }, [history, historyIndex])

  // 添加新状态到历史
  const pushState = useCallback(
    (newConfigs: ExpenseConfig[], newCurrentConfigId: string | null) => {
      const newState: HistoryState = {
        configs: JSON.parse(JSON.stringify(newConfigs)), // 深拷贝
        currentConfigId: newCurrentConfigId,
      }

      // 如果新状态与当前状态相同，不添加
      if (historyIndex >= 0 && historyIndex < history.length) {
        const current = history[historyIndex]
        if (
          JSON.stringify(current.configs) === JSON.stringify(newState.configs) &&
          current.currentConfigId === newState.currentConfigId
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
      }

      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [history, historyIndex, maxHistorySize],
  )

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
    getCurrentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}

