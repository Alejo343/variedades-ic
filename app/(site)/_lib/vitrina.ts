// Product cutouts (transparent WebP, trimmed to their edges) in
// public/vitrina/. They are decoration for the home page — hero collage
// and ticker — not catalog data, so they don't link anywhere.

export type Cutout = { src: string; w: number; h: number; alt: string }

const cut = (name: string, w: number, h: number, alt: string): Cutout => ({
  src: `/vitrina/${name}.webp`, w, h, alt,
})

export const CUTOUTS = {
  parlante: cut('parlante-karaoke', 720, 606, 'Parlante karaoke con micrófonos'),
  audifonos: cut('audifonos', 362, 507, 'Audífonos inalámbricos'),
  camara: cut('camara-ip', 510, 709, 'Cámara de seguridad Wi-Fi'),
  plancha: cut('plancha', 703, 720, 'Plancha para el cabello'),
  difusor: cut('difusor', 472, 512, 'Difusor de aromas'),
  tirasLed: cut('tiras-led', 286, 231, 'Tiras LED de colores'),
  dispensador: cut('dispensador', 720, 709, 'Dispensador de agua automático'),
  intercomunicador: cut('intercomunicador', 720, 679, 'Intercomunicadores para casco'),
  lonchera: cut('lonchera', 234, 222, 'Lonchera calefactora'),
  candado: cut('candado-alarma', 582, 720, 'Candado con alarma'),
  huevera: cut('huevera', 675, 441, 'Huevera'),
  manguera: cut('manguera', 447, 281, 'Manguera extensible'),
  cepillo: cut('cepillo-limpieza', 275, 501, 'Cepillo de limpieza recargable'),
} as const

// Small cutouts that separate the words of the ticker.
export const TICKER_CUTOUTS: Cutout[] = [
  CUTOUTS.audifonos, CUTOUTS.difusor, CUTOUTS.camara, CUTOUTS.tirasLed,
  CUTOUTS.lonchera, CUTOUTS.cepillo, CUTOUTS.candado,
]
