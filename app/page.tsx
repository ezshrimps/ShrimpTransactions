"use client"

import { useState, useEffect, useRef } from "react"
import { ExpenseChartInteractive } from "@/components/expense-chart-interactive"
import { ExpenseList } from "@/components/expense-list"
import { ConfigList } from "@/components/config-list"
import { CreateBillDialog } from "@/components/create-bill-dialog"
import { ImportDialog } from "@/components/import-dialog"
import { EditBillDialog } from "@/components/edit-bill-dialog"
import { CreateExpenseDialog } from "@/components/create-expense-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { fetchBills, createBill, updateBill, deleteBill } from "@/lib/bill-api"
import { parseExpenseInput } from "@/lib/expense-parser"
import {
  parsedToFlatList,
  flatListToParsed,
  addIdsToParsed,
} from "@/lib/expense-utils"
import { useHistory } from "@/hooks/use-history"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

export interface ExpenseEntry {
  id: string // 唯一标识符
  category: string
  amount: number
  description?: string
}

// 扁平化的支出列表（所有支出在一个数组中）
export interface ExpenseList {
  entries: ExpenseEntry[]
}

// 保持向后兼容的格式（用于解析和显示）
export interface ParsedExpenses {
  [category: string]: ExpenseEntry[]
}

export interface ExpenseConfig {
  id: string
  name: string
  rawInput: string
  expenses: ParsedExpenses // 用于显示和向后兼容
  expenseList?: ExpenseList // 新的扁平化结构（可选，用于新功能）
  createdAt: number
}

