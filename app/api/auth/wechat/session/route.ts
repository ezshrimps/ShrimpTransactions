import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { id, openid, nickname, avatar } = await request.json()

    if (!openid) {
      return NextResponse.json({ error: "缺少微信 openid" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // 注意：需要使用 SUPABASE_SERVICE_ROLE_KEY（服务端密钥）才能创建用户
    // 如果没有配置，使用 anon_key 但功能会受限
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase 配置缺失" }, { status: 500 })
    }

    // 使用服务端密钥创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const email = `${openid}@wechat.local`
    let userId: string | null = null

    // 查找现有用户
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // 如果有 service_role_key，可以使用 admin API
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find(
        (u) => u.user_metadata?.wechat_openid === openid
      )
      if (existingUser) {
        userId = existingUser.id
      }

      // 如果用户不存在，创建新用户
      if (!userId) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            wechat_openid: openid,
            nickname,
            avatar,
            provider: "wechat",
          },
        })

        if (createError) {
          console.error("创建用户失败:", createError)
          return NextResponse.json({ error: "创建用户失败" }, { status: 500 })
        }

        userId = newUser.user?.id || null
      }

      // 生成 magic link（用于创建 session）
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: request.nextUrl.origin,
        },
      })

      if (linkError || !linkData) {
        console.error("生成 link 失败:", linkError)
        return NextResponse.json({ error: "创建会话失败" }, { status: 500 })
      }

      // 从 link 中提取 token（简化处理）
      // 实际应该使用 linkData.properties.hashed_token 或通过其他方式获取 session
      return NextResponse.json({
        session: {
          user: {
            id: userId,
            email,
            user_metadata: {
              wechat_openid: openid,
              nickname,
              avatar,
            },
          },
          // 注意：这里返回的 token 需要前端正确处理
          // 更好的方式是直接返回 magic link，让用户点击完成登录
          access_token: linkData.properties?.hashed_token || "",
          refresh_token: "",
        },
        magicLink: linkData.properties?.action_link,
      })
    } else {
      // 如果没有 service_role_key，返回错误提示
      return NextResponse.json(
        { error: "需要配置 SUPABASE_SERVICE_ROLE_KEY 才能使用微信登录" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("微信 session 创建失败:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

