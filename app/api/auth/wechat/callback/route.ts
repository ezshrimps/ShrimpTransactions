import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface WeChatTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
}

interface WeChatUserInfo {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const redirect = state ? Buffer.from(state, "base64").toString() : request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${redirect}?error=微信授权失败`)
  }

  const appId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${redirect}?error=微信登录未配置`)
  }

  try {
    // 第一步：用 code 换取 access_token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    const tokenRes = await fetch(tokenUrl)
    const tokenData: WeChatTokenResponse = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error("微信 token 获取失败:", tokenData)
      return NextResponse.redirect(`${redirect}?error=获取微信token失败`)
    }

    // 第二步：用 access_token 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`
    const userInfoRes = await fetch(userInfoUrl)
    const userInfo: WeChatUserInfo = await userInfoRes.json()

    if (!userInfo.openid) {
      console.error("微信用户信息获取失败:", userInfo)
      return NextResponse.redirect(`${redirect}?error=获取用户信息失败`)
    }

    // 第三步：将用户信息传递给前端处理
    // 前端会调用 /api/auth/wechat/session 来创建 Supabase session
    const userData = {
      openid: userInfo.openid,
      unionid: userInfo.unionid,
      nickname: userInfo.nickname,
      avatar: userInfo.headimgurl,
    }

    // 重定向到前端回调页面，携带用户信息
    const redirectUrl = new URL(`${redirect}/auth/wechat/callback`)
    redirectUrl.searchParams.set("user", Buffer.from(JSON.stringify(userData)).toString("base64"))

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("微信登录处理失败:", error)
    return NextResponse.redirect(`${redirect}?error=登录处理失败`)
  }
}