export default function Home() {
  const [configs, setConfigs] = useState<ExpenseConfig[]>([])
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null)
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [createExpenseDialogOpen, setCreateExpenseDialogOpen] = useState(false)
  const [createExpenseCategory, setCreateExpenseCategory] = useState<string>("")

  // 历史管理
  const history = useHistory(configs, currentConfigId)
  const isHistoryAction = useRef(false) // 标记是否正在执行历史操作，避免触发新的历史记录

  const currentConfig = configs.find((c) => c.id === currentConfigId)

  // 加载账单列表
  useEffect(() => {
    async function loadBills() {
      try {
        setLoading(true)
        const bills = await fetchBills()
        // 确保所有支出都有ID，并创建expenseList
        const billsWithLists = bills.map((bill) => {
          const expensesWithIds = addIdsToParsed(bill.expenses)
          const expenseList = parsedToFlatList(expensesWithIds)
          return {
            ...bill,
            expenses: expensesWithIds,
            expenseList,
          }
        })
        setConfigs(billsWithLists)
        // 初始化历史记录（延迟执行，确保状态已更新）
        setTimeout(() => {
          history.pushState(billsWithLists, currentConfigId)
        }, 0)
      } catch (error) {
        console.error("Failed to load bills:", error)
        alert("加载账单列表失败，请刷新页面重试")
      } finally {
        setLoading(false)
      }
    }
    loadBills()
  }, [])

  // 快捷键支持
  useKeyboardShortcuts([
    {
      key: "z",
      ctrl: true,
      handler: () => {
        const state = history.undo()
        if (state) {
          isHistoryAction.current = true
          setConfigs(state.configs)
          setCurrentConfigId(state.currentConfigId)
          setTimeout(() => {
            isHistoryAction.current = false
          }, 0)
        }
      },
    },
    {
      key: "y",
      ctrl: true,
      handler: () => {
        const state = history.redo()
        if (state) {
          isHistoryAction.current = true
          setConfigs(state.configs)
          setCurrentConfigId(state.currentConfigId)
          setTimeout(() => {
            isHistoryAction.current = false
          }, 0)
        }
      },
    },
    {
      key: "z",
      ctrl: true,
      shift: true,
      handler: () => {
        // Ctrl+Shift+Z 也是重做
        const state = history.redo()
        if (state) {
          isHistoryAction.current = true
          setConfigs(state.configs)
          setCurrentConfigId(state.currentConfigId)
          setTimeout(() => {
            isHistoryAction.current = false
          }, 0)
        }
      },
    },
  ])

  const handleCreateBill = async (name: string) => {
    try {
      const id = Date.now().toString()
      await createBill(id, name, "")
      
      const newConfig: ExpenseConfig = {
        id,
        name,
        rawInput: "",
        expenses: {},
        expenseList: { entries: [] },
        createdAt: Date.now(),
      }
      setConfigs([...configs, newConfig])
      setCurrentConfigId(newConfig.id)
    } catch (error) {
      console.error("Failed to create bill:", error)
      alert("创建账单失败，请重试")
    }
  }

  const handleImportBill = async (name: string, rawInput: string, expenses: ParsedExpenses) => {
    try {
      // 验证解析结果
      const categoryCount = Object.keys(expenses).length
      if (categoryCount === 0) {
        alert("解析失败：没有找到有效的类别数据")
        return
      }
      
      const expensesWithIds = addIdsToParsed(expenses)
      const expenseList = parsedToFlatList(expensesWithIds)
      
      const id = Date.now().toString()
      await createBill(id, name, rawInput)
      const newConfig: ExpenseConfig = {
        id,
        name,
        rawInput,
        expenses: expensesWithIds,
        expenseList,
        createdAt: Date.now(),
      }
      setConfigs([...configs, newConfig])
      setCurrentConfigId(newConfig.id)
    } catch (error) {
      console.error("Failed to import bill:", error)
      alert("导入账单失败，请重试")
    }
  }

  const handleSelectConfig = (configId: string) => {
    setCurrentConfigId(configId)
  }

  const handleEditConfig = (configId: string) => {
    setEditingConfigId(configId)
  }

  const handleSaveEdit = async (configId: string, name: string, rawInput: string, expenses: ParsedExpenses) => {
    try {
      // 保存历史状态
      if (!isHistoryAction.current) {
        history.pushState(configs, currentConfigId)
      }

      await updateBill(configId, name, rawInput)
      
      const expensesWithIds = addIdsToParsed(expenses)
      const expenseList = parsedToFlatList(expensesWithIds)
      
      const updatedConfig: ExpenseConfig = {
        ...currentConfig!,
        name,
        rawInput,
        expenses: expensesWithIds,
        expenseList,
      }
      const newConfigs = configs.map((c) => (c.id === configId ? updatedConfig : c))
      setConfigs(newConfigs)
      setEditingConfigId(null)
      
      // 如果正在编辑的是当前选中的账单，更新显示
      if (currentConfigId === configId) {
        setCurrentConfigId(configId)
      }

      // 添加到历史（如果不在历史操作中）
      if (!isHistoryAction.current) {
        history.pushState(newConfigs, currentConfigId === configId ? configId : currentConfigId)
      }
    } catch (error) {
      console.error("Failed to update bill:", error)
      alert("更新账单失败，请重试")
    }
  }

  const handleDeleteConfig = async (configId: string) => {
    try {
      await deleteBill(configId)
      setConfigs(configs.filter((c) => c.id !== configId))
      if (currentConfigId === configId) {
        setCurrentConfigId(null)
      }
    } catch (error) {
      console.error("Failed to delete bill:", error)
      alert("删除账单失败，请重试")
    }
  }

  // 处理支出更新（编辑）
  const handleUpdateEntry = async (id: string, updates: Partial<ExpenseEntry>) => {
    if (!currentConfig || !currentConfig.expenseList) return

    const updatedEntries = currentConfig.expenseList.entries.map((entry) =>
      entry.id === id ? { ...entry, ...updates } : entry,
    )

    const updatedExpenseList = { entries: updatedEntries }
    const updatedExpenses = flatListToParsed(updatedExpenseList)

    // 重新构建rawInput
    const rawInput = Object.entries(updatedExpenses)
      .map(([cat, entries]) => {
        const amounts = entries
          .map((e) => (e.description ? `${e.amount}(${e.description})` : `${e.amount}`))
          .join(", ")
        return `${cat}: ${amounts}`
      })
      .join("\n")

    try {
      await updateBill(currentConfig.id, currentConfig.name, rawInput)
      const updatedConfig = {
        ...currentConfig,
        expenses: updatedExpenses,
        expenseList: updatedExpenseList,
        rawInput,
      }
      setConfigs(configs.map((c) => (c.id === currentConfigId ? updatedConfig : c)))
    } catch (error) {
      console.error("Failed to update entry:", error)
      alert("更新支出失败，请重试")
    }
  }

  // 处理支出删除
  const handleDeleteEntry = async (id: string) => {
    if (!currentConfig || !currentConfig.expenseList) return

    // 保存历史状态
    if (!isHistoryAction.current) {
      history.pushState(configs, currentConfigId)
    }

    const updatedEntries = currentConfig.expenseList.entries.filter((e) => e.id !== id)
    const updatedExpenseList = { entries: updatedEntries }
    const updatedExpenses = flatListToParsed(updatedExpenseList)

    // 重新构建rawInput
    const rawInput = Object.entries(updatedExpenses)
      .map(([cat, entries]) => {
        const amounts = entries
          .map((e) => (e.description ? `${e.amount}(${e.description})` : `${e.amount}`))
          .join(", ")
        return `${cat}: ${amounts}`
      })
      .join("\n")

    try {
      await updateBill(currentConfig.id, currentConfig.name, rawInput)
      const updatedConfig = {
        ...currentConfig,
        expenses: updatedExpenses,
        expenseList: updatedExpenseList,
        rawInput,
      }
      const newConfigs = configs.map((c) => (c.id === currentConfigId ? updatedConfig : c))
      setConfigs(newConfigs)
      
      // 添加到历史（如果不在历史操作中）
      if (!isHistoryAction.current) {
        history.pushState(newConfigs, currentConfigId)
      }
    } catch (error) {
      console.error("Failed to delete entry:", error)
      alert("删除支出失败，请重试")
    }
  }

  // 处理创建新支出项
  const handleCreateEntry = (category: string) => {
    setCreateExpenseCategory(category)
    setCreateExpenseDialogOpen(true)
  }

  const handleConfirmCreateEntry = async (category: string, description: string, amount: number) => {
    if (!currentConfig || !currentConfig.expenseList) return

    // 保存历史状态
    if (!isHistoryAction.current) {
      history.pushState(configs, currentConfigId)
    }

    // 生成新支出项的ID
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`
    
    const newEntry: ExpenseEntry = {
      id: generateId(),
      category,
      amount,
      description: description || undefined,
    }

    // 添加到支出列表
    const updatedEntries = [...currentConfig.expenseList.entries, newEntry]
    const updatedExpenseList = { entries: updatedEntries }
    const updatedExpenses = flatListToParsed(updatedExpenseList)

    // 重新构建rawInput
    const rawInput = Object.entries(updatedExpenses)
      .map(([cat, entries]) => {
        const amounts = entries
          .map((e) => (e.description ? `${e.amount}(${e.description})` : `${e.amount}`))
          .join(", ")
        return `${cat}: ${amounts}`
      })
      .join("\n")

    try {
      await updateBill(currentConfig.id, currentConfig.name, rawInput)
      const updatedConfig = {
        ...currentConfig,
        expenses: updatedExpenses,
        expenseList: updatedExpenseList,
        rawInput,
      }
      const newConfigs = configs.map((c) => (c.id === currentConfigId ? updatedConfig : c))
      setConfigs(newConfigs)

      // 添加到历史（如果不在历史操作中）
      if (!isHistoryAction.current) {
        history.pushState(newConfigs, currentConfigId)
      }
    } catch (error) {
      console.error("Failed to create entry:", error)
      alert("创建支出失败，请重试")
    }
  }

  // 处理支出移动（拖拽到不同类别）
  const handleMoveEntry = async (id: string, newCategory: string) => {
    if (!currentConfig || !currentConfig.expenseList) return

    // 保存历史状态
    if (!isHistoryAction.current) {
      history.pushState(configs, currentConfigId)
    }

    const updatedEntries = currentConfig.expenseList.entries.map((entry) =>
      entry.id === id ? { ...entry, category: newCategory } : entry,
    )

    const updatedExpenseList = { entries: updatedEntries }
    const updatedExpenses = flatListToParsed(updatedExpenseList)

    // 重新构建rawInput
    const rawInput = Object.entries(updatedExpenses)
      .map(([cat, entries]) => {
        const amounts = entries
          .map((e) => (e.description ? `${e.amount}(${e.description})` : `${e.amount}`))
          .join(", ")
        return `${cat}: ${amounts}`
      })
      .join("\n")

    try {
      await updateBill(currentConfig.id, currentConfig.name, rawInput)
      const updatedConfig = {
        ...currentConfig,
        expenses: updatedExpenses,
        expenseList: updatedExpenseList,
        rawInput,
      }
      const newConfigs = configs.map((c) => (c.id === currentConfigId ? updatedConfig : c))
      setConfigs(newConfigs)
      
      // 添加到历史（如果不在历史操作中）
      if (!isHistoryAction.current) {
        history.pushState(newConfigs, currentConfigId)
      }
    } catch (error) {
      console.error("Failed to move entry:", error)
      alert("移动支出失败，请重试")
    }
  }

  const editingConfig = editingConfigId ? configs.find((c) => c.id === editingConfigId) : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-2 md:p-4">
      <div className="max-w-[98vw] mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            记账本
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            用可视化图表管理您的每一笔支出
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Left Column - Bill List */}
          <div className="lg:col-span-1 space-y-3 md:space-y-4">
            <Card className="p-3 md:p-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3">
                账单列表
              </h2>
              <div className="space-y-2 mb-4">
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full"
                  variant="default"
                >
                  创建
                </Button>
                <Button
                  onClick={() => setImportDialogOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  导入
                </Button>
              </div>
              <ConfigList
                configs={configs}
                currentConfigId={currentConfigId}
                onSelectConfig={handleSelectConfig}
                onDeleteConfig={handleDeleteConfig}
                onEditConfig={handleEditConfig}
                loading={loading}
              />
            </Card>
          </div>

          {/* Right Column - Chart and List */}
          <div className="lg:col-span-4 space-y-3 md:space-y-4">
            {currentConfig ? (
              Object.keys(currentConfig.expenses).length > 0 ? (
                <>
                  <Card className="p-3 md:p-4">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">
                      支出分析
                    </h2>
                    <ExpenseChartInteractive
                      expenses={currentConfig.expenses}
                      onMoveEntry={handleMoveEntry}
                      onCreateEntry={handleCreateEntry}
                    />
                  </Card>

                  <Card className="p-3 md:p-4">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3">
                      详细记录
                    </h2>
                    <ExpenseList
                      expenses={currentConfig.expenses}
                      onDeleteEntry={(category, index) => {
                        const entry = currentConfig.expenses[category]?.[index]
                        if (entry?.id) {
                          handleDeleteEntry(entry.id)
                        }
                      }}
                    />
                  </Card>
                </>
              ) : (
                <Card className="p-8 md:p-12 text-center">
                  <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400">
                    这个账单还是空的，点击"修改账单"按钮来添加支出数据
                  </p>
                </Card>
              )
            ) : (
              <Card className="p-8 md:p-12 text-center">
                <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400">
                  请选择一个账单或创建新账单
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <CreateBillDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={handleCreateBill}
        />
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={(rawInput, expenses, name) => handleImportBill(name, rawInput, expenses)}
        />
        {editingConfig && (
          <EditBillDialog
            open={editingConfigId !== null}
            onOpenChange={(open) => {
              if (!open) setEditingConfigId(null)
            }}
            initialName={editingConfig.name}
            initialValue={editingConfig.rawInput}
            onSave={(name, rawInput, expenses) => {
              handleSaveEdit(editingConfigId!, name, rawInput, expenses)
            }}
          />
        )}
        <CreateExpenseDialog
          open={createExpenseDialogOpen}
          onOpenChange={setCreateExpenseDialogOpen}
          category={createExpenseCategory}
          onCreate={(description, amount) => {
            handleConfirmCreateEntry(createExpenseCategory, description, amount)
          }}
        />
      </div>
    </main>
  )
}
