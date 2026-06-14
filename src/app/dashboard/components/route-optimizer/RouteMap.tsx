'use client'

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon, LatLngExpression } from 'leaflet'
import { useEffect, useState } from 'react'

// 📍 ატვირთვის მარკერი (მწვანე)
const pickupIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// 📍 ჩატვირთვის მარკერი (წითელი)
const deliveryIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// 🚛 მანქანის მარკერი (ლურჯი)
const vehicleIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/746/746776.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
})

// 📍 სტანდარტული მარკერი (ყვითელი)
const defaultIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export interface MapLocation {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: 'pickup' | 'delivery' | 'vehicle' | 'stop'
  status?: 'pending' | 'completed' | 'in_transit'
  time?: string
  routeId?: string
}

export interface RoutePath {
  id: string
  path: [number, number][]
  color?: string
}

interface RouteMapProps {
  locations: MapLocation[]
  routePaths?: RoutePath[]
  center?: [number, number]
  zoom?: number
  onLocationClick?: (location: MapLocation) => void
}

export default function RouteMap({ 
  locations, 
  routePaths = [],
  center = [42.31, 43.35] as [number, number],
  zoom = 7,
  onLocationClick 
}: RouteMapProps) {
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
  }, [])

  const getIcon = (type: MapLocation['type']) => {
    switch (type) {
      case 'pickup': return pickupIcon
      case 'delivery': return deliveryIcon
      case 'vehicle': return vehicleIcon
      default: return defaultIcon
    }
  }

  if (!mapReady) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🗺️</div>
          <p className="text-slate-600 font-medium">რუკა იტვირთება...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-full z-0"
      style={{ minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* მარშრუტის ხაზები */}
      {routePaths.map((routePath) => (
        <Polyline
          key={routePath.id}
          positions={routePath.path}
          color={routePath.color || '#3b82f6'}
          weight={4}
          opacity={0.8}
          dashArray="10, 10"
        />
      ))}

      {/* ლოკაციები */}
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng] as LatLngExpression}
          icon={getIcon(location.type)}
          eventHandlers={{
            click: () => onLocationClick?.(location)
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm mb-1">{location.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{location.address}</p>
              {location.time && (
                <p className="text-xs text-blue-600 mb-2">📍 {location.time}</p>
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