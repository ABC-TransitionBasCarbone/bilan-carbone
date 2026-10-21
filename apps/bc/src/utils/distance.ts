const PARIS_LATITUDE = 48.8533249
const PARIS_LONGITUDE = 2.3488596
const EARTH_RADIUS_KM = 6371

export interface Coordinates {
  latitude: number
  longitude: number
}

export const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

export const calculateDistanceFromParis = (coordinates: Coordinates): number => {
  return Math.round(
    calculateHaversineDistance(coordinates.latitude, coordinates.longitude, PARIS_LATITUDE, PARIS_LONGITUDE),
  )
}
