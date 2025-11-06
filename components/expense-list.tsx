"use client"

import type { ParsedExpenses } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface ExpenseListProps {
  expenses: ParsedExpenses
  onDeleteEntry: (category: string, index: number) => void
}

export function ExpenseList({ expenses, onDeleteEntry }: ExpenseListProps) {
  return (
    <div className="space-y-4">
      {Object.entries(expenses).map(([category, entries]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{category}</h3>
            <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              ${entries.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
            </span>
          </div>
          <div className="space-y-2 ml-4">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {entry.description || `支出 #${idx + 1}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">${entry.amount.toFixed(2)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteEntry(category, idx)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-slate-900 dark:text-white">总支出</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            $
            {Object.values(expenses)
              .flat()
              .reduce((sum, e) => sum + e.amount, 0)
              .toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
