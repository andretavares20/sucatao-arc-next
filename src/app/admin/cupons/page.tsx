"use client"

import { useCallback, useEffect, useState } from "react"
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react"

type Coupon = {
  id: string
  code: string
  discount_percent: number
  max_uses: number | null
  uses_count: number
  discount_total: number
  expires_at: string | null
  active: boolean
  created_at: string
}

type FormState = {
  code: string
  discount_percent: string
  max_uses: string
  expires_at: string
}

const EMPTY_FORM: FormState = { code: "", discount_percent: "", max_uses: "", expires_at: "" }

const inputStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)", border: "1px solid var(--line)", color: "var(--text)",
  padding: "8px 10px", fontSize: "12px",
}

const btnStyle: React.CSSProperties = {
  border: "1px solid var(--line)", background: "rgba(255,255,255,0.04)", color: "var(--text)",
  padding: "8px 12px", fontSize: "11px", fontWeight: 950, textTransform: "uppercase", cursor: "pointer",
}

const iconBtnStyle: React.CSSProperties = {
  border: "1px solid var(--line)", background: "rgba(255,255,255,0.04)", color: "var(--text)",
  width: "30px", height: "30px", display: "grid", placeItems: "center", cursor: "pointer",
}

function formatNumber(n: number | undefined) {
  return (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(s: string | null) {
  if (!s) return "—"
  return new Date(`${s}T00:00:00`).toLocaleDateString("pt-BR")
}

function isExpired(coupon: Coupon) {
  if (!coupon.expires_at) return false
  return new Date(`${coupon.expires_at}T23:59:59`).getTime() < Date.now()
}

function statusInfo(coupon: Coupon) {
  if (!coupon.active) return { label: "Inativo", color: "var(--muted)" }
  if (isExpired(coupon)) return { label: "Expirado", color: "var(--red)" }
  return { label: "Ativo", color: "var(--green)" }
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set("q", q)

    const res = await fetch(`/api/admin/coupons?${params.toString()}`)
    const body = await res.json().catch(() => ({}))
    if (res.ok) setCoupons(body.items ?? [])
    setLoading(false)
  }, [q])

  useEffect(() => {
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
  }, [load])

  function openCreateModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setModalOpen(true)
  }

  function openEditModal(coupon: Coupon) {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      discount_percent: String(coupon.discount_percent),
      max_uses: coupon.max_uses === null ? "" : String(coupon.max_uses),
      expires_at: coupon.expires_at ?? "",
    })
    setFormError("")
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError("")

    const payload = {
      code: form.code,
      discount_percent: form.discount_percent,
      max_uses: form.max_uses === "" ? null : form.max_uses,
      expires_at: form.expires_at === "" ? null : form.expires_at,
    }

    const res = await fetch(editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)

    if (res.ok) {
      setModalOpen(false)
      load()
    } else {
      setFormError(body.error ?? "Erro ao salvar cupom.")
    }
  }

  async function toggleActive(coupon: Coupon) {
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c))
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    })
  }

  async function removeCoupon(coupon: Coupon) {
    if (!confirm(`Remover o cupom ${coupon.code}?`)) return
    setCoupons(prev => prev.filter(c => c.id !== coupon.id))
    await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" })
  }

  const activeCount = coupons.filter(c => c.active && !isExpired(c)).length
  const totalUses = coupons.reduce((sum, c) => sum + (c.uses_count ?? 0), 0)
  const totalDiscount = coupons.reduce((sum, c) => sum + (c.discount_total ?? 0), 0)

  return (
    <>
      <div className="utility-panel" style={{ marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Pesquisar cupom..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ ...inputStyle, flex: "1 1 220px" }}
        />
        <button type="button" onClick={openCreateModal} style={{ ...btnStyle, borderColor: "var(--cyan)", color: "var(--cyan)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Plus size={14} /> Criar cupom
        </button>
      </div>

      <div className="utility-stats cols-4">
        <article>
          <span>Cupons ativos</span>
          <strong>{activeCount}</strong>
        </article>
        <article>
          <span>Cupons utilizados</span>
          <strong>{totalUses}</strong>
        </article>
        <article>
          <span>Valor descontado</span>
          <strong>R$ {formatNumber(totalDiscount)}</strong>
        </article>
        <article>
          <span>Economia total</span>
          <strong>R$ {formatNumber(totalDiscount)}</strong>
        </article>
      </div>

      <div className="utility-panel" style={{ marginTop: "16px" }}>
        <div className="utility-panel-head">
          <strong>Cupons</strong>
          <small>{coupons.length} {coupons.length === 1 ? "cupom" : "cupons"}</small>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>Carregando...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "8px" }}>Código</th>
                  <th style={{ padding: "8px" }}>Desconto</th>
                  <th style={{ padding: "8px" }}>Uso</th>
                  <th style={{ padding: "8px" }}>Valor descontado</th>
                  <th style={{ padding: "8px" }}>Expiração</th>
                  <th style={{ padding: "8px" }}>Status</th>
                  <th style={{ padding: "8px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => {
                  const status = statusInfo(coupon)
                  return (
                    <tr key={coupon.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px", fontFamily: "monospace", fontWeight: 800, color: "var(--cyan)" }}>{coupon.code}</td>
                      <td style={{ padding: "8px" }}>{coupon.discount_percent}%</td>
                      <td style={{ padding: "8px", color: "var(--muted)" }}>{coupon.uses_count}/{coupon.max_uses ?? "∞"}</td>
                      <td style={{ padding: "8px" }}>R$ {formatNumber(coupon.discount_total)}</td>
                      <td style={{ padding: "8px", color: "var(--muted)", whiteSpace: "nowrap" }}>{formatDate(coupon.expires_at)}</td>
                      <td style={{ padding: "8px" }}>
                        <span style={{
                          display: "inline-block", border: `1px solid ${status.color}`, color: status.color, background: "rgba(255,255,255,0.04)",
                          padding: "3px 8px", fontSize: "10px", fontWeight: 950, textTransform: "uppercase", whiteSpace: "nowrap",
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: "8px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button type="button" onClick={() => toggleActive(coupon)} title={coupon.active ? "Desativar" : "Ativar"} style={iconBtnStyle}>
                            {coupon.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button type="button" onClick={() => openEditModal(coupon)} title="Editar" style={iconBtnStyle}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => removeCoupon(coupon)} title="Remover" style={{ ...iconBtnStyle, borderColor: "var(--red)", color: "var(--red)" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {coupons.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>Nenhum cupom encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <form onSubmit={handleSubmit} className="marker-modal" style={{ maxWidth: "480px" }} onClick={e => e.stopPropagation()}>
            <p className="modal-kicker">{editingId ? "Editar cupom" : "Criar cupom"}</p>
            <h2 style={{ fontSize: "20px" }}>{editingId ? "Editar cupom" : "Novo cupom"}</h2>

            <div className="marker-form-grid">
              <label>
                <span>Código</span>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="EX: PROMO10"
                  maxLength={32}
                  required
                  autoComplete="off"
                />
              </label>
              <label>
                <span>Desconto (%)</span>
                <input
                  type="number"
                  value={form.discount_percent}
                  onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                  placeholder="Ex: 10"
                  min={1}
                  max={100}
                  step="0.01"
                  required
                />
              </label>
              <label>
                <span>Limite de usos (vazio = ilimitado)</span>
                <input
                  type="number"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Ilimitado"
                  min={1}
                  step="1"
                />
              </label>
              <label>
                <span>Expiração (vazio = sem validade)</span>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                />
              </label>
            </div>

            <div className="marker-form-meta">
              <span>{formError}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={closeModal} style={btnStyle}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...btnStyle, borderColor: "var(--cyan)", color: "var(--cyan)", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
