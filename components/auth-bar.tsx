"use client"

import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AuthBar() {
  const [email, setEmail] = useState("")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      const e = data.user?.email || null
      setUserEmail(e)
      if (data.user?.id) {
        try { localStorage.setItem("xiami_user_id", data.user.id) } catch (_) {}
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xiami-auth-changed'))
      }
    })
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, sess) => {
      const e = sess?.user?.email || null
      setUserEmail(e)
      if (sess?.user?.id) {
        try { localStorage.setItem("xiami_user_id", sess.user.id) } catch (_) {}
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xiami-auth-changed'))
      }
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const sendMagicLink = async () => {
    if (!email) return
    setSending(true)
    setInfo(null)
    const siteUrl =
      (typeof window !== "undefined" && window.location.origin) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      undefined
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: siteUrl },
    })
    setSending(false)
    if (error) {
      setInfo(`发送失败：${error.message}`)
    } else {
      setInfo("登录链接已发送至邮箱，请查收并点击完成登录")
    }
  }

  const loginWithWeChat = async () => {
    try {
      const siteUrl =
        (typeof window !== "undefined" && window.location.origin) ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        window.location.href
      
      // 直接使用自定义微信登录流程
      window.location.href = `/api/auth/wechat?redirect=${encodeURIComponent(siteUrl)}`
    } catch (err) {
      console.error('微信登录失败:', err)
      setInfo('微信登录失败，请稍后重试')
    }
  }

  const logout = async () => {
    await supabaseBrowser.auth.signOut()
    setUserEmail(null)
    try { localStorage.removeItem("xiami_user_id") } catch (_) {}
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('xiami-auth-changed'))
  }

  return (
    <div className="flex items-center gap-2">
      {userEmail ? (
        <>
          <span className="text-sm text-slate-600 dark:text-slate-300">{userEmail}</span>
          <Button size="sm" variant="outline" onClick={logout}>退出</Button>
        </>
      ) : (
        <>
          <Input
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 w-48"
            onKeyDown={(e) => {
              if (e.key === "Enter" && email && !sending) {
                sendMagicLink()
              }
            }}
          />
          <Button size="sm" onClick={sendMagicLink} disabled={!email || sending}>
            {sending ? "发送中..." : "邮箱登录"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={loginWithWeChat}
            className="flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-2.217-.576-2.402-3.598-4.244-7.5-4.244zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.173 1.173 0 0 1-1.162 1.178A1.173 1.173 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.173 1.173 0 0 1-1.162 1.178 1.173 1.173 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm6.581 2.712c-1.693.077-3.637.53-5.008 1.623-1.94 1.612-2.503 4.04-1.833 6.578a.295.295 0 0 0-.027.026c-1.236 1.14-2.673 1.738-4.181 1.738-1.146 0-2.252-.3-3.275-.872a.732.732 0 0 0-.72-.028l-1.888 1.103c-.63.37-1.406.12-1.752-.55l-.84-1.586a.864.864 0 0 1-.098-.717c.5-2.16-.072-4.1-1.587-5.58C.412 11.67 0 10.636 0 9.53c0-3.12 3.19-5.653 7.154-5.653 3.594 0 6.442 2.08 7.154 4.85.12.458.18.936.18 1.42 0 .276-.018.55-.053.82a9.78 9.78 0 0 1 4.691-1.176zm-1.336 3.543c.518 0 .938.427.938.953a.945.945 0 0 1-.938.953.945.945 0 0 1-.938-.953c0-.526.42-.953.938-.953zm4.522 0c.518 0 .938.427.938.953a.945.945 0 0 1-.938.953.945.945 0 0 1-.938-.953c0-.526.42-.953.938-.953z"/>
            </svg>
            微信登录
          </Button>
        </>
      )}
      {info && <span className="text-xs text-slate-500 ml-2">{info}</span>}
    </div>
  )}


