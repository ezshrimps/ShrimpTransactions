"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface Settings {
  currencySymbol: string
  categories: string[]
  language: "zh" | "en"
}

const DEFAULT_CATEGORIES = ["超市", "餐饮", "车", "房", "订阅", "娱乐", "购物", "其他"]

const DEFAULT_SETTINGS: Settings = {
  currencySymbol: "$",
  categories: DEFAULT_CATEGORIES,
  language: "zh",
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // 从 localStorage 加载设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem("eztransactions_settings")
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          // 确保 categories 是数组
          categories: Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_CATEGORIES,
        })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }, [])

  // 保存设置到 localStorage
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      try {
        localStorage.setItem("eztransactions_settings", JSON.stringify(updated))
      } catch (error) {
        console.error("Failed to save settings:", error)
      }
      return updated
    })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    try {
      localStorage.removeItem("eztransactions_settings")
    } catch (error) {
      console.error("Failed to reset settings:", error)
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

