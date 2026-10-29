# Gujarat Yatra Companion 🙏

A comprehensive, mobile-first Progressive Web App for planning and navigating a family road trip from Indore to Gujarat.

## Features

### 🗺️ Live GPS Tracking
- Real-time location tracking with configurable update intervals
- Distance remaining and ETA calculations
- Off-route detection
- Privacy-first: all data stays on your device

### 📋 7-Day Preloaded Itinerary
- Day 1: Indore → Rajkot (~530 km)
- Day 2: Rajkot → Dwarka via Nageshwar & Beyt Dwarka (~200 km, 6:30 AM start)
- Day 3: Dwarka Darshan — Rukmini Devi, Gopi Talav & Gomti Dham (Nageshwar/Beyt done on Day 2)
- Day 4: Dwarka → Somnath via Porbandar (~230 km)
- Day 5: Somnath → Sarangpur (~280 km)
- Day 6: Sarangpur → Pavagadh (~250 km)
- Day 7: Pavagadh → Indore (~350 km)

### 🍽️ Food Trail
- Discover restaurants along your route
- Filter by cuisine type (Gujarati thali, street food, breakfast, sweets)
- Dietary preferences (Vegetarian, Jain-friendly)
- Must-try local specialties guide

### 🏨 Stay Finder
- Search for budget hotels, ashrams, dharamshalas, guesthouses
- Filter by budget, parking, family rooms
- Recommended stays for each destination
- Direct navigation to accommodations

### 📍 Place Discovery
- Search any place using OpenStreetMap data
- Nearby places along your route (2-20 km radius)
- Categories: temples, restaurants, fuel, hospitals, restrooms, parking
- Open in Google Maps for navigation

### 💰 Expense Tracker
- Track fuel, food, accommodation, parking, toll expenses
- Category-wise breakdown
- Running total

### ✅ Travel Checklist
- Pre-loaded essential items for the trip
- Categories: documents, luggage, medicine, food, electronics

### 📱 PWA Support
- Installable on Android via "Add to Home Screen"
- Offline access to saved itinerary and preferences
- Service worker for caching

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS 4** for styling
- **Leaflet** + OpenStreetMap for maps
- **IndexedDB** (via `idb`) for local storage
- **OSRM** for route calculations
- **Overpass API** for place discovery
- **Nominatim** for geocoding

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Type Checking

```bash
npm run typecheck
```

## Project Structure

```
src/
├── App.tsx              # Main application with all pages
├── main.tsx             # Entry point
├── index.css            # Tailwind CSS + custom styles
├── types.ts             # TypeScript type definitions
├── data/
│   └── itinerary.ts     # Preloaded 7-day itinerary data
├── services/
│   ├── storage.ts       # IndexedDB storage service
│   ├── location.ts      # GPS tracking service
│   └── maps.ts          # Maps, places, and routing service
public/
├── manifest.json        # PWA manifest
├── sw.js                # Service worker
└── favicon.svg          # App icon
```

## API Usage

The application uses free, open APIs:

### OpenStreetMap / Nominatim
- Geocoding and reverse geocoding
- Place search
- Usage policy: Max 1 request/second, proper attribution required

### Overpass API
- Nearby place discovery
- OpenStreetMap data queries
- Usage: Reasonable use, no heavy polling

### OSRM (Open Source Routing Machine)
- Route calculations and distances
- Public demo server used (for development)
- For production, consider self-hosting or using a commercial provider

### Google Maps (Optional)
- Navigation links open in Google Maps app/web
- No API key required for URL-based navigation

## Environment Variables

Create a `.env` file for optional API keys:

```env
# Optional: Google Maps API key for enhanced features
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Optional: Google Places API for business details
VITE_GOOGLE_PLACES_API_KEY=your_key_here
```

Without these keys, the app uses OpenStreetMap-based services as fallback.

## PWA Installation

1. Open the app in Chrome/Edge on Android
2. Tap the menu (⋮) → "Add to Home Screen" or "Install App"
3. The app icon will appear on your home screen
4. Open it like a native app

## Privacy

- **No server-side tracking**: All data stays on your device
- **GPS permission**: Only activated when you explicitly tap "Start Tracking"
- **No analytics**: No location history is uploaded anywhere
- **Offline-first**: Core features work without internet
- **Transparent**: Open source, inspect the code

## Limitations

- GPS tracking stops when the browser tab is backgrounded or closed
- Map tiles require internet connectivity
- Place search depends on OpenStreetMap data completeness
- Route calculations use OSRM demo server (rate limited)
- Business information (prices, hours) may not be current
- No offline turn-by-turn navigation

## Safety Notice

⚠️ **Do not use this app while driving.** Only interact with the app when:
- The vehicle is safely parked
- A passenger is operating the device
- Using voice commands (if supported by your device)

## Browser Support

- Chrome/Edge 90+ (Android)
- Firefox 90+
- Safari 15+ (limited PWA support)

## Attribution

- Map data © OpenStreetMap contributors
- Routing © OSRM
- Place data from OpenStreetMap/Overpass API

## License

MIT License - Free for personal and commercial use.

## Contributing

This is a personal project for a family road trip. Feel free to fork and customize for your own trips!

---

**Safe travels! 🙏🚗**
