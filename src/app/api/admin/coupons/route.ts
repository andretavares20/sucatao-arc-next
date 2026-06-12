import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const { searchParams } = request.nextUrl
  const q = searchParams.get("q")?.trim() ?? ""

  const supabase = createAdminClient()
  let query = supabase
    .from("coupons")
    .select("id, code, discount_percent, max_uses, uses_count, discount_total, expires_at, active, created_at")
    .order("created_at", { ascending: false })

  if (q) query = query.ilike("code", `%${q}%`)

  const { data, error } = await query

  if (error) {
    console.error("api/admin/coupons GET error:", error)
    return NextResponse.json({ error: "Erro ao carregar cupons." }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const body = await request.json().catch(() => ({}))

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
  const discountPercent = Number(body.discount_percent)
  const maxUses = body.max_uses === null || body.max_uses === "" || body.max_uses === undefined ? null : Number(body.max_uses)
  const expiresAt = typeof body.expires_at === "string" && body.expires_at ? body.expires_at : null

  if (!code) {
    return NextResponse.json({ error: "Informe o código do cupom." }, { status: 400 })
  }

  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    return NextResponse.json({ error: "Desconto deve ser um número entre 1 e 100." }, { status: 400 })
  }

  if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses <= 0)) {
    return NextResponse.json({ error: "Limite de usos deve ser maior que zero ou vazio para ilimitado." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("coupons")
    .insert({ code, discount_percent: discountPercent, max_uses: maxUses, expires_at: expiresAt })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe um cupom com esse código." }, { status: 409 })
    }
    console.error("api/admin/coupons POST error:", error)
    return NextResponse.json({ error: "Erro ao criar cupom." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
