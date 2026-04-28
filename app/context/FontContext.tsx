'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type FontType = 'outfit' | 'orbitron'

interface FontContextType {
  font: FontType
  toggleFont: () => void
}

const FontContext = createContext<FontContextType>({
  font: 'outfit',
  toggleFont: () => {},
})

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFont] = useState<FontType>('outfit')

  const toggleFont = () =>
    setFont((f) => (f === 'outfit' ? 'orbitron' : 'outfit'))

  return (
    <FontContext.Provider value={{ font, toggleFont }}>
      <div className={`flex flex-col flex-1 ${font === 'outfit' ? 'font-outfit' : 'font-orbitron'}`}>
        {children}
      </div>
    </FontContext.Provider>
  )
}

export const useFont = () => useContext(FontContext)
