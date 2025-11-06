"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ParsedExpenses } from "@/app/page"
import { parseExpenseInput } from "@/lib/expense-parser"

interface ExpenseFormProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSaveConfig: (rawInput: string, expenses: ParsedExpenses) => void
}

export function ExpenseForm({ inputValue, onInputChange, onSaveConfig }: ExpenseFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = () => {
    try {
      setError(null)
      setSuccess(null)
      const parsed = parseExpenseInput(inputValue)

      if (Object.keys(parsed).length === 0) {
        setError("请输入有效的支出数据")
        return
      }

      onSaveConfig(inputValue, parsed)
      const categoryCount = Object.keys(parsed).length
      const itemCount = Object.values(parsed).reduce((sum, items) => sum + items.length, 0)
      setSuccess(`已保存 ${categoryCount} 个类别，${itemCount} 条记录`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败，请检查格式")
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">输入或编辑支出</h3>
        <p className="text-xs text-slate-500 dark:text-slate-500 mb-3 italic">
          编辑下方的数据后点击"保存"，当前配置会自动更新。
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">格式示例：</p>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs text-slate-700 dark:text-slate-300 mb-4 space-y-1 font-mono">
          <p>超市: 10, 16, 54(hmart), 12</p>
          <p>房租: 600</p>
          <p>水电: 120, 165</p>
          <p>餐厅: 32(麦当劳), 16, 26</p>
        </div>
      </div>

      <Textarea
        placeholder="在此输入您的支出数据...&#10;例如：&#10;超市: 10, 16, 54(hmart)&#10;房租: 600&#10;水电: 120, 165"
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        className="min-h-32 font-mono text-sm"
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm">
          ✓ {success}
        </div>
      )}

      <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        保存配置
      </Button>
    </div>
  )
}
