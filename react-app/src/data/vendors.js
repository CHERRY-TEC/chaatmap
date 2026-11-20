// Seed dataset — Hyderabad street-food vendors.
// Star ratings and hygiene factors live on the REVIEWS; all displayed
// scores are computed from them at runtime (see src/lib/hygiene.js).

const AUTHORS = [
  'Aarav Reddy', 'Sneha Iyer', 'Rahul Verma', 'Fatima Sheikh', 'Kiran Rao',
  'Divya Menon', 'Arjun Nair', 'Priya Das', 'Sameer Khan', 'Neha Gupta',
]

const COMMENTS = [
  'Really fresh and the place was spotless. Will come again!',
  'Taste is authentic, hygiene standards are visibly good.',
  'Crowded in the evening but worth the wait.',
  'Chutneys were freshly made, served with gloves on.',
  'Great value for money and clean surroundings.',
  'Quality has been consistent on every visit.',
  'Best in the area — seats get filled fast on weekends.',
  'Staff maintained headgear and counters were covered.',
  'A bit noisy at peak hours, but food quality is top notch.',
  'RO water used for the pani, noticed and appreciated.',
]

const SEED_DATES = [
  '2026-10-28', '2026-10-21', '2026-10-14', '2026-10-05', '2026-09-27',
  '2026-09-19', '2026-09-08', '2026-08-30', '2026-08-17', '2026-08-02',
]

/**
 * Build seed reviews. All reviews of a vendor share the same four-factor
 * tuple (so the computed hygiene score lands on the designed value) while
 * stars vary (so the computed customer rating lands on its designed value).
 */
function seed(vendorId, stars, factors) {
  return stars.map((s, i) => ({
    id: `${vendorId}-r${i + 1}`,
    author: AUTHORS[i % AUTHORS.length],
    stars: s,
    comment: COMMENTS[i % COMMENTS.length],
    date: SEED_DATES[i % SEED_DATES.length],
    water: factors.water,
    covered: factors.covered,
    gloves: factors.gloves,
    surroundings: factors.surroundings,
  }))
}

// Designed scores → factor tuples (verified against the weighted formula):
// 4.9 = (5,5,5,4) · 4.7 = (5,5,4,4) · 4.6 = (4,5,5,5) · 4.5 = (5,5,4,3) · 4.4 = (5,4,4,4)
const T = {
  h49: { water: 5, covered: 5, gloves: 5, surroundings: 4 },
  h47: { water: 5, covered: 5, gloves: 4, surroundings: 4 },
  h46: { water: 4, covered: 5, gloves: 5, surroundings: 5 },
  h45: { water: 5, covered: 5, gloves: 4, surroundings: 3 },
  h44: { water: 5, covered: 4, gloves: 4, surroundings: 4 },
}

