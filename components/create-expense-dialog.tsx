"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: string
  onCreate: (description: string, amount: number) => void
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  category,
  onCreate,
}: CreateExpenseDialogProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDescription("")
      setAmount("")
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    // 验证输入
    if (!description.trim()) {
      setError("请输入支出名称")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("请输入有效的金额（大于0）")
      return
    }

    onCreate(description.trim(), amountNum)
    setDescription("")
    setAmount("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加新支出</DialogTitle>
          <DialogDescription>在 "{category}" 类别中添加新的支出项</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">支出名称</label>
            <Input
              placeholder="例如：早餐、购物、停车费等"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && description.trim() && amount) {
                  handleSubmit()
                }
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">金额</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="例如：25.50"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && description.trim() && amount) {
                  handleSubmit()
                }
              }}
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
          <Button onClick={handleSubmit} disabled={!description.trim() || !amount}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

