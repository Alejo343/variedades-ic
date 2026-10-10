'use client'

// Submits the surrounding GET form as soon as the order changes.
export default function SortSelect({ value }: { value: string }) {
  return (
    <select
      name="orden"
      defaultValue={value}
      className="select"
      aria-label="Ordenar productos"
      onChange={e => e.currentTarget.form?.requestSubmit()}
    >
      <option value="recientes">Más recientes</option>
      <option value="precio-asc">Menor precio</option>
      <option value="precio-desc">Mayor precio</option>
    </select>
  )
}
