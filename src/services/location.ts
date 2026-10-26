import { Coordinates, TrackingState } from '../types';

export type LocationCallback = (state: Partial<TrackingState>) => void;

class LocationServiceClass {
  private watchId: number | null = null;
  private callback: LocationCallback | null = null;
  private currentPosition: Coordinates | null = null;

  async requestPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      return false;
    }
    try {
      const permission = await new Promise<PermissionState>((resolve) => {
        if (navigator.permissions) {
          navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            resolve(result.state);
          });
        } else {
          resolve('prompt');
        }
      });
      return permission !== 'denied';
    } catch {
      return true; // Assume allowed if we can't check
    }
  }

  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.currentPosition = coords;
          resolve(coords);
        },
        (error) => {
          reject(new Error(this.getErrorMessage(error.code)));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  startTracking(
    callback: LocationCallback,
    interval: number = 5000,
    accuracy: 'high' | 'balanced' | 'low' = 'balanced'
  ): void {
    if (!navigator.geolocation) {
      callback({ isTracking: false });
      return;
    }

    this.callback = callback;
    const enableHighAccuracy = accuracy === 'high';
    const maxAge = accuracy === 'low' ? 30000 : accuracy === 'balanced' ? 10000 : 0;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.currentPosition = coords;
        callback({
          isTracking: true,
          currentPosition: coords,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        });
      },
      (error) => {
        callback({
          isTracking: false,
          currentPosition: null,
        });
        console.error('Location tracking error:', this.getErrorMessage(error.code));
      },
      {
        enableHighAccuracy,
        timeout: interval * 2,
        maximumAge: maxAge,
      }
    );

    callback({ isTracking: true, updateInterval: interval });
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.callback?.({ isTracking: false });
    this.callback = null;
  }

  getIsTracking(): boolean {
    return this.watchId !== null;
  }

  getCurrentPositionSync(): Coordinates | null {
    return this.currentPosition;
  }

  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) * Math.cos(this.toRad(to.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  estimateTravelTime(distanceKm: number, avgSpeedKmh: number = 60): number {
    return (distanceKm / avgSpeedKmh) * 60; // minutes
  }

  isOffRoute(currentPos: Coordinates, routePoints: Coordinates[], threshold: number = 2): boolean {
    if (routePoints.length < 2) return false;
    
    let minDistance = Infinity;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const dist = this.distanceToSegment(currentPos, routePoints[i], routePoints[i + 1]);
      if (dist < minDistance) minDistance = dist;
    }
    return minDistance > threshold;
  }

  private distanceToSegment(p: Coordinates, a: Coordinates, b: Coordinates): number {
    const ab = { lat: b.lat - a.lat, lng: b.lng - a.lng };
    const ap = { lat: p.lat - a.lat, lng: p.lng - a.lng };
    const ab2 = ab.lat * ab.lat + ab.lng * ab.lng;
    const apab = ap.lat * ab.lat + ap.lng * ab.lng;
    const t = Math.max(0, Math.min(1, apab / ab2));
    const closest = {
      lat: a.lat + t * ab.lat,
      lng: a.lng + t * ab.lng,
    };
    return this.calculateDistance(p, closest);
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private getErrorMessage(code: number): string {
    switch (code) {
      case 1: return 'Location permission denied. Please enable location access in your browser settings.';
      case 2: return 'Location unavailable. Please check your GPS settings.';
      case 3: return 'Location request timed out. Please try again.';
      default: return 'Unknown location error.';
    }
  }
}

export const LocationService = new LocationServiceClass();

export function generateGoogleMapsUrl(from: Coordinates, to: Coordinates): string {
  return `https://www.google.com/maps/dir/${from.lat},${from.lng}/${to.lat},${to.lng}`;
}

export function generateGoogleMapsPlaceUrl(place: Coordinates, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${place.lat},${place.lng}`;
}

export function generateGoogleMapsDirectionsUrl(destination: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}
