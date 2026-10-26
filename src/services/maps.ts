import { Coordinates, Place, PlaceCategory } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

export const MapsService = {
  async searchPlaces(query: string, nearCoords?: Coordinates, limit: number = 10): Promise<Place[]> {
    try {
      let url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`;
      if (nearCoords) {
        url += `&viewbox=${nearCoords.lng - 0.5},${nearCoords.lat + 0.5},${nearCoords.lng + 0.5},${nearCoords.lat - 0.5}&bounded=1`;
      }
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      return data.map((item: any) => ({
        id: `osm-${item.place_id}`,
        name: item.display_name.split(',')[0],
        address: item.display_name,
        coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
        category: this.categorizeFromType(item.type, item.class) as PlaceCategory,
        dataSource: 'OpenStreetMap/Nominatim',
        verified: false,
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  async findNearbyPlaces(
    center: Coordinates,
    radiusKm: number,
    category: PlaceCategory,
    limit: number = 20
  ): Promise<Place[]> {
    try {
      const query = this.buildOverpassQuery(center, radiusKm, category, limit);
      const response = await fetch(OVERPASS_BASE, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!response.ok) throw new Error('Overpass query failed');
      
      const data = await response.json();
      return this.parseOverpassResponse(data.elements, category);
    } catch (error) {
      console.error('Nearby search error:', error);
      return [];
    }
  },

  async reverseGeocode(coords: Coordinates): Promise<string> {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) return 'Location unavailable';
      const data = await response.json();
      return data.display_name || 'Location unavailable';
    } catch {
      return 'Location unavailable';
    }
  },

  async getRouteDistance(from: Coordinates, to: Coordinates): Promise<{ distance: number; duration: number } | null> {
    try {
      // Using OSRM public demo server for routing
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Routing failed');
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return {
          distance: data.routes[0].distance / 1000, // km
          duration: data.routes[0].duration / 60, // minutes
        };
      }
      return null;
    } catch (error) {
      console.error('Routing error:', error);
      return null;
    }
  },

  buildOverpassQuery(center: Coordinates, radiusKm: number, category: PlaceCategory, limit: number): string {
    const radius = radiusKm * 1000;
    const around = `around:${radius},${center.lat},${center.lng}`;
    
    const categoryQueries: Record<string, string> = {
      temple: `node["religion"="hindu"](${around});way["religion"="hindu"](${around});`,
      restaurant: `node["amenity"="restaurant"](${around});`,
      'street-food': `node["amenity"="fast_food"](${around});node["amenity"="food_court"](${around});`,
      hotel: `node["tourism"="hotel"](${around});node["tourism"="guest_house"](${around});`,
      ashram: `node["amenity"="place_of_worship"]["religion"="hindu"](${around});`,
      dharamshala: `node["tourism"="guest_house"](${around});`,
      guesthouse: `node["tourism"="guest_house"](${around});`,
      fuel: `node["amenity"="fuel"](${around});`,
      restroom: `node["amenity"="toilets"](${around});`,
      hospital: `node["amenity"="hospital"](${around});node["amenity"="clinic"](${around});`,
      parking: `node["amenity"="parking"](${around});`,
      breakfast: `node["amenity"="cafe"](${around});node["amenity"="restaurant"]["cuisine"="breakfast"](${around});`,
      'tea-snack': `node["amenity"="cafe"](${around});`,
      sweets: `node["shop"="confectionery"](${around});node["amenity"="ice_cream"](${around});`,
      attraction: `node["tourism"="attraction"](${around});node["historic"](${around});`,
    };

    const query = categoryQueries[category] || categoryQueries.restaurant;
    return `[out:json][timeout:25];(${query});out body ${limit};`;
  },

  parseOverpassResponse(elements: any[], category: PlaceCategory): Place[] {
    return elements
      .filter((el: any) => el.lat && el.lon)
      .map((el: any) => ({
        id: `osm-${el.id}`,
        name: el.tags?.name || el.tags?.['name:en'] || 'Unnamed place',
        address: this.formatAddress(el.tags),
        coordinates: { lat: el.lat, lng: el.lon },
        category,
        phone: el.tags?.phone || el.tags?.['contact:phone'],
        website: el.tags?.website || el.tags?.['contact:website'],
        openingHours: el.tags?.opening_hours,
        dataSource: 'OpenStreetMap',
        verified: false,
      }));
  },

  formatAddress(tags: any): string {
    if (!tags) return 'Address not available';
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:state'],
      tags['addr:postcode'],
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  },

  categorizeFromType(type: string, osmClass: string): PlaceCategory {
    if (osmClass === 'amenity' && type === 'place_of_worship') return 'temple';
    if (osmClass === 'amenity' && type === 'restaurant') return 'restaurant';
    if (osmClass === 'amenity' && type === 'fast_food') return 'street-food';
    if (osmClass === 'amenity' && type === 'fuel') return 'fuel';
    if (osmClass === 'amenity' && type === 'hospital') return 'hospital';
    if (osmClass === 'tourism') return 'attraction';
    return 'attraction';
  },
};

export function getGoogleMapsNavigationUrl(destination: Coordinates, name?: string): string {
  const query = name ? encodeURIComponent(name) : `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

export function getGoogleMapsSearchUrl(coords: Coordinates, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}&query_place_id=${encodeURIComponent(name)}`;
}
