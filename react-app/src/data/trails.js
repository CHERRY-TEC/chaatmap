// Curated food trails — stops reference vendor ids from data/vendors.js.
export const TRAILS = [
  {
    id: 'hyderabad-chaat-trail',
    name: 'Hyderabad Chaat Trail',
    image: '/images/trail-1.jpg',
    stops: 5,
    duration: '1.5 hrs',
    avgHygiene: 4.8,
    description:
      'A five-stop loop through the city’s best-loved chaat counters — pani puri to ragda pattice, all hygiene-rated by the community.',
    vendorIds: [
      'mahalaxmi-chaat-center',
      'sindhi-samosa-house',
      'banjara-ragda-pattice',
      'hyderabad-mirchi-bajji',
      'momos-junction',
    ],
  },
  {
    id: 'old-city-food-walk',
    name: 'Old City Food Walk',
    image: '/images/trail-2.jpg',
    stops: 6,
    duration: '2 hrs',
    avgHygiene: 4.7,
    description:
      'Walk from Charminar to Laad Bazaar for Irani chai, bun maski and timeless street eats steeped in history.',
    vendorIds: [
      'charminar-chai-point',
      'mahalaxmi-chaat-center',
      'sindhi-samosa-house',
      'pav-bhaji-house',
      'sri-sai-dosa-corner',
      'hyderabad-mirchi-bajji',
    ],
  },
]

export function getTrail(id) {
  return TRAILS.find((t) => t.id === id)
}
