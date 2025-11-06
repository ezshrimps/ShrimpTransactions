"use client"

import type { ExpenseConfig } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2 } from "lucide-react"

interface ConfigListProps {
  configs: ExpenseConfig[]
  currentConfigId: string | null
  onSelectConfig: (configId: string) => void
  onDeleteConfig: (configId: string) => void
  onEditConfig: (configId: string) => void
  loading?: boolean
}

export function ConfigList({
  configs,
  currentConfigId,
  onSelectConfig,
  onDeleteConfig,
  onEditConfig,
  loading = false,
}: ConfigListProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        加载中...
      </div>
    )
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        还没有创建任何账单
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {configs.map((config) => (
        <div
          key={config.id}
          className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
            currentConfigId === config.id
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
          onClick={() => onSelectConfig(config.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {config.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(config.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEditConfig(config.id)
              }}
              title="修改账单"
              className="h-8 w-8 p-0"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm("确定要删除这个账单吗？")) {
                  onDeleteConfig(config.id)
                }
              }}
              title="删除"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
