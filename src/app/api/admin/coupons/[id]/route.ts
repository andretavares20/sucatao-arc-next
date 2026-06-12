import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, unknown> = {}

  if (typeof body.code === "string" && body.code.trim()) {
    const code = body.code.trim().toUpperCase()
    if (code.length < 3) {
      return NextResponse.json({ error: "Código deve ter pelo menos 3 caracteres." }, { status: 400 })
    }
    update.code = code
  }

  const discountType = body.discount_type === "fixed" || body.discount_type === "percentage" ? body.discount_type : undefined
  if (discountType) update.discount_type = discountType

  if (body.discount !== undefined) {
    const discount = Number(body.discount)
    if (!Number.isFinite(discount) || discount <= 0) {
      return NextResponse.json({ error: "Desconto deve ser maior que zero." }, { status: 400 })
    }
    if (discountType === "percentage" && discount > 100) {
      return NextResponse.json({ error: "Desconto percentual não pode passar de 100%." }, { status: 400 })
    }
    update.discount = discount
  }

  if (body.usage_limit !== undefined) {
    if (body.usage_limit === null || body.usage_limit === "") {
      update.usage_limit = null
    } else {
      const usageLimit = Number(body.usage_limit)
      if (!Number.isFinite(usageLimit) || usageLimit < 1) {
        return NextResponse.json({ error: "Limite de uso deve ser um número positivo." }, { status: 400 })
      }
      update.usage_limit = usageLimit
    }
  }

  if (body.expiration_date !== undefined) {
    update.expiration_date = typeof body.expiration_date === "string" && body.expiration_date ? body.expiration_date : null
  }

  if (body.status === "active" || body.status === "inactive") update.status = body.status

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para atualizar." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("coupons").update(update).eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe um cupom com esse código." }, { status: 409 })
    }
    console.error("api/admin/coupons/[id] PATCH error:", error)
    return NextResponse.json({ error: "Erro ao atualizar cupom." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from("coupons").delete().eq("id", id)

  if (error) {
    console.error("api/admin/coupons/[id] DELETE error:", error)
    return NextResponse.json({ error: "Erro ao remover cupom." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
