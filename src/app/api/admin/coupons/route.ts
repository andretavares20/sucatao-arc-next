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
    .select("id, code, discount, discount_type, usage_count, usage_limit, expiration_date, status, total_discounted, created_at")
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
  const discountType = body.discount_type === "fixed" ? "fixed" : "percentage"
  const discount = Number(body.discount)
  const usageLimit = body.usage_limit === null || body.usage_limit === "" || body.usage_limit === undefined ? null : Number(body.usage_limit)
  const expirationDate = typeof body.expiration_date === "string" && body.expiration_date ? body.expiration_date : null
  const status = body.status === "inactive" ? "inactive" : "active"

  if (code.length < 3) {
    return NextResponse.json({ error: "Código deve ter pelo menos 3 caracteres." }, { status: 400 })
  }

  if (!Number.isFinite(discount) || discount <= 0) {
    return NextResponse.json({ error: "Desconto deve ser maior que zero." }, { status: 400 })
  }

  if (discountType === "percentage" && discount > 100) {
    return NextResponse.json({ error: "Desconto percentual não pode passar de 100%." }, { status: 400 })
  }

  if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit < 1)) {
    return NextResponse.json({ error: "Limite de uso deve ser um número positivo." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("coupons")
    .insert({ code, discount, discount_type: discountType, usage_limit: usageLimit, expiration_date: expirationDate, status })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe um cupom com esse código." }, { status: 409 })
    }
    console.error("api/admin/coupons POST error:", error)
    return NextResponse.json({ error: "Erro ao criar cupom." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
