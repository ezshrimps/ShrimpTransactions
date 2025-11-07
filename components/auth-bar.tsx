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
      }
    })
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, sess) => {
      const e = sess?.user?.email || null
      setUserEmail(e)
      if (sess?.user?.id) {
        try { localStorage.setItem("xiami_user_id", sess.user.id) } catch (_) {}
      }
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const sendMagicLink = async () => {
    if (!email) return
    setSending(true)
    setInfo(null)
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    })
    setSending(false)
    if (error) {
      setInfo(`发送失败：${error.message}`)
    } else {
      setInfo("登录链接已发送至邮箱，请查收并点击完成登录")
    }
  }

  const logout = async () => {
    await supabaseBrowser.auth.signOut()
    setUserEmail(null)
    try { localStorage.removeItem("xiami_user_id") } catch (_) {}
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
          />
          <Button size="sm" onClick={sendMagicLink} disabled={!email || sending}>{sending ? "发送中..." : "邮箱登录"}</Button>
        </>
      )}
      {info && <span className="text-xs text-slate-500 ml-2">{info}</span>}
    </div>
  )}


