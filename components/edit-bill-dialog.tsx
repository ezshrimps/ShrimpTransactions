"use client"

import { useState, useEffect } from "react"
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

interface EditBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  initialValue: string
  onSave: (name: string, rawInput: string, expenses: ParsedExpenses) => void
}

export function EditBillDialog({
  open,
  onOpenChange,
  initialName,
  initialValue,
  onSave,
}: EditBillDialogProps) {
  const [name, setName] = useState(initialName)
  const [inputValue, setInputValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setInputValue(initialValue)
      setError(null)
    }
  }, [open, initialName, initialValue])

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("请输入账单名称")
      return
    }

    try {
      // 如果输入为空，创建一个空的expenses对象
      const expenses = inputValue.trim() ? parseExpenseInput(inputValue.trim()) : {}
      
      onSave(name.trim(), inputValue.trim(), expenses)
      setError(null)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败，请检查格式")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>编辑账单</DialogTitle>
          <DialogDescription>修改账单名称和支出数据</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">账单名称</label>
            <Input
              placeholder="账单名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">支出数据</label>
            <Textarea
              placeholder="超市: 10, 16, 54(hmart), 12&#10;房租: 600&#10;水电: 120, 165"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="min-h-[32rem] font-mono text-sm"
            />
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
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

