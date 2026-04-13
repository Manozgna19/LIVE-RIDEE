import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RideMapProps {
  pickup: { lat: number; lng: number } | null;
  drop: { lat: number; lng: number } | null;
  driverPosition: { lat: number; lng: number } | null;
  status: string;
}

const HYDERABAD_CENTER = { lat: 17.4300, lng: 78.4500 };

function createPickupIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:linear-gradient(135deg,#22c55e,#16a34a);
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 3px 12px rgba(34,197,94,0.5);
      font-size:15px;font-weight:800;color:#fff;
    ">P</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createDropIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:linear-gradient(135deg,#ef4444,#dc2626);
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 3px 12px rgba(239,68,68,0.5);
      font-size:15px;font-weight:800;color:#fff;
    ">D</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createCarIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:40px;height:40px;border-radius:50%;
      background:linear-gradient(135deg,#f59e0b,#d97706);
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 3px 14px rgba(245,158,11,0.5);
      font-size:20px;
    ">🚗</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export default function RideMap({ pickup, drop, driverPosition, status }: RideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const driverTrailRef = useRef<L.Polyline | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [HYDERABAD_CENTER.lat, HYDERABAD_CENTER.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Pickup & drop markers + route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Pickup marker
    if (pickup) {
      if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
      else pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: createPickupIcon() }).addTo(map);
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }

    // Drop marker
    if (drop) {
      if (dropMarkerRef.current) dropMarkerRef.current.setLatLng([drop.lat, drop.lng]);
      else dropMarkerRef.current = L.marker([drop.lat, drop.lng], { icon: createDropIcon() }).addTo(map);
    } else if (dropMarkerRef.current) {
      map.removeLayer(dropMarkerRef.current);
      dropMarkerRef.current = null;
    }

    // Route line (blue dashed)
    if (pickup && drop) {
      const latlngs: L.LatLngExpression[] = [[pickup.lat, pickup.lng], [drop.lat, drop.lng]];
      if (routeLineRef.current) routeLineRef.current.setLatLngs(latlngs);
      else routeLineRef.current = L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 8',
      }).addTo(map);
      map.fitBounds(L.latLngBounds(latlngs).pad(0.3));
    } else if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (pickup && !drop) map.setView([pickup.lat, pickup.lng], 14);
  }, [pickup, drop]);

  // Driver marker + trail line from driver to destination
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverPosition) {
      // Smooth-move the car marker
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverPosition.lat, driverPosition.lng]);
      } else {
        driverMarkerRef.current = L.marker([driverPosition.lat, driverPosition.lng], {
          icon: createCarIcon(),
          zIndexOffset: 1000,
        }).addTo(map);
      }

      // Draw a trail line from driver to the relevant point
      const target = status === 'in_progress' && drop
        ? drop
        : status === 'accepted' && pickup
          ? pickup
          : null;

      if (target) {
        const trailLatLngs: L.LatLngExpression[] = [
          [driverPosition.lat, driverPosition.lng],
          [target.lat, target.lng],
        ];
        if (driverTrailRef.current) {
          driverTrailRef.current.setLatLngs(trailLatLngs);
        } else {
          driverTrailRef.current = L.polyline(trailLatLngs, {
            color: '#f59e0b',
            weight: 3,
            opacity: 0.6,
            dashArray: '6, 6',
          }).addTo(map);
        }

        // Fit bounds to show driver + pickup + drop
        const allPoints: L.LatLngExpression[] = [[driverPosition.lat, driverPosition.lng]];
        if (pickup) allPoints.push([pickup.lat, pickup.lng]);
        if (drop) allPoints.push([drop.lat, drop.lng]);
        if (allPoints.length >= 2) {
          map.fitBounds(L.latLngBounds(allPoints).pad(0.2));
        }
      } else if (driverTrailRef.current) {
        map.removeLayer(driverTrailRef.current);
        driverTrailRef.current = null;
      }
    } else {
      if (driverMarkerRef.current) { map.removeLayer(driverMarkerRef.current); driverMarkerRef.current = null; }
      if (driverTrailRef.current) { map.removeLayer(driverTrailRef.current); driverTrailRef.current = null; }
    }
  }, [driverPosition, status, pickup, drop]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: '300px' }} />;
}
