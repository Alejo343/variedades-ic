'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PlaceholderArt } from './icons'

type GalleryImage = {
  id: number
  url: string
  alt: string | null
  isPrimary: boolean
  displayOrder: number
}

export default function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[]
  productName: string
}) {
  const sorted = [...images].sort((a, b) =>
    a.isPrimary !== b.isPrimary ? (a.isPrimary ? -1 : 1) : a.displayOrder - b.displayOrder
  )
  const [idx, setIdx] = useState(0)
  const active = sorted[idx] ?? null
  const many = sorted.length > 1
  const go = (d: number) => setIdx(i => (i + d + sorted.length) % sorted.length)

  return (
    <div
      className="pd-gallery"
      onKeyDown={e => {
        if (!many) return
        if (e.key === 'ArrowLeft') go(-1)
        if (e.key === 'ArrowRight') go(1)
      }}
    >
      <div className="gallery-main">
        {active ? (
          <Image
            key={active.id}
            src={active.url}
            alt={active.alt ?? productName}
            fill
            sizes="(max-width: 900px) 100vw, 600px"
            style={{ objectFit: 'contain', padding: '6%' }}
            priority
          />
        ) : (
          <div className="img-fallback"><PlaceholderArt /></div>
        )}
        {many && (
          <>
            <button type="button" className="gallery-nav prev" onClick={() => go(-1)} aria-label="Foto anterior">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="gallery-nav next" onClick={() => go(1)} aria-label="Foto siguiente">
              <ChevronRight aria-hidden="true" />
            </button>
            <span className="badge gallery-count" aria-live="polite">
              {idx + 1} / {sorted.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <div className="thumbs">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className="thumb"
              onClick={() => setIdx(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === idx}
            >
              <Image src={img.url} alt="" fill sizes="76px" style={{ objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
