"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/contexts/settings-context"
import { X, Plus, Trash2 } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CURRENCY_OPTIONS = [
  { value: "$", label: "美元 ($)" },
  { value: "¥", label: "人民币 (¥)" },
  { value: "€", label: "欧元 (€)" },
  { value: "£", label: "英镑 (£)" },
  { value: "₹", label: "印度卢比 (₹)" },
  { value: "₽", label: "俄罗斯卢布 (₽)" },
  { value: "₩", label: "韩元 (₩)" },
  { value: "₪", label: "以色列新谢克尔 (₪)" },
]

const TRANSLATIONS = {
  zh: {
    title: "设置",
    description: "自定义您的应用偏好设置",
    currency: "货币符号",
    categories: "分类列表",
    categoriesDesc: "选择要在图表中显示的分类",
    language: "语言",
    addCategory: "添加分类",
    categoryPlaceholder: "输入分类名称",
    reset: "重置为默认",
    save: "保存",
    cancel: "取消",
  },
  en: {
    title: "Settings",
    description: "Customize your application preferences",
    currency: "Currency Symbol",
    categories: "Categories",
    categoriesDesc: "Select categories to display in the chart",
    language: "Language",
    addCategory: "Add Category",
    categoryPlaceholder: "Enter category name",
    reset: "Reset to Default",
    save: "Save",
    cancel: "Cancel",
  },
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState(settings)
  const [newCategory, setNewCategory] = useState("")

  useEffect(() => {
    if (open) {
      setLocalSettings(settings)
    }
  }, [open, settings])

  const t = TRANSLATIONS[localSettings.language]

  const handleSave = () => {
    updateSettings(localSettings)
    onOpenChange(false)
  }

  const handleReset = () => {
    if (confirm(localSettings.language === "zh" ? "确定要重置所有设置吗？" : "Are you sure you want to reset all settings?")) {
      resetSettings()
      setLocalSettings({
        currencySymbol: "$",
        categories: ["超市", "餐饮", "车", "房", "订阅", "娱乐", "购物", "其他"],
        language: "zh",
      })
    }
  }

  const handleAddCategory = () => {
    if (newCategory.trim() && !localSettings.categories.includes(newCategory.trim())) {
      setLocalSettings({
        ...localSettings,
        categories: [...localSettings.categories, newCategory.trim()],
      })
      setNewCategory("")
    }
  }

  const handleRemoveCategory = (category: string) => {
    setLocalSettings({
      ...localSettings,
      categories: localSettings.categories.filter((c) => c !== category),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 货币符号 */}
          <div className="space-y-2">
            <Label htmlFor="currency">{t.currency}</Label>
            <Select
              value={localSettings.currencySymbol}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, currencySymbol: value })
              }
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 语言 */}
          <div className="space-y-2">
            <Label htmlFor="language">{t.language}</Label>
            <Select
              value={localSettings.language}
              onValueChange={(value: "zh" | "en") =>
                setLocalSettings({ ...localSettings, language: value })
              }
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 分类列表 */}
          <div className="space-y-2">
            <Label>{t.categories}</Label>
            <p className="text-sm text-muted-foreground">{t.categoriesDesc}</p>
            <div className="space-y-2">
              {localSettings.categories.map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <Input value={category} readOnly className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCategory(category)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t.categoryPlaceholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddCategory()
                    }
                  }}
                />
                <Button variant="outline" onClick={handleAddCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addCategory}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            {t.reset}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave}>{t.save}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

