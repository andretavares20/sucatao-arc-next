"use client"

export type PricingOption = {
  id: string
  label: string
  unitQuantity: number
  price: number
  isDefault?: boolean
}

export type SellerProduct = {
  inventoryId: string
  stock: number
  product: {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    pricing_options: PricingOption[]
    rarity: { id: string; label: string; color: string } | null
    category: { id: string; label: string } | null
  }
}

export function SellerProductCard({ item }: { item: SellerProduct }) {
  const { product, stock } = item
  const defaultOption = product.pricing_options.find(o => o.isDefault) ?? product.pricing_options[0]
  const displayPrice = defaultOption?.price ?? product.price
  const rarity = product.rarity

  return (
    <article
      className="utility-card"
      style={{ borderColor: rarity?.color ? `${rarity.color}40` : undefined, display: "flex", flexDirection: "column", gap: "10px" }}
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width: "100%", height: "100px", objectFit: "contain", borderRadius: "4px", background: "rgba(255,255,255,0.03)" }}
        />
      ) : (
        <div style={{ width: "100%", height: "100px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", display: "grid", placeItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 800 }}>Sem imagem</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {rarity && (
          <span style={{ fontSize: "10px", fontWeight: 950, textTransform: "uppercase", color: rarity.color, border: `1px solid ${rarity.color}40`, padding: "2px 6px" }}>
            {rarity.label}
          </span>
        )}
        {product.category && (
          <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)", border: "1px solid var(--line-soft)", padding: "2px 6px" }}>
            {product.category.label}
          </span>
        )}
      </div>

      <strong style={{ fontSize: "14px", lineHeight: 1.2 }}>{product.name}</strong>

      {product.description && (
        <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: 1.4, margin: 0 }}>{product.description}</p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
        <div>
          <p style={{ color: "var(--muted)", fontSize: "11px", margin: "0 0 2px", textTransform: "uppercase", fontWeight: 800 }}>
            {product.pricing_options.length > 1 ? `A partir de` : `Preço`}
          </p>
          <strong style={{ fontSize: "18px", color: "var(--cyan)" }}>
            R$ {displayPrice.toFixed(2).replace(".", ",")}
          </strong>
          <p style={{ color: "var(--muted)", fontSize: "11px", margin: "2px 0 0", fontWeight: 800 }}>
            {stock} em estoque
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
        <button
          type="button"
          style={{ flex: 1, border: "1px solid var(--line)", background: "rgba(0,217,255,0.08)", color: "var(--cyan)", cursor: "pointer", minHeight: "38px", fontSize: "11px", fontWeight: 950, textTransform: "uppercase" }}
        >
          Comprar
        </button>
        <button
          type="button"
          style={{ flex: 1, border: "1px solid rgba(255,212,0,0.3)", background: "rgba(255,212,0,0.06)", color: "var(--yellow)", cursor: "pointer", minHeight: "38px", fontSize: "11px", fontWeight: 950, textTransform: "uppercase" }}
        >
          Trocar
        </button>
      </div>
    </article>
  )
}
