"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ParsedExpenses } from "@/app/page"
import { parseExpenseInput } from "@/lib/expense-parser"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (rawInput: string, expenses: ParsedExpenses, name: string) => void
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [name, setName] = useState("")
  const [rawInput, setRawInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("请输入账单名称")
      return
    }

    if (!rawInput.trim()) {
      setError("请输入支出数据")
      return
    }

    try {
      const expenses = parseExpenseInput(rawInput)
      const categoryCount = Object.keys(expenses).length

      if (categoryCount === 0) {
        setError("解析失败：没有找到有效的类别数据。请检查输入格式。")
        return
      }

      onImport(name.trim(), rawInput.trim(), expenses)
      setName("")
      setRawInput("")
      setError(null)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败，请检查格式")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入账单</DialogTitle>
          <DialogDescription>输入账单名称和支出数据来创建新账单</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">账单名称</label>
            <Input
              placeholder="例如：2024年10月"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">支出数据</label>
            <Textarea
              placeholder="超市: 10, 16, 54(hmart), 12&#10;房租: 600&#10;水电: 120, 165"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="min-h-32 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              格式：类别: 金额1, 金额2(备注), 金额3
            </p>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !rawInput.trim()}>
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

