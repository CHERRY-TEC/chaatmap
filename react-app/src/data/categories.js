// Food categories — clicking one opens Explore with the category pre-selected.
export const CATEGORIES = [
  { id: 'pani-puri', name: 'Pani Puri', image: '/images/cat-panipuri.jpg', emoji: '🫗', vendors: 120, blurb: 'Crunchy puris, tangy spiced water' },
  { id: 'chaat', name: 'Chaat', image: '/images/cat-chaat.jpg', emoji: '🥘', vendors: 98, blurb: 'Bhel, sev puri, dahi classics' },
  { id: 'dosa', name: 'Dosa', image: '/images/cat-dosa.jpg', emoji: '🌯', vendors: 85, blurb: 'Crisp tiffin favourites' },
  { id: 'pav-bhaji', name: 'Pav Bhaji', image: '/images/cat-pavbhaji.jpg', emoji: '🍞', vendors: 64, blurb: 'Buttery Mumbai-style bhaji' },
  { id: 'momos', name: 'Momos', image: '/images/cat-momos.jpg', emoji: '🥟', vendors: 76, blurb: 'Steamed & spicy fried' },
  { id: 'samosa', name: 'Samosa', image: '/images/cat-samosa.jpg', emoji: '🔺', vendors: 92, blurb: 'Flaky, stuffed, fried fresh' },
  { id: 'vada-pav', name: 'Vada Pav', image: '/images/cat-vadapav.jpg', emoji: '🥔', vendors: 58, blurb: 'The original Mumbai vada' },
  { id: 'snacks', name: 'Street Snacks', image: '/images/cat-snacks.jpg', emoji: '🍢', vendors: 140, blurb: 'Bajji, punugulu & more' },
]

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id)
}
