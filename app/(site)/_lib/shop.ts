export const WA_NUMBER = '573176642382'

export function waLink(text?: string) {
  return text
    ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${WA_NUMBER}`
}

export function formatCOP(price: number) {
  return '$' + price.toLocaleString('es-CO')
}

export const INSTAGRAM_URL = 'https://www.instagram.com/ic_variedades.1/'
export const INSTAGRAM_HANDLE = '@ic_variedades.1'

// Free home delivery in these towns (Valle del Cauca); everywhere else in
// Colombia ships by courier. Shown on home, product page and footer.
export const FREE_DELIVERY_TOWNS = ['Andalucía', 'Tuluá', 'Buga', 'Bugalagrande']

// "Andalucía, Tuluá, Buga y Bugalagrande"
export const FREE_DELIVERY_LIST =
  FREE_DELIVERY_TOWNS.slice(0, -1).join(', ') + ' y ' + FREE_DELIVERY_TOWNS[FREE_DELIVERY_TOWNS.length - 1]
