'use client'

import { useState } from 'react'
import Image from 'next/image'

type ProductImage = {
  id: number
  url: string
  alt: string | null
  isPrimary: boolean
  displayOrder: number
}

export default function ProductImageGallery({
  images,
  productName,
}: {
  images: ProductImage[]
  productName: string
}) {
  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return a.displayOrder - b.displayOrder
  })

  const [activeIdx, setActiveIdx] = useState(0)
  const active = sorted[activeIdx] ?? null

  return (
    <div>
      {/* Main image */}
      <div
        style={{
          aspectRatio: '1 / 1',
          maxHeight: '480px',
          background: 'linear-gradient(145deg, #061526 0%, #020c1b 100%)',
          border: '1px solid rgba(59,130,246,0.13)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '10px',
        }}
      >
        {/* Dot grid */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(59,130,246,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Corner accents */}
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '24px', height: '24px', borderTop: '2px solid rgba(59,130,246,0.3)', borderLeft: '2px solid rgba(59,130,246,0.3)', borderRadius: '4px 0 0 0' }} />
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: '24px', height: '24px', borderTop: '2px solid rgba(59,130,246,0.3)', borderRight: '2px solid rgba(59,130,246,0.3)', borderRadius: '0 4px 0 0' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: '24px', height: '24px', borderBottom: '2px solid rgba(59,130,246,0.3)', borderLeft: '2px solid rgba(59,130,246,0.3)', borderRadius: '0 0 0 4px' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderBottom: '2px solid rgba(59,130,246,0.3)', borderRight: '2px solid rgba(59,130,246,0.3)', borderRadius: '0 0 4px 0' }} />

        {active ? (
          <Image
            src={active.url}
            alt={active.alt ?? productName}
            fill
            style={{ objectFit: 'contain', zIndex: 1 }}
            sizes="(max-width: 768px) 100vw, 480px"
            priority
            loading="eager"
          />
        ) : (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '14px',
            }}
          >
            <div
              style={{
                width: '60px', height: '60px', borderRadius: '50%',
                border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(59,130,246,0.25)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '10px', letterSpacing: '0.2em', color: '#1e3a5f' }}>
              SIN IMAGEN
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              className="thumb-btn"
              onClick={() => setActiveIdx(idx)}
              aria-label={`Ver imagen ${idx + 1}`}
              aria-pressed={idx === activeIdx}
              style={{
                width: '72px', height: '72px',
                padding: 0, cursor: 'pointer',
                border: idx === activeIdx
                  ? '2px solid #3b82f6'
                  : '1px solid rgba(59,130,246,0.15)',
                borderRadius: '3px', overflow: 'hidden',
                position: 'relative', flexShrink: 0,
                background: '#060f1d',
                transition: 'border-color 0.18s',
              }}
            >
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                fill
                style={{ objectFit: 'cover' }}
                sizes="72px"
              />
              {idx === activeIdx && (
                <div
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.12)' }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
