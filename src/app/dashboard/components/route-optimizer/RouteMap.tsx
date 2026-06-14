'use client'

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon, LatLngExpression } from 'leaflet'
import { useEffect, useState } from 'react'

const truckIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/746/746776.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const stopIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
})

const warehouseIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3159/3159517.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
})

interface Location {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: 'warehouse' | 'stop' | 'vehicle'
  status?: 'pending' | 'completed' | 'in_transit'
  time?: string
}

interface RouteMapProps {
  locations: Location[]
  routePath?: [number, number][]
  center?: [number, number]
  zoom?: number
  onLocationClick?: (location: Location) => void
}

export default function RouteMap({ 
  locations, 
  routePath, 
  center = [42.31, 43.35] as [number, number],
  zoom = 8,
  onLocationClick 
}: RouteMapProps) {
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
  }, [])

  if (!mapReady) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">️</div>
          <p className="text-gray-600">რუკა იტვირთება...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl z-0"
      style={{ minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routePath && routePath.length > 1 && (
        <Polyline
          positions={routePath}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
          dashArray="10, 10"
        />
      )}

      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng] as LatLngExpression}
          icon={
            location.type === 'warehouse' 
              ? warehouseIcon 
              : location.type === 'vehicle'
              ? truckIcon
              : stopIcon
          }
          eventHandlers={{
            click: () => onLocationClick?.(location)
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm mb-1">{location.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{location.address}</p>
              {location.time && (
                <p className="text-xs text-blue-600 mb-2">⏰ {location.time}</p>
              )}
              {location.status && (
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  location.status === 'completed' ? 'bg-green-100 text-green-800' :
                  location.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {location.status === 'completed' ? '✅ დასრულებული' :
                   location.status === 'in_transit' ? '🚚 გზაში' :
                   '⏳ ლოდინში'}
                </span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}