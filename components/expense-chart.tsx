"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { ParsedExpenses } from "@/app/page"

interface ExpenseChartProps {
  expenses: ParsedExpenses
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
]

interface ChartData {
  category: string
  [key: string]: string | number
}

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  // Build chart data structure
  const chartData: ChartData[] = Object.entries(expenses).map(([category, entries]) => ({
    category,
    total: entries.reduce((sum, entry) => sum + entry.amount, 0),
  }))

  // Build stacked bars data - each entry gets a unique key
  const stackKeys: string[] = []
  const dataWithStacks: Record<string, number | string>[] = []

  Object.entries(expenses).forEach(([category, entries]) => {
    entries.forEach((entry, idx) => {
      const stackKey = `${category}_${idx}`
      stackKeys.push(stackKey)
    })
  })

  // Create data for stacked bars
  Object.entries(expenses).forEach(([category, entries]) => {
    const categoryData: Record<string, string | number> = { name: category }
    entries.forEach((entry, idx) => {
      const stackKey = `${category}_${idx}`
      categoryData[stackKey] = entry.amount
    })
    dataWithStacks.push(categoryData)
  })

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={dataWithStacks} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fill: "currentColor" }} />
          <YAxis tick={{ fill: "currentColor" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            formatter={(value) => `¥${Number(value).toFixed(2)}`}
          />
          {stackKeys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="expenses"
              fill={COLORS[idx % COLORS.length]}
              radius={idx === 0 ? [8, 8, 0, 0] : idx === stackKeys.length - 1 ? [0, 0, 8, 8] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend showing descriptions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(expenses).map(([category, entries]) =>
          entries.map((entry, idx) => (
            <div key={`${category}-${idx}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    COLORS[
                      Object.keys(expenses)
                        .flatMap((c, ci) => expenses[c].map((_, ei) => ({ c, ci, ei })))
                        .findIndex((item) => item.c === category && item.ei === idx) % COLORS.length
                    ],
                }}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {entry.description || `${category} #${idx + 1}`}
                <span className="font-semibold ml-1">¥{entry.amount}</span>
              </span>
            </div>
          )),
        )}
      </div>
    </div>
  )
}
