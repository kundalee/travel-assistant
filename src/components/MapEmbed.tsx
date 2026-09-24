export function MapEmbed({ lat, lng, h = 160 }: { lat: number; lng: number; h?: number }) {
  return (
    <iframe
      title="map" src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
      style={{ width: '100%', height: h, border: 0, borderRadius: 'var(--radius)', display: 'block' }}
      loading="lazy" referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
