// Utility functions for ride calculations

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type VehicleType = 'bike' | 'auto' | 'car';

export function calculateFare(distanceKm: number, vehicleType: VehicleType): number {
  const rates = { bike: 7, auto: 12, car: 14 };
  const baseFare = { bike: 25, auto: 30, car: 50 };
  return Math.round(baseFare[vehicleType] + distanceKm * rates[vehicleType]);
}

export function calculateETA(distanceKm: number): number {
  const minutes = (distanceKm / 20) * 60;
  return Math.max(2, Math.round(minutes));
}

export function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: 'rider' | 'driver';
  vehicle_type: VehicleType | null;
  vehicle_name: string | null;
  vehicle_number: string | null;
  seats: number;
  is_available: boolean;
  rating: number;
  total_rides: number;
  created_at: string;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  pickup_name: string;
  drop_name: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  vehicle_type: VehicleType;
  fare: number;
  distance_km: number;
  eta: number | null;
  otp: string | null;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

export interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}
