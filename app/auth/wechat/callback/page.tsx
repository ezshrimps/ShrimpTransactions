"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase-browser"

// 完全禁用静态生成和预渲染
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function WeChatCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("正在处理微信登录...")

  useEffect(() => {
    // 确保只在客户端运行
    if (typeof window === 'undefined') return

    const handleCallback = async () => {
      try {
        // 直接从 URL 获取参数，不使用任何 Next.js hooks
        const urlParams = new URLSearchParams(window.location.search)
        const userDataStr = urlParams.get("user")
        
        if (!userDataStr) {
          setStatus("error")
          setMessage("缺少用户信息")
          setTimeout(() => router.push("/"), 2000)
          return
        }

        // 浏览器环境解码 base64
        const decoded = atob(userDataStr)
        const userData = JSON.parse(decoded)
        
        // 调用后端 API 创建 Supabase session
        const response = await fetch("/api/auth/wechat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "创建会话失败")
        }

        const { session, magicLink } = await response.json()

        if (magicLink) {
          // 如果有 magic link，直接跳转完成登录
          window.location.href = magicLink
          return
        }

        if (session?.access_token) {
          // 尝试使用 access_token 设置 session
          const { data, error } = await supabaseBrowser.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token || "",
          })

          if (error) {
            console.error("设置 session 失败:", error)
            // 如果设置失败，尝试使用 magic link
            if (magicLink) {
              window.location.href = magicLink
              return
            }
            throw error
          }

          // 保存用户 ID
          if (data.session?.user?.id) {
            localStorage.setItem("xiami_user_id", data.session.user.id)
            window.dispatchEvent(new Event("xiami-auth-changed"))
          }

          setStatus("success")
          setMessage("登录成功，正在跳转...")
          setTimeout(() => router.push("/"), 1000)
        } else {
          throw new Error("未获取到会话")
        }
      } catch (error) {
        console.error("微信登录回调处理失败:", error)
        setStatus("error")
        setMessage("登录失败，请重试")
        setTimeout(() => router.push("/"), 2000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <p className="text-slate-600">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <p className="text-red-600">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
