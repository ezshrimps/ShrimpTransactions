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

    // 第三步：直接在服务端创建 Supabase session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.redirect(`${redirect}?error=系统配置错误`)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const email = `${userInfo.openid}@wechat.local`
    let userId: string | null = null

    // 查找现有用户
    const { data: users } = await supabase.auth.admin.listUsers()
    const existingUser = users?.users?.find(
      (u) => u.user_metadata?.wechat_openid === userInfo.openid
    )

    if (existingUser) {
      userId = existingUser.id
    } else {
      // 创建新用户
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          wechat_openid: userInfo.openid,
          nickname: userInfo.nickname,
          avatar: userInfo.headimgurl,
          provider: "wechat",
        },
      })

      if (createError) {
        console.error("创建用户失败:", createError)
        return NextResponse.redirect(`${redirect}?error=创建用户失败`)
      }

      userId = newUser.user?.id || null
    }

    if (!userId) {
      return NextResponse.redirect(`${redirect}?error=无法获取用户ID`)
    }

    // 生成 magic link 用于登录
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirect,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error("生成 link 失败:", linkError)
      return NextResponse.redirect(`${redirect}?error=创建会话失败`)
    }

    // 直接重定向到 magic link，完成登录
    return NextResponse.redirect(linkData.properties.action_link)
  } catch (error) {
    console.error("微信登录处理失败:", error)
    return NextResponse.redirect(`${redirect}?error=登录处理失败`)
  }
}

