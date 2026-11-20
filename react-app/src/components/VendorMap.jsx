import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Star, ShieldCheck } from 'lucide-react'
import { vendorHygiene, vendorRating } from '../lib/hygiene.js'

// Brand-orange teardrop pin (divIcon — no default marker image assets needed)
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:#F45116;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">
            <div style="width:9px;height:9px;background:#fff;border-radius:50%"></div>
          </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
})

function FitBounds({ points, nonce }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) {
      const b = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(b.pad(0.25), { animate: true, maxZoom: 13 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce])
  return null
}

/**
 * Interactive OpenStreetMap map with vendor markers, popups and
 * automatic bounds around the currently visible vendors.
 */
export default function VendorMap({ vendors, className = 'h-full w-full' }) {
  const points = useMemo(
    () => vendors.filter((v) => typeof v.lat === 'number' && typeof v.lng === 'number'),
    [vendors],
  )
  const nonce = points.map((p) => p.id).join('|')

  return (
    <MapContainer
      center={[17.42, 78.42]}
      zoom={11}
      className={className}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((v) => {
        const hygiene = vendorHygiene(v)
        const rating = vendorRating(v)
        return (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={pinIcon}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong style={{ fontSize: 14 }}>{v.name}</strong>
                <div style={{ color: '#666', margin: '2px 0 6px' }}>
                  {v.area} · {v.specialty}
                </div>
                <div style={{ display: 'flex', gap: 10, fontWeight: 700, marginBottom: 8 }}>
                  <span style={{ color: '#F45116' }}>★ {rating ?? '—'}</span>
                  <span style={{ color: '#18864B' }}>
                    🛡 {hygiene ?? '—'} hygiene
                  </span>
                </div>
                <Link
                  to={`/vendor/${v.id}`}
                  style={{
                    display: 'inline-block',
                    background: '#F45116',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: 'none',
                  }}
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
      <FitBounds points={points} nonce={nonce} />
    </MapContainer>
  )
}
