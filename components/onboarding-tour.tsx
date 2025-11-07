"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const TOUR_STEPS = [
  {
    title: "欢迎使用虾米记账本！",
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300">
          这是一个可视化记账工具，帮助您轻松管理每一笔支出。
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          让我们花 2 分钟了解如何使用它。
        </p>
      </div>
    ),
  },
  {
    title: "第一步：登录账号",
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300">
          在右上角输入您的邮箱，点击"邮箱登录"。
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          系统会发送一封登录链接到您的邮箱，点击链接即可完成登录。登录后您的数据会自动同步到云端。
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
          💡 提示：首次使用会自动注册账号
        </div>
      </div>
    ),
  },
  {
    title: "第二步：创建或导入账单",
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300">
          在左侧"账单列表"中，您可以：
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-300 ml-2">
          <li><strong>创建</strong>：创建一个新的空账单</li>
          <li><strong>导入</strong>：输入文本格式的账单数据（如：超市: 10, 16(备注), 12）</li>
          <li><strong>导入 CSV</strong>：上传 CSV 文件并映射列（类别/金额/备注）</li>
        </ul>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
          💡 提示：选择账单后，右侧会显示可视化图表
        </div>
      </div>
    ),
  },
  {
    title: "编辑模式 vs 预览模式",
    content: (
      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">📝 编辑模式</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>所有支出高度相同，颜色由金额决定（绿→红）</li>
            <li>点击空白部分可以添加新支出</li>
            <li>拖拽可移动分类</li>
            <li>右键可编辑或删除</li>
            <li>支持 Ctrl+Z 撤销操作</li>
          </ul>
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">👁️ 预览模式</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>高度按价格比例，使用固定配色</li>
            <li>可以设置预算，查看支出与预算对比</li>
            <li>点击类别下方的预算数字可编辑预算</li>
            <li>顶部总额颜色表示预算使用情况（绿/黄/橙/红）</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "开始使用",
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300">
          现在您已经了解了基本功能，可以开始记账了！
        </p>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-semibold mb-2">💡 小贴士：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>数据会自动保存到云端</li>
            <li>可以随时切换编辑和预览模式</li>
            <li>支持 CSV 批量导入，提高效率</li>
          </ul>
        </div>
      </div>
    ),
  },
]

const STORAGE_KEY = "xiami_onboarding_completed"

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const completed = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (!completed) {
      setOpen(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true")
    }
    setOpen(false)
  }

  if (!open) return null

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            步骤 {currentStep + 1} / {TOUR_STEPS.length}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[200px]">
          {step.content}
        </div>
        <DialogFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            跳过教程
          </Button>
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="outline" onClick={handlePrev}>
                上一步
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLast ? "开始使用" : "下一步"}
            </Button>
          </div>
        </DialogFooter>
        {/* 进度指示器 */}
        <div className="flex gap-2 justify-center mt-4">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep
                  ? "bg-blue-500 w-8"
                  : idx < currentStep
                  ? "bg-blue-300 dark:bg-blue-700 w-2"
                  : "bg-slate-200 dark:bg-slate-700 w-2"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

