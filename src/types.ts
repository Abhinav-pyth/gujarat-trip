export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  category: PlaceCategory;
  phone?: string;
  website?: string;
  openingHours?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  description?: string;
  speciality?: string[];
  parking?: boolean;
  ac?: boolean;
  familyRoom?: boolean;
  pricePerNight?: string;
  roomType?: string;
  distanceFromRoute?: number;
  detourMinutes?: number;
  dataSource?: string;
  lastVerified?: string;
  verified?: boolean;
}

export type PlaceCategory =
  | 'temple'
  | 'attraction'
  | 'restaurant'
  | 'street-food'
  | 'hotel'
  | 'ashram'
  | 'dharamshala'
  | 'guesthouse'
  | 'fuel'
  | 'restroom'
  | 'hospital'
  | 'parking'
  | 'breakfast'
  | 'tea-snack'
  | 'sweets';

export interface ItineraryDay {
  day: number;
  title: string;
  date: string;
  departure: string;
  origin: string;
  originCoords: Coordinates;
  destination: string;
  destinationCoords: Coordinates;
  estimatedArrival: string;
  totalDistance: string;
  estimatedDuration: string;
  stops: ItineraryStop[];
  accommodation?: Place[];
  notes?: string;
}

export interface ItineraryStop {
  id: string;
  name: string;
  coordinates: Coordinates;
  address?: string;
  type: 'waypoint' | 'sightseeing' | 'food' | 'fuel' | 'restroom' | 'breakfast' | 'lunch' | 'tea' | 'accommodation';
  estimatedTime?: string;
  duration?: string;
  notes?: string;
  completed?: boolean;
}

export interface TripExpense {
  id: string;
  category: 'fuel' | 'food' | 'accommodation' | 'parking' | 'toll' | 'miscellaneous';
  amount: number;
  description: string;
  date: string;
  location?: string;
}

export interface SavedPlace {
  id: string;
  place: Place;
  savedAt: string;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: 'luggage' | 'documents' | 'medicine' | 'food' | 'electronics' | 'other';
  checked: boolean;
}

export interface TrackingState {
  isTracking: boolean;
  currentPosition: Coordinates | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  distanceRemaining: number | null;
  estimatedArrival: string | null;
  nextStop: ItineraryStop | null;
  nextStopDistance: number | null;
  offRoute: boolean;
  updateInterval: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  budgetMax: number;
  dietaryPreferences: string[];
  gpsUpdateInterval: number;
  gpsAccuracy: 'high' | 'balanced' | 'low';
  searchRadius: number;
  language: 'en' | 'hi' | 'gu';
}

export type Page = 'home' | 'map' | 'food' | 'stay' | 'saved' | 'itinerary' | 'tracking' | 'expenses' | 'checklist' | 'settings';
