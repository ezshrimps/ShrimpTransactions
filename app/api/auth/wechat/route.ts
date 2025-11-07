import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 微信网页授权 - 第一步：重定向到微信授权页面
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const redirect = searchParams.get("redirect") || request.nextUrl.origin

  const appId = process.env.WECHAT_APP_ID
  const redirectUri = `${request.nextUrl.origin}/api/auth/wechat/callback`

  if (!appId) {
    return NextResponse.json(
      { error: "微信登录未配置，请联系管理员" },
      { status: 500 }
    )
  }

  // 构建微信授权 URL
  const scope = "snsapi_userinfo" // 需要用户信息授权
  const state = Buffer.from(redirect).toString("base64") // 保存原始跳转地址
  const wechatAuthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`

  return NextResponse.redirect(wechatAuthUrl)
}

