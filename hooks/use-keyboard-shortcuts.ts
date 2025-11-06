import { useEffect } from "react"

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean // Command键（Mac）
  handler: (e: KeyboardEvent) => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (e.ctrlKey || e.metaKey)
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === e.shiftKey
        const altMatch = shortcut.alt === undefined || shortcut.alt === e.altKey
        const metaMatch = shortcut.meta === undefined || shortcut.meta === e.metaKey
        const keyMatch =
          shortcut.key.toLowerCase() === e.key.toLowerCase() ||
          shortcut.key.toLowerCase() === e.code.toLowerCase()

        // 检查是否匹配所有条件
        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          // 如果正在输入框中，不触发快捷键（除非是全局快捷键）
          const target = e.target as HTMLElement
          const isInput =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable

          // Ctrl+Z, Ctrl+Y 等常用快捷键可以在输入框中触发（因为它们有默认行为）
          // 但我们要阻止默认行为并执行自定义操作
          if (isInput && (shortcut.key === "z" || shortcut.key === "y")) {
            e.preventDefault()
            shortcut.handler(e)
            return
          }

          // 其他快捷键只在非输入框时触发
          if (!isInput) {
            e.preventDefault()
            shortcut.handler(e)
            return
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [shortcuts])
}