export const VENDORS = [
  {
    id: 'mahalaxmi-chaat-center',
    name: 'Mahalaxmi Chaat Center',
    category: 'pani-puri',
    specialty: 'Pani Puri • Chaat',
    area: 'Sindhi Colony',
    distanceKm: 1.2,
    priceMin: 30,
    priceMax: 60,
    image: '/images/vendor-1.jpg',
    emoji: '🫗',
    description:
      'A legendary Sindhi Colony counter known for crisp puris, tangy imli water and queues that move fast. The display counter stays covered and RO water is used for the pani.',
    lat: 17.4306,
    lng: 78.4622,
    openNow: true,
    hours: '11:00 AM – 11:00 PM',
    fssaiVerified: true,
    dishes: [
      { name: 'Pani Puri (6 pcs)', price: 30 },
      { name: 'Bhel Puri', price: 40 },
      { name: 'Sev Puri', price: 40 },
      { name: 'Dahi Puri', price: 50 },
    ],
    reviews: seed(
      'mahalaxmi',
      [5, 5, 5, 5, 4, 5, 5, 5, 5, 5],
      T.h49,
    ),
  },
  {
    id: 'sri-sai-dosa-corner',
    name: 'Sri Sai Dosa Corner',
    category: 'dosa',
    specialty: 'Dosa • Idli',
    area: 'Madhapur',
    distanceKm: 2.1,
    priceMin: 50,
    priceMax: 100,
    image: '/images/vendor-2.jpg',
    emoji: '🌯',
    description:
      'A busy tiffin bandi in Madhapur serving paper-thawed dosas straight off the griddle. Steel plates, fresh batter and a wiped-down counter make this a reliable evening stop.',
    lat: 17.4435,
    lng: 78.3772,
    openNow: true,
    hours: '7:00 AM – 10:30 PM',
    fssaiVerified: true,
    dishes: [
      { name: 'Masala Dosa', price: 60 },
      { name: 'Onion Uttapam', price: 70 },
      { name: 'Idli Sambar (2 pcs)', price: 50 },
      { name: 'Filter Coffee', price: 30 },
    ],
    reviews: seed(
      'sri-sai',
      [5, 5, 5, 5, 5, 5, 5, 4, 4, 4],
      T.h47,
    ),
  },
  {
    id: 'hyderabad-mirchi-bajji',
    name: 'Hyderabad Mirchi Bajji',
    category: 'snacks',
    specialty: 'Mirchi Bajji • Snacks',
    area: 'Ameerpet',
    distanceKm: 3.3,
    priceMin: 30,
    priceMax: 70,
    image: '/images/vendor-3.jpg',
    emoji: '🌶️',
    description:
      'The Ameerpet bajji stop — stuffed green chilies fried to order, served with onion salad and mint chutney. Oil is changed frequently and the glass case keeps snacks covered.',
    lat: 17.4375,
    lng: 78.4483,
    openNow: true,
    hours: '4:00 PM – 11:00 PM',
    fssaiVerified: false,
    dishes: [
      { name: 'Mirchi Bajji (2 pcs)', price: 30 },
      { name: 'Onion Bajji', price: 40 },
      { name: 'Punugulu', price: 50 },
      { name: 'Masala Chai', price: 20 },
    ],
    reviews: seed(
      'mirchi-bajji',
      [5, 5, 5, 5, 5, 5, 4, 4, 4, 4],
      T.h46,
    ),
  },
  {
    id: 'pav-bhaji-house',
    name: 'Pav Bhaji House',
    category: 'pav-bhaji',
    specialty: 'Pav Bhaji',
    area: 'Kukatpally',
    distanceKm: 4.1,
    priceMin: 40,
    priceMax: 90,
    image: '/images/vendor-4.jpg',
    emoji: '🍞',
    description:
      'Buttery pav bhaji with a generous mound of bhaji finished on a clean tawa. A Kukatpally favourite for late-night bites with family seating available.',
    lat: 17.4849,
    lng: 78.4138,
    openNow: true,
    hours: '12:00 PM – 12:00 AM',
    fssaiVerified: true,
    dishes: [
      { name: 'Pav Bhaji', price: 70 },
      { name: 'Cheese Pav Bhaji', price: 90 },
      { name: 'Masala Pav', price: 50 },
      { name: 'Sweet Lassi', price: 40 },
    ],
    reviews: seed(
      'pav-bhaji',
      [5, 5, 5, 5, 5, 4, 4, 4, 4, 4],
      T.h45,
    ),
  },
  {
    id: 'momos-junction',
    name: 'Gachibowli Momos Junction',
    category: 'momos',
    specialty: 'Momos • Thukpa',
    area: 'Gachibowli',
    distanceKm: 2.8,
    priceMin: 40,
    priceMax: 80,
    image: '/images/vendor-5.jpg',
    emoji: '🥟',
    description:
      'Steamed and fried momos with spicy schezwan dip, popular with the IT crowd. Steamers run continuously so nothing sits out uncovered.',
    lat: 17.44,
    lng: 78.3489,
    openNow: true,
    hours: '11:00 AM – 11:00 PM',
    fssaiVerified: false,
    dishes: [
      { name: 'Steamed Veg Momos (8)', price: 50 },
      { name: 'Fried Paneer Momos', price: 80 },
      { name: 'Thukpa Bowl', price: 70 },
    ],
    reviews: seed(
      'momos-junction',
      [5, 5, 5, 5, 4, 4, 4, 4, 4, 4],
      T.h44,
    ),
  },
  {
    id: 'charminar-chai-point',
    name: 'Charminar Chai Point',
    category: 'snacks',
    specialty: 'Irani Chai • Bun Maski',
    area: 'Old City',
    distanceKm: 5.2,
    priceMin: 20,
    priceMax: 50,
    image: '/images/vendor-6.jpg',
    emoji: '☕',
    description:
      'Cutting chai and bun-maski within sight of the Charminar. Copper vessels, fresh bakarkhani and a wiped-clean ledge — a classic Old City morning ritual.',
    lat: 17.3616,
    lng: 78.4747,
    openNow: true,
    hours: '6:00 AM – 10:00 PM',
    fssaiVerified: true,
    dishes: [
      { name: 'Irani Chai', price: 20 },
      { name: 'Bun Maski', price: 30 },
      { name: 'Osmania Biscuit', price: 25 },
    ],
    reviews: seed(
      'charminar-chai',
      [5, 5, 5, 5, 5, 5, 4, 4, 4, 4],
      T.h46,
    ),
  },
  {
    id: 'sindhi-samosa-house',
    name: 'Sindhi Samosa House',
    category: 'samosa',
    specialty: 'Samosa • Kachori',
    area: 'Sindhi Colony',
    distanceKm: 1.5,
    priceMin: 20,
    priceMax: 40,
    image: '/images/vendor-7.jpg',
    emoji: '🔺',
    description:
      'Flaky, potato-stuffed samosas fried in the morning batch, served with sweet tamarind and green chutney. Quick grab-and-go counter with paper-lined trays.',
    lat: 17.4335,
    lng: 78.4651,
    openNow: false,
    hours: '8:00 AM – 9:00 PM',
    fssaiVerified: false,
    dishes: [
      { name: 'Samosa (2 pcs)', price: 25 },
      { name: 'Kachori', price: 30 },
      { name: 'Samosa Chaat', price: 40 },
    ],
    reviews: seed(
      'sindhi-samosa',
      [5, 5, 5, 5, 5, 4, 4, 4, 4, 4],
      T.h45,
    ),
  },
  {
    id: 'banjara-ragda-pattice',
    name: 'Banjara Ragda Pattice',
    category: 'chaat',
    specialty: 'Ragda Pattice • Chaat',
    area: 'Banjara Hills',
    distanceKm: 3.9,
    priceMin: 40,
    priceMax: 80,
    image: '/images/vendor-8.jpg',
    emoji: '🥘',
    description:
      'Golden patties drowned in slow-cooked white pea ragda, finished with chopped onion, coriander and a squeeze of lime. Prepared fresh in small batches.',
    lat: 17.4126,
    lng: 78.4392,
    openNow: true,
    hours: '5:00 PM – 11:30 PM',
    fssaiVerified: true,
    dishes: [
      { name: 'Ragda Pattice', price: 60 },
      { name: 'Pani Puri (6 pcs)', price: 40 },
      { name: 'Dahi Sev Puri', price: 55 },
    ],
    reviews: seed(
      'ragda-pattice',
      [5, 5, 5, 5, 5, 5, 5, 4, 4, 4],
      T.h47,
    ),
  },
]

export const AREAS = [
  'Hyderabad',
  'Sindhi Colony',
  'Madhapur',
  'Ameerpet',
  'Kukatpally',
  'Gachibowli',
  'Old City',
  'Banjara Hills',
]

export function getVendor(id, vendors = VENDORS) {
  return vendors.find((v) => v.id === id)
}
