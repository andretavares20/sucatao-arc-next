import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, unknown> = {}

  if (typeof body.code === "string" && body.code.trim()) update.code = body.code.trim().toUpperCase()

  if (body.discount_percent !== undefined) {
    const discountPercent = Number(body.discount_percent)
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      return NextResponse.json({ error: "Desconto deve ser um número entre 1 e 100." }, { status: 400 })
    }
    update.discount_percent = discountPercent
  }

  if (body.max_uses !== undefined) {
    if (body.max_uses === null || body.max_uses === "") {
      update.max_uses = null
    } else {
      const maxUses = Number(body.max_uses)
      if (!Number.isFinite(maxUses) || maxUses <= 0) {
        return NextResponse.json({ error: "Limite de usos deve ser maior que zero ou vazio para ilimitado." }, { status: 400 })
      }
      update.max_uses = maxUses
    }
  }

  if (body.expires_at !== undefined) {
    update.expires_at = typeof body.expires_at === "string" && body.expires_at ? body.expires_at : null
  }

  if (typeof body.active === "boolean") update.active = body.active

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
