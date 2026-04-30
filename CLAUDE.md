# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # start dev server at localhost:3000
npm run build     # production build
npm run lint      # ESLint (Next.js + TypeScript rules)
```

There is no test suite.

## Architecture

Single-page marketing site for **IC Variedades** (a Colombian store selling tech, beauty, and home goods). Built with Next.js 16, React 19, Tailwind CSS v4, TypeScript.

### Components

`app/components/` contains: `Hero`, `Categories`, `FeaturedProducts`, `WhyChooseUs`, `Footer`, and `Navbar`. All are rendered by `app/page.tsx`.

### Font system

`app/context/FontContext.tsx` provides a global font toggle (Outfit ↔ Orbitron) via React context. The `FontProvider` wraps the app in `layout.tsx`. The Navbar exposes a toggle button that calls `useFont().toggleFont()`. Two Google Fonts are registered as CSS variables in `layout.tsx`: `--font-outfit`, `--font-orbitron`.

### Styling

`app/globals.css` uses Tailwind v4's `@import "tailwindcss"` and `@theme inline` for design tokens. Custom CSS animation classes:
- `.slide-in-left`, `.slide-in-right` — entrance animations
- `.pulse-dot`, `.hero-card` — ambient animations
- `.scroll-reveal` — scroll-triggered fade-in (add `.visible` to activate)

All animations respect `prefers-reduced-motion`.

### Next.js version note

This project uses Next.js **16** (see `package.json`). APIs and conventions may differ from your training data — consult `node_modules/next/dist/docs/` for the authoritative reference before writing Next.js-specific code.
