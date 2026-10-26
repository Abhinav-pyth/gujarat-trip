import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, Clock, Fuel, UtensilsCrossed, Home, Bookmark, Map, List, DollarSign, CheckSquare, Settings, Search, ChevronRight, ChevronDown, Phone, ExternalLink, Star, Plus, Minus, Trash2, Heart, AlertTriangle, X, Menu, Sun, Moon, Locate, Route, Coffee, Bed, Camera, ArrowLeft, CircleDot, Info } from 'lucide-react';
import { Page, ItineraryDay, ItineraryStop, Place, TripExpense, SavedPlace, ChecklistItem, TrackingState, UserPreferences, Coordinates } from './types';
import { defaultItinerary } from './data/itinerary';
import { StorageService, defaultChecklist, defaultPreferences } from './services/storage';
import { LocationService, generateGoogleMapsDirectionsUrl } from './services/location';
import { MapsService, getGoogleMapsNavigationUrl, getGoogleMapsSearchUrl } from './services/maps';

// ==================== MAIN APP ====================
export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [darkMode, setDarkMode] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(defaultItinerary);
  const [currentDay, setCurrentDay] = useState(0);
  const [tracking, setTracking] = useState<TrackingState>({
    isTracking: false, currentPosition: null, accuracy: null, speed: null,
    heading: null, distanceRemaining: null, estimatedArrival: null,
    nextStop: null, nextStopDistance: null, offRoute: false, updateInterval: 5000,
  });
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('yatra-welcomed'));

  useEffect(() => {
    const init = async () => {
      const savedItinerary = await StorageService.getItinerary();
      if (savedItinerary.length > 0) setItinerary(savedItinerary);
      const savedExpenses = await StorageService.getExpenses();
      if (savedExpenses.length > 0) setExpenses(savedExpenses);
      const savedPlaces = await StorageService.getSavedPlaces();
      if (savedPlaces.length > 0) setSavedPlaces(savedPlaces);
      const savedChecklist = await StorageService.getChecklist();
      if (savedChecklist.length > 0) setChecklist(savedChecklist);
      const prefs = await StorageService.getPreferences();
      if (prefs) setPreferences(prefs);
    };
    init();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    const results = await MapsService.searchPlaces(query, tracking.currentPosition || undefined);
    setSearchResults(results);
    setIsSearching(false);
  }, [tracking.currentPosition]);

  const startTracking = useCallback(async () => {
    const hasPermission = await LocationService.requestPermission();
    if (!hasPermission) {
      showNotification('Location permission denied. Please enable in browser settings.');
      return;
    }
    LocationService.startTracking((state) => {
      setTracking(prev => ({ ...prev, ...state }));
    }, preferences.gpsUpdateInterval, preferences.gpsAccuracy);
    showNotification('GPS tracking started');
  }, [preferences, showNotification]);

  const stopTracking = useCallback(() => {
    LocationService.stopTracking();
    setTracking(prev => ({ ...prev, isTracking: false }));
    showNotification('GPS tracking stopped');
  }, [showNotification]);

  const savePlace = useCallback(async (place: Place) => {
    const saved: SavedPlace = { id: place.id, place, savedAt: new Date().toISOString() };
    await StorageService.savePlace(saved);
    setSavedPlaces(prev => [...prev.filter(p => p.id !== place.id), saved]);
    showNotification('Place saved!');
  }, [showNotification]);

  const removeSavedPlace = useCallback(async (id: string) => {
    await StorageService.deleteSavedPlace(id);
    setSavedPlaces(prev => prev.filter(p => p.id !== id));
    showNotification('Place removed');
  }, [showNotification]);

  const addExpense = useCallback(async (expense: TripExpense) => {
    await StorageService.saveExpense(expense);
    setExpenses(prev => [...prev, expense]);
    showNotification('Expense added');
  }, [showNotification]);

  const removeExpense = useCallback(async (id: string) => {
    await StorageService.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const toggleChecklist = useCallback(async (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    await StorageService.saveChecklist(updated);
  }, [checklist]);

  const todayItinerary = itinerary[currentDay];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'} pb-20`}>
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up`}>
            <div className="text-center">
              <span className="text-5xl block mb-3">🙏</span>
              <h2 className="text-xl font-bold mb-2">Gujarat Yatra Companion</h2>
              <p className="text-sm text-gray-500 mb-4">Your family road trip planner for the Indore → Gujarat pilgrimage</p>
              <div className={`text-left ${darkMode ? 'bg-slate-700' : 'bg-blue-50'} rounded-lg p-3 mb-4`}>
                <p className="text-xs font-medium mb-2">✨ Features:</p>
                <ul className="text-xs space-y-1 text-gray-600">
                  <li>📍 Live GPS tracking with navigation</li>
                  <li>📋 7-day preloaded itinerary</li>
                  <li>🍽️ Food trail & restaurant discovery</li>
                  <li>🏨 Budget stay finder</li>
                  <li>💰 Expense tracking</li>
                  <li>✅ Travel checklist</li>
                  <li>📱 Works offline (saved data)</li>
                </ul>
              </div>
              <div className={`${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} rounded-lg p-3 mb-4`}>
                <p className="text-xs text-amber-700">⚠️ <strong>Safety:</strong> Do not use while driving. Only interact when parked or have a passenger operate the app.</p>
              </div>
              <button
                onClick={() => { setShowWelcome(false); localStorage.setItem('yatra-welcomed', 'true'); }}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm"
              >
                🚗 Start My Journey
              </button>
              <p className="text-xs text-gray-400 mt-3">
                Install: Tap browser menu → "Add to Home Screen"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-1.5 text-center text-xs font-medium">
          📡 Offline Mode — Saved data available. Live maps and search require internet.
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-primary text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          {notification}
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 ${darkMode ? 'bg-slate-800' : 'bg-primary'} text-white shadow-lg`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🙏</span>
            <div>
              <h1 className="text-sm font-bold">Gujarat Yatra</h1>
              <p className="text-xs opacity-80">Day {currentDay + 1} of 7</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tracking.isTracking && (
              <span className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full text-xs">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
            <button onClick={() => setCurrentPage('settings')} className="p-2 rounded-full hover:bg-white/10">
              <Settings size={18} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/10">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
        {/* Trip Progress Bar */}
        <div className="h-1 bg-white/20">
          <div className="h-full bg-accent transition-all" style={{ width: `${((currentDay + 1) / 7) * 100}%` }}></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {currentPage === 'home' && (
          <HomePage
            todayItinerary={todayItinerary}
            currentDay={currentDay}
            setCurrentDay={setCurrentDay}
            tracking={tracking}
            startTracking={startTracking}
            stopTracking={stopTracking}
            totalExpenses={totalExpenses}
            expenses={expenses}
            darkMode={darkMode}
            setCurrentPage={setCurrentPage}
            showNotification={showNotification}
          />
        )}
        {currentPage === 'map' && (
          <MapPage
            itinerary={itinerary}
            currentDay={currentDay}
            tracking={tracking}
            darkMode={darkMode}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            savePlace={savePlace}
            savedPlaces={savedPlaces}
          />
        )}
        {currentPage === 'food' && (
          <FoodPage
            currentDay={currentDay}
            todayItinerary={todayItinerary}
            tracking={tracking}
            darkMode={darkMode}
            savePlace={savePlace}
            showNotification={showNotification}
          />
        )}
        {currentPage === 'stay' && (
          <StayPage
            currentDay={currentDay}
            todayItinerary={todayItinerary}
            tracking={tracking}
            darkMode={darkMode}
            preferences={preferences}
            savePlace={savePlace}
            showNotification={showNotification}
          />
        )}
        {currentPage === 'saved' && (
          <SavedPage
            savedPlaces={savedPlaces}
            removeSavedPlace={removeSavedPlace}
            darkMode={darkMode}
            showNotification={showNotification}
          />
        )}
        {currentPage === 'itinerary' && (
          <ItineraryPage
            itinerary={itinerary}
            currentDay={currentDay}
            setCurrentDay={setCurrentDay}
            darkMode={darkMode}
            showNotification={showNotification}
          />
        )}
        {currentPage === 'expenses' && (
          <ExpensesPage
            expenses={expenses}
            addExpense={addExpense}
            removeExpense={removeExpense}
            totalExpenses={totalExpenses}
            darkMode={darkMode}
          />
        )}
        {currentPage === 'checklist' && (
          <ChecklistPage
            checklist={checklist}
            toggleChecklist={toggleChecklist}
            darkMode={darkMode}
          />
        )}
        {currentPage === 'tracking' && (
          <TrackingPage
            tracking={tracking}
            startTracking={startTracking}
            stopTracking={stopTracking}
            todayItinerary={todayItinerary}
            darkMode={darkMode}
            preferences={preferences}
            setPreferences={setPreferences}
          />
        )}
        {currentPage === 'settings' && (
          <SettingsPage
            preferences={preferences}
            setPreferences={setPreferences}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-t bottom-nav-safe`}>
        <div className="flex justify-around items-center py-2">
          {[
            { page: 'home' as Page, icon: Home, label: 'Home' },
            { page: 'map' as Page, icon: Map, label: 'Map' },
            { page: 'food' as Page, icon: UtensilsCrossed, label: 'Food' },
            { page: 'stay' as Page, icon: Bed, label: 'Stay' },
            { page: 'saved' as Page, icon: Bookmark, label: 'Saved' },
          ].map(({ page, icon: Icon, label }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                currentPage === page
                  ? 'text-primary'
                  : darkMode ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ==================== HOME PAGE ====================
function HomePage({ todayItinerary, currentDay, setCurrentDay, tracking, startTracking, stopTracking, totalExpenses, expenses, darkMode, setCurrentPage, showNotification }: any) {
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={tracking.isTracking ? stopTracking : startTracking}
          className={`col-span-2 p-4 rounded-xl font-bold text-white shadow-lg card-hover ${
            tracking.isTracking ? 'bg-red-500' : 'bg-gujarat-gradient'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {tracking.isTracking ? (
              <>
                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                Stop Tracking
              </>
            ) : (
              <>
                <Navigation size={20} />
                Start Trip Tracking
              </>
            )}
          </div>
          {tracking.isTracking && tracking.currentPosition && (
            <p className="text-xs mt-1 opacity-80">
              {tracking.currentPosition.lat.toFixed(4)}, {tracking.currentPosition.lng.toFixed(4)}
            </p>
          )}
        </button>
      </div>

      {/* Today's Trip Card */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Day {currentDay + 1}: {todayItinerary?.title}</h2>
          <button onClick={() => setCurrentPage('itinerary')} className="text-primary text-sm font-medium">
            View All
          </button>
        </div>
        {todayItinerary && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-primary" />
              <span>Departure: {todayItinerary.departure}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-accent" />
              <span>{todayItinerary.origin} → {todayItinerary.destination}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Route size={14} className="text-success" />
              <span>{todayItinerary.totalDistance} • {todayItinerary.estimatedDuration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Navigation size={14} className="text-primary" />
              <span>ETA: {todayItinerary.estimatedArrival}</span>
            </div>
          </div>
        )}
        {/* Day selector */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {[0,1,2,3,4,5,6].map(d => (
            <button
              key={d}
              onClick={() => setCurrentDay(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                d === currentDay ? 'bg-primary text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              D{d+1}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Stops */}
      {todayItinerary && todayItinerary.stops.length > 0 && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold mb-3">Today's Stops</h3>
          <div className="space-y-2">
            {todayItinerary.stops.slice(0, 4).map((stop: ItineraryStop, idx: number) => (
              <StopCard key={stop.id} stop={stop} index={idx} darkMode={darkMode} />
            ))}
            {todayItinerary.stops.length > 4 && (
              <button onClick={() => setCurrentPage('itinerary')} className="text-primary text-sm font-medium mt-2">
                See all {todayItinerary.stops.length} stops →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: List, label: 'Itinerary', page: 'itinerary' as Page },
          { icon: DollarSign, label: 'Expenses', page: 'expenses' as Page },
          { icon: CheckSquare, label: 'Checklist', page: 'checklist' as Page },
          { icon: Navigation, label: 'GPS Track', page: 'tracking' as Page },
          { icon: Fuel, label: 'Nearby', page: 'map' as Page },
          { icon: AlertTriangle, label: 'Emergency', page: 'home' as Page },
        ].map(({ icon: Icon, label, page }) => (
          <button
            key={label}
            onClick={() => setCurrentPage(page)}
            className={`${darkMode ? 'bg-slate-800' : 'bg-white'} p-3 rounded-xl shadow-sm card-hover flex flex-col items-center gap-1.5`}
          >
            <Icon size={20} className="text-primary" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Nearby Quick Access (when tracking) */}
      {tracking.isTracking && tracking.currentPosition && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Nearby (from your location)
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '⛽', label: 'Fuel', cat: 'fuel' },
              { icon: '🍽️', label: 'Food', cat: 'restaurant' },
              { icon: '🚻', label: 'Restroom', cat: 'restroom' },
              { icon: '🏥', label: 'Hospital', cat: 'hospital' },
            ].map(item => (
              <button
                key={item.cat}
                onClick={() => setCurrentPage('map')}
                className={`${darkMode ? 'bg-slate-700' : 'bg-gray-50'} p-2 rounded-lg text-center`}
              >
                <span className="text-lg block">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trip Summary */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold mb-2">Trip Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className={`${darkMode ? 'bg-slate-700' : 'bg-blue-50'} rounded-lg p-3`}>
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="font-bold text-lg">₹{totalExpenses.toLocaleString()}</p>
          </div>
          <div className={`${darkMode ? 'bg-slate-700' : 'bg-green-50'} rounded-lg p-3`}>
            <p className="text-xs text-gray-500">Days Completed</p>
            <p className="font-bold text-lg">{currentDay} / 7</p>
          </div>
          <div className={`${darkMode ? 'bg-slate-700' : 'bg-amber-50'} rounded-lg p-3`}>
            <p className="text-xs text-gray-500">Total Distance</p>
            <p className="font-bold text-lg">~1860 km</p>
          </div>
          <div className={`${darkMode ? 'bg-slate-700' : 'bg-purple-50'} rounded-lg p-3`}>
            <p className="text-xs text-gray-500">Saved Places</p>
            <p className="font-bold text-lg">0</p>
          </div>
        </div>
      </div>

      {/* Emergency */}
      <div className={`${darkMode ? 'bg-red-900/30' : 'bg-red-50'} rounded-xl p-4 border border-red-200`}>
        <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
          <AlertTriangle size={16} /> Emergency
        </h3>
        <div className="flex gap-2">
          <a href="tel:112" className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium">
            📞 Call 112
          </a>
          <a href="tel:108" className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg text-center text-sm font-medium">
            🚑 Ambulance 108
          </a>
        </div>
        <p className="text-xs text-red-400 mt-2">
          ⚠️ Safety: Do not use this app while driving. Only interact when parked or have a passenger operate it.
        </p>
      </div>
    </div>
  );
}

// ==================== STOP CARD ====================
function StopCard({ stop, index, darkMode }: { stop: ItineraryStop; index: number; darkMode: boolean }) {
  const iconMap: Record<string, any> = {
    breakfast: Coffee, lunch: UtensilsCrossed, tea: Coffee, food: UtensilsCrossed,
    fuel: Fuel, restroom: MapPin, sightseeing: Camera, accommodation: Bed, waypoint: MapPin,
  };
  const Icon = iconMap[stop.type] || MapPin;
  
  return (
    <div className={`flex items-start gap-3 ${darkMode ? 'border-slate-700' : 'border-gray-100'} border-l-2 pl-3 py-1`}>
      <div className={`p-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
        <Icon size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{stop.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {stop.estimatedTime && <span>{stop.estimatedTime}</span>}
          {stop.duration && <span>• {stop.duration}</span>}
        </div>
        {stop.notes && <p className="text-xs text-gray-400 mt-0.5">{stop.notes}</p>}
      </div>
      <a
        href={getGoogleMapsNavigationUrl(stop.coordinates)}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full bg-primary/10 text-primary"
      >
        <Navigation size={14} />
      </a>
    </div>
  );
}

// ==================== MAP PAGE ====================
function MapPage({ itinerary, currentDay, tracking, darkMode, selectedPlace, setSelectedPlace, savePlace, savedPlaces }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [searchRadius, setSearchRadius] = useState(5);
  const [filterCategory, setFilterCategory] = useState<string>('temple');
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  const today = itinerary[currentDay];
  const center = tracking.currentPosition || today?.destinationCoords || { lat: 22.3, lng: 70.8 };

  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;
    
    const loadMap = async () => {
      const L = await import('leaflet');
      
      const map = L.map(mapRef.current!, {
        center: [center.lat, center.lng],
        zoom: 10,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add route markers
      if (today) {
        const routeCoords: [number, number][] = [
          [today.originCoords.lat, today.originCoords.lng],
          ...today.stops.map((s: ItineraryStop) => [s.coordinates.lat, s.coordinates.lng] as [number, number]),
          [today.destinationCoords.lat, today.destinationCoords.lng],
        ];

        // Draw route line
        L.polyline(routeCoords, { color: '#1e40af', weight: 3, opacity: 0.7 }).addTo(map);

        // Add markers for stops
        today.stops.forEach((stop: ItineraryStop) => {
          const marker = L.circleMarker([stop.coordinates.lat, stop.coordinates.lng], {
            radius: 6, fillColor: '#f59e0b', color: '#fff', weight: 2, fillOpacity: 0.9,
          }).addTo(map);
          marker.bindPopup(`<b>${stop.name}</b><br/>${stop.notes || ''}<br/><a href="${getGoogleMapsNavigationUrl(stop.coordinates)}" target="_blank">Navigate →</a>`);
        });

        // Origin marker
        L.marker([today.originCoords.lat, today.originCoords.lng], {
          icon: L.divIcon({ html: '<div style="background:#059669;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>', className: '', iconSize: [12, 12] })
        }).addTo(map).bindPopup(`<b>Start:</b> ${today.origin}`);

        // Destination marker
        L.marker([today.destinationCoords.lat, today.destinationCoords.lng], {
          icon: L.divIcon({ html: '<div style="background:#dc2626;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>', className: '', iconSize: [12, 12] })
        }).addTo(map).bindPopup(`<b>Destination:</b> ${today.destination}`);
      }

      // Add current position if tracking
      if (tracking.currentPosition) {
        L.circleMarker([tracking.currentPosition.lat, tracking.currentPosition.lng], {
          radius: 8, fillColor: '#3b82f6', color: '#fff', weight: 3, fillOpacity: 1,
        }).addTo(map).bindPopup('<b>Your Location</b>');
      }

      setMapLoaded(true);
      (window as any).__leafletMap = map;
    };

    loadMap();
  }, [currentDay]);

  // Update map position when tracking
  useEffect(() => {
    if (tracking.currentPosition && (window as any).__leafletMap) {
      const map = (window as any).__leafletMap;
      map.panTo([tracking.currentPosition.lat, tracking.currentPosition.lng]);
    }
  }, [tracking.currentPosition]);

  const searchNearby = async () => {
    setIsLoadingNearby(true);
    const results = await MapsService.findNearbyPlaces(center, searchRadius, filterCategory as any);
    setNearbyPlaces(results);
    setIsLoadingNearby(false);
  };

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ height: '300px' }}>
        <div ref={mapRef} className="w-full h-full"></div>
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        )}
        {/* Recenter button */}
        {tracking.isTracking && (
          <button
            onClick={() => {
              if ((window as any).__leafletMap && tracking.currentPosition) {
                (window as any).__leafletMap.panTo([tracking.currentPosition.lat, tracking.currentPosition.lng]);
              }
            }}
            className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg z-10"
          >
            <Locate size={20} className="text-primary" />
          </button>
        )}
      </div>

      {/* Nearby Search */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Search size={16} /> Search Along Route
        </h3>
        <div className="flex gap-2 mb-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          >
            <option value="temple">🛕 Temples</option>
            <option value="restaurant">🍽️ Restaurants</option>
            <option value="fuel">⛽ Fuel Stations</option>
            <option value="hotel">🏨 Hotels</option>
            <option value="restroom">🚻 Restrooms</option>
            <option value="hospital">🏥 Hospitals</option>
            <option value="parking">🅿️ Parking</option>
            <option value="street-food">🍜 Street Food</option>
            <option value="breakfast">☕ Breakfast</option>
          </select>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          >
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
          </select>
        </div>
        <button
          onClick={searchNearby}
          disabled={isLoadingNearby}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
        >
          {isLoadingNearby ? 'Searching...' : `Find ${filterCategory}s within ${searchRadius} km`}
        </button>
      </div>

      {/* Nearby Results */}
      {nearbyPlaces.length > 0 && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold mb-3">Nearby Places ({nearbyPlaces.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {nearbyPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} darkMode={darkMode} onSave={savePlace} />
            ))}
          </div>
        </div>
      )}

      {/* Route Info */}
      {today && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold mb-2">Route Information</h3>
          <div className="text-sm space-y-1">
            <p>📍 From: {today.origin}</p>
            <p>🏁 To: {today.destination}</p>
            <p>📏 Distance: {today.totalDistance}</p>
            <p>⏱️ Duration: {today.estimatedDuration}</p>
            <p className="text-xs text-gray-500 mt-2">
              Data source: OpenStreetMap. Distances are approximate. Use Google Maps for turn-by-turn navigation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== FOOD PAGE ====================
function FoodPage({ currentDay, todayItinerary, tracking, darkMode, savePlace, showNotification }: any) {
  const [foodResults, setFoodResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [foodCategory, setFoodCategory] = useState('restaurant');
  const [dietaryFilter, setDietaryFilter] = useState('veg');

  const center = tracking.currentPosition || todayItinerary?.destinationCoords || { lat: 22.3, lng: 70.8 };

  const searchFood = async () => {
    setIsLoading(true);
    const results = await MapsService.findNearbyPlaces(center, 5, foodCategory as any);
    setFoodResults(results);
    setIsLoading(false);
  };

  const foodCategories = [
    { id: 'restaurant', label: '🍽️ Restaurants', icon: '🍽️' },
    { id: 'street-food', label: '🍜 Street Food', icon: '🍜' },
    { id: 'breakfast', label: '☕ Breakfast', icon: '☕' },
    { id: 'tea-snack', label: '🫖 Tea & Snacks', icon: '🫖' },
    { id: 'sweets', label: '🍬 Sweets', icon: '🍬' },
  ];

  const famousFoods = [
    'Fafda-Jalebi', 'Gujarati Thali', 'Khaman-Dhokla', 'Thepla',
    'Kathiawadi Food', 'Dabeli', 'Gathiya', 'Handvo', 'Dhokla', 'Farsan'
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-1">🍽️ Food Trail</h2>
        <p className="text-sm text-gray-500">Discover famous local food along your route</p>
      </div>

      {/* Must-Try Foods */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold mb-3">Must-Try Gujarati Specialties</h3>
        <div className="flex flex-wrap gap-2">
          {famousFoods.map(food => (
            <span key={food} className={`px-3 py-1.5 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-amber-50 text-amber-800'}`}>
              {food}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          These are regional specialties to look for. Menu items vary by restaurant.
        </p>
      </div>

      {/* Food Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {foodCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFoodCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              foodCategory === cat.id
                ? 'bg-primary text-white'
                : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-600'
            } shadow-sm`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Dietary Filters */}
      <div className="flex gap-2">
        {['veg', 'jain', 'family', 'budget'].map(filter => (
          <button
            key={filter}
            onClick={() => setDietaryFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              dietaryFilter === filter
                ? 'bg-green-600 text-white'
                : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {filter === 'veg' ? '🥬 Vegetarian' : filter === 'jain' ? '🙏 Jain' : filter === 'family' ? '👨‍👩‍👧 Family' : '💰 Budget'}
          </button>
        ))}
      </div>

      {/* Search Button */}
      <button
        onClick={searchFood}
        disabled={isLoading}
        className="w-full bg-saffron-gradient text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
      >
        {isLoading ? '🔍 Searching...' : `🔍 Find Food Near My Route (${currentDay > 0 ? todayItinerary?.destination : 'Current Location'})`}
      </button>

      {/* Results */}
      {foodResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold">Found {foodResults.length} places</h3>
          {foodResults.map(place => (
            <PlaceCard key={place.id} place={place} darkMode={darkMode} onSave={savePlace} showDetour />
          ))}
        </div>
      )}

      {foodResults.length === 0 && !isLoading && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 shadow-sm text-center`}>
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-sm text-gray-500">Tap "Find Food" to discover restaurants along your route</p>
          <p className="text-xs text-gray-400 mt-1">Uses OpenStreetMap data. Results may vary.</p>
        </div>
      )}

      {/* Highway Tips */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold mb-2">💡 Highway Food Tips</h3>
        <ul className="text-sm space-y-1 text-gray-600">
          <li>• Look for busy restaurants - high turnover means fresh food</li>
          <li>• Highway dhabas often serve the best Gujarati thali</li>
          <li>• Petrol pump restaurants usually have clean washrooms</li>
          <li>• Carry water and snacks for remote stretches</li>
          <li>• Fafda-Jalebi is the classic Gujarati breakfast</li>
        </ul>
      </div>
    </div>
  );
}

// ==================== STAY PAGE ====================
function StayPage({ currentDay, todayItinerary, tracking, darkMode, preferences, savePlace, showNotification }: any) {
  const [stayResults, setStayResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [maxBudget, setMaxBudget] = useState(preferences.budgetMax);
  const [stayType, setStayType] = useState('hotel');
  const [needParking, setNeedParking] = useState(true);
  const [needFamilyRoom, setNeedFamilyRoom] = useState(true);

  const center = todayItinerary?.destinationCoords || tracking.currentPosition || { lat: 22.3, lng: 70.8 };

  const searchStays = async () => {
    setIsLoading(true);
    const results = await MapsService.findNearbyPlaces(center, 10, stayType as any);
    setStayResults(results);
    setIsLoading(false);
  };

  const stayTypes = [
    { id: 'hotel', label: '🏨 Hotels' },
    { id: 'guesthouse', label: '🏠 Guest Houses' },
    { id: 'ashram', label: '🛕 Ashrams' },
    { id: 'dharamshala', label: '🏛️ Dharamshalas' },
  ];

  // Predefined budget stays info for each destination
  const knownStays: Record<string, string[]> = {
    'Rajkot': ['Hotel Grand River', 'Hotel Imperial Palace', 'Gujarat Bhawan (Govt. Guest House)'],
    'Dwarka': ['Hotel Gomti', 'Dwarkadhish Guest House', 'Hotel Dwarkesh', 'Shree Dwarkadhish Temple Trust Accommodation'],
    'Somnath': ['Hotel Somnath', 'Somnath Trust Dharamshala', 'Hotel Harshidro', 'Tirth Hotel'],
    'Sarangpur': ['Sanstha Guest House (at temple)', 'Hotels in Botad (15 km away)'],
    'Pavagadh': ['Toral Toran Resort, Halol', 'Hotel Pavagadh', 'GMDC Guest House'],
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-1">🏨 Stay Finder</h2>
        <p className="text-sm text-gray-500">Find budget accommodation near your destinations</p>
      </div>

      {/* Quick Find */}
      <button
        onClick={searchStays}
        disabled={isLoading}
        className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
      >
        {isLoading ? '🔍 Searching...' : `🔍 Find Stay Near ${todayItinerary?.destination || 'Next Stop'}`}
      </button>

      {/* Stay Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stayTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setStayType(type.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              stayType === type.id
                ? 'bg-primary text-white'
                : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-600'
            } shadow-sm`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Budget Filter */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-2">Budget Filter</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs">₹500</span>
          <input
            type="range"
            min="500"
            max="5000"
            step="500"
            value={maxBudget}
            onChange={(e) => setMaxBudget(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs">₹5000</span>
        </div>
        <p className="text-center text-sm font-medium mt-1">Max: ₹{maxBudget}/night</p>
        <div className="flex gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={needParking} onChange={(e) => setNeedParking(e.target.checked)} className="rounded" />
            Parking
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={needFamilyRoom} onChange={(e) => setNeedFamilyRoom(e.target.checked)} className="rounded" />
            Family Room
          </label>
        </div>
      </div>

      {/* Results */}
      {stayResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold">Found {stayResults.length} stays</h3>
          {stayResults.map(place => (
            <PlaceCard key={place.id} place={place} darkMode={darkMode} onSave={savePlace} isAccommodation />
          ))}
        </div>
      )}

      {/* Known Stays */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold mb-3">📋 Recommended Stays by Destination</h3>
        <div className="space-y-3">
          {Object.entries(knownStays).map(([city, stays]) => (
            <div key={city}>
              <h4 className="text-sm font-medium text-primary">{city}</h4>
              <ul className="text-xs space-y-1 mt-1">
                {stays.map(stay => (
                  <li key={stay} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-accent rounded-full"></span>
                    {stay}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ⚠️ Prices not verified — call to confirm availability and rates. These are commonly known options.
        </p>
      </div>

      {/* Tips */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold mb-2">💡 Accommodation Tips</h3>
        <ul className="text-sm space-y-1 text-gray-600">
          <li>• Temple trust dharamshalas are often the most affordable</li>
          <li>• Book ahead for Dwarka and Somnath during festivals</li>
          <li>• Ashrams may have fixed meal and donation arrangements</li>
          <li>• Always confirm parking availability for your vehicle</li>
          <li>• Ask about family rooms vs. multiple single rooms</li>
        </ul>
      </div>
    </div>
  );
}

// ==================== SAVED PAGE ====================
function SavedPage({ savedPlaces, removeSavedPlace, darkMode, showNotification }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await MapsService.searchPlaces(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-3">🔍 Search Places</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search any place..."
            className={`flex-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          />
          <button onClick={handleSearch} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
            Search
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold mb-3">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map(place => (
              <PlaceCard key={place.id} place={place} darkMode={darkMode} onSave={() => {}} showSave />
            ))}
          </div>
        </div>
      )}

      {/* Saved Places */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold mb-3">❤️ Saved Places ({savedPlaces.length})</h3>
        {savedPlaces.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No saved places yet. Search and save places you want to visit!</p>
        ) : (
          <div className="space-y-3">
            {savedPlaces.map((sp: SavedPlace) => (
              <div key={sp.id} className={`flex items-start gap-3 p-3 ${darkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg`}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{sp.place.name}</p>
                  <p className="text-xs text-gray-500">{sp.place.address}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    📍 {sp.place.coordinates.lat.toFixed(4)}, {sp.place.coordinates.lng.toFixed(4)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <a href={getGoogleMapsNavigationUrl(sp.place.coordinates)} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-primary/10 text-primary">
                    <Navigation size={14} />
                  </a>
                  <button onClick={() => removeSavedPlace(sp.id)} className="p-1.5 rounded-full bg-red-100 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== ITINERARY PAGE ====================
function ItineraryPage({ itinerary, currentDay, setCurrentDay, darkMode, showNotification }: any) {
  const [expandedDay, setExpandedDay] = useState(currentDay);

  return (
    <div className="space-y-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-1">📋 7-Day Itinerary</h2>
        <p className="text-sm text-gray-500">Indore → Gujarat → Indore Road Trip</p>
      </div>

      {itinerary.map((day: ItineraryDay, idx: number) => (
        <div key={day.day} className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden`}>
          <button
            onClick={() => { setExpandedDay(expandedDay === idx ? -1 : idx); setCurrentDay(idx); }}
            className={`w-full p-4 text-left flex items-center justify-between ${idx === currentDay ? 'border-l-4 border-primary' : ''}`}
          >
            <div>
              <h3 className="font-bold text-sm">Day {day.day}: {day.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{day.departure} • {day.totalDistance} • ETA {day.estimatedArrival}</p>
            </div>
            <div className="flex items-center gap-2">
              {idx === currentDay && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Today</span>}
              {expandedDay === idx ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>
          
          {expandedDay === idx && (
            <div className="px-4 pb-4 space-y-3">
              {/* Route summary */}
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{day.origin}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{day.destination}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>📏 {day.totalDistance}</span>
                  <span>⏱️ {day.estimatedDuration}</span>
                </div>
              </div>

              {/* Stops */}
              <div className="space-y-2">
                {day.stops.map((stop: ItineraryStop, sIdx: number) => (
                  <StopCard key={stop.id} stop={stop} index={sIdx} darkMode={darkMode} />
                ))}
              </div>

              {/* Notes */}
              {day.notes && (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} text-sm`}>
                  <p className="font-medium text-xs text-amber-700 mb-1">📝 Notes</p>
                  <p className="text-xs text-gray-600">{day.notes}</p>
                </div>
              )}

              {/* Navigate button */}
              <a
                href={generateGoogleMapsDirectionsUrl(day.destinationCoords)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-primary text-white py-2.5 rounded-lg text-center text-sm font-medium"
              >
                🧭 Navigate to {day.destination}
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== EXPENSES PAGE ====================
function ExpensesPage({ expenses, addExpense, removeExpense, totalExpenses, darkMode }: any) {
  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'food' as TripExpense['category'], amount: 0, description: '', location: '' });

  const handleAdd = () => {
    if (newExpense.amount <= 0 || !newExpense.description) return;
    addExpense({
      id: `exp-${Date.now()}`,
      ...newExpense,
      date: new Date().toISOString().split('T')[0],
    });
    setNewExpense({ category: 'food', amount: 0, description: '', location: '' });
    setShowForm(false);
  };

  const categories = [
    { id: 'fuel', label: '⛽ Fuel', color: 'bg-blue-500' },
    { id: 'food', label: '🍽️ Food', color: 'bg-green-500' },
    { id: 'accommodation', label: '🏨 Stay', color: 'bg-purple-500' },
    { id: 'parking', label: '🅿️ Parking', color: 'bg-yellow-500' },
    { id: 'toll', label: '🛣️ Toll', color: 'bg-red-500' },
    { id: 'miscellaneous', label: '📦 Other', color: 'bg-gray-500' },
  ];

  const categoryTotals = categories.map(cat => ({
    ...cat,
    total: expenses.filter((e: TripExpense) => e.category === cat.id).reduce((s: number, e: TripExpense) => s + e.amount, 0),
  }));

  return (
    <div className="space-y-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-1">💰 Trip Expenses</h2>
        <p className="text-2xl font-bold text-primary mt-2">₹{totalExpenses.toLocaleString()}</p>
      </div>

      {/* Category Breakdown */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">Breakdown</h3>
        <div className="grid grid-cols-3 gap-2">
          {categoryTotals.map(cat => (
            <div key={cat.id} className={`${darkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg p-2 text-center`}>
              <p className="text-lg">{cat.label.split(' ')[0]}</p>
              <p className="text-xs font-medium">₹{cat.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
      >
        {showForm ? <><Minus size={16} /> Cancel</> : <><Plus size={16} /> Add Expense</>}
      </button>

      {showForm && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm space-y-3`}>
          <select
            value={newExpense.category}
            onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value as any }))}
            className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          >
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
          </select>
          <input
            type="number"
            placeholder="Amount (₹)"
            value={newExpense.amount || ''}
            onChange={(e) => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
            className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          />
          <input
            type="text"
            placeholder="Description"
            value={newExpense.description}
            onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          />
          <input
            type="text"
            placeholder="Location (optional)"
            value={newExpense.location}
            onChange={(e) => setNewExpense(prev => ({ ...prev, location: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          />
          <button onClick={handleAdd} className="w-full bg-success text-white py-2.5 rounded-lg font-medium text-sm">
            Save Expense
          </button>
        </div>
      )}

      {/* Expense List */}
      {expenses.length > 0 && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold text-sm mb-3">Recent Expenses</h3>
          <div className="space-y-2">
            {expenses.slice().reverse().map((exp: TripExpense) => (
              <div key={exp.id} className={`flex items-center justify-between p-2 ${darkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg`}>
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-gray-500">{exp.category} • {exp.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">₹{exp.amount}</span>
                  <button onClick={() => removeExpense(exp.id)} className="text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CHECKLIST PAGE ====================
function ChecklistPage({ checklist, toggleChecklist, darkMode }: any) {
  const categories = ['documents', 'luggage', 'medicine', 'food', 'electronics', 'other'];
  const categoryLabels: Record<string, string> = {
    documents: '📄 Documents', luggage: '🧳 Luggage', medicine: '💊 Medicine',
    food: '🍎 Food & Water', electronics: '🔌 Electronics', other: '📦 Other'
  };

  const checkedCount = checklist.filter((i: ChecklistItem) => i.checked).length;
  const progress = (checkedCount / checklist.length) * 100;

  return (
    <div className="space-y-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-2">✅ Travel Checklist</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-sm font-medium">{checkedCount}/{checklist.length}</span>
        </div>
      </div>

      {categories.map(cat => {
        const items = checklist.filter((i: ChecklistItem) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
            <h3 className="font-bold text-sm mb-2">{categoryLabels[cat]}</h3>
            <div className="space-y-2">
              {items.map((item: ChecklistItem) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : ''}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== TRACKING PAGE ====================
function TrackingPage({ tracking, startTracking, stopTracking, todayItinerary, darkMode, preferences, setPreferences }: any) {
  return (
    <div className="space-y-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-1">📍 GPS Tracking</h2>
        <p className="text-sm text-gray-500">Live location tracking for your trip</p>
      </div>

      {/* Status */}
      <div className={`${tracking.isTracking ? 'bg-green-50 border-green-200' : darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm border`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tracking.isTracking ? 'bg-green-500' : 'bg-gray-300'}`}>
            {tracking.isTracking ? (
              <span className="w-4 h-4 bg-white rounded-full animate-pulse"></span>
            ) : (
              <Locate size={24} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-bold">{tracking.isTracking ? 'Tracking Active' : 'Not Tracking'}</p>
            <p className="text-xs text-gray-500">
              {tracking.isTracking ? 'GPS is updating your position' : 'Tap Start to begin tracking'}
            </p>
          </div>
        </div>
      </div>

      {/* Current Position */}
      {tracking.currentPosition && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold text-sm mb-2">Current Position</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Latitude</p>
              <p className="font-mono">{tracking.currentPosition.lat.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Longitude</p>
              <p className="font-mono">{tracking.currentPosition.lng.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Accuracy</p>
              <p>{tracking.accuracy ? `±${Math.round(tracking.accuracy)}m` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Speed</p>
              <p>{tracking.speed ? `${(tracking.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!tracking.isTracking ? (
          <button onClick={startTracking} className="flex-1 bg-success text-white py-3 rounded-xl font-bold shadow-lg">
            ▶️ Start Tracking
          </button>
        ) : (
          <button onClick={stopTracking} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg">
            ⏹️ Stop Tracking
          </button>
        )}
      </div>

      {/* Settings */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">Tracking Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">GPS Update Interval</label>
            <select
              value={preferences.gpsUpdateInterval}
              onChange={(e) => setPreferences({ ...preferences, gpsUpdateInterval: Number(e.target.value) })}
              className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
            >
              <option value={3000}>3 seconds (High battery)</option>
              <option value={5000}>5 seconds (Balanced)</option>
              <option value={10000}>10 seconds (Battery saver)</option>
              <option value={30000}>30 seconds (Minimal)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">GPS Accuracy</label>
            <select
              value={preferences.gpsAccuracy}
              onChange={(e) => setPreferences({ ...preferences, gpsAccuracy: e.target.value as any })}
              className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
            >
              <option value="high">High (uses more battery)</option>
              <option value="balanced">Balanced</option>
              <option value="low">Low (saves battery)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-blue-50'} rounded-xl p-4`}>
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <Info size={14} /> Privacy & Limitations
        </h3>
        <ul className="text-xs space-y-1 text-gray-600">
          <li>• Location data stays on your device only</li>
          <li>• No location history is uploaded to any server</li>
          <li>• Tracking only works when the browser tab is active</li>
          <li>• Background tracking may stop when the OS suspends the browser</li>
          <li>• GPS accuracy depends on satellite visibility and surroundings</li>
          <li>• Indoor tracking may be inaccurate or unavailable</li>
        </ul>
      </div>

      {/* Next Stop Info */}
      {todayItinerary && (
        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
          <h3 className="font-bold text-sm mb-2">Next Planned Stop</h3>
          <p className="text-sm font-medium">{todayItinerary.stops[0]?.name || todayItinerary.destination}</p>
          <p className="text-xs text-gray-500 mt-1">
            Distance will be calculated when GPS tracking is active
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== SETTINGS PAGE ====================
function SettingsPage({ preferences, setPreferences, darkMode, setDarkMode, showNotification }: any) {
  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await StorageService.clearAll();
      showNotification('All data cleared. Refresh to start fresh.');
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h2 className="font-bold text-lg mb-1">⚙️ Settings</h2>
        <p className="text-sm text-gray-500">Customize your trip experience</p>
      </div>

      {/* Theme */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm">Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-300'} relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`}></span>
          </button>
        </div>
      </div>

      {/* Budget */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">Budget Preferences</h3>
        <div>
          <label className="text-xs text-gray-500">Maximum accommodation budget per night</label>
          <input
            type="range"
            min="500"
            max="5000"
            step="500"
            value={preferences.budgetMax}
            onChange={(e) => setPreferences({ ...preferences, budgetMax: Number(e.target.value) })}
            className="w-full mt-2"
          />
          <p className="text-center text-sm font-medium mt-1">₹{preferences.budgetMax}/night</p>
        </div>
      </div>

      {/* Search Radius */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">Search Preferences</h3>
        <div>
          <label className="text-xs text-gray-500">Default search radius</label>
          <select
            value={preferences.searchRadius}
            onChange={(e) => setPreferences({ ...preferences, searchRadius: Number(e.target.value) })}
            className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
          >
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
          </select>
        </div>
      </div>

      {/* Dietary */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">Dietary Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {['vegetarian', 'jain', 'vegan', 'non-veg'].map(pref => (
            <button
              key={pref}
              onClick={() => {
                const current = preferences.dietaryPreferences;
                const updated = current.includes(pref)
                  ? current.filter((p: string) => p !== pref)
                  : [...current, pref];
                setPreferences({ ...preferences, dietaryPreferences: updated });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                preferences.dietaryPreferences.includes(pref)
                  ? 'bg-green-600 text-white'
                  : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {pref === 'vegetarian' ? '🥬 Vegetarian' : pref === 'jain' ? '🙏 Jain' : pref === 'vegan' ? '🌱 Vegan' : '🍗 Non-Veg'}
            </button>
          ))}
        </div>
      </div>

      {/* GPS Settings */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">GPS Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Update Interval</label>
            <select
              value={preferences.gpsUpdateInterval}
              onChange={(e) => setPreferences({ ...preferences, gpsUpdateInterval: Number(e.target.value) })}
              className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
            >
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Accuracy</label>
            <select
              value={preferences.gpsAccuracy}
              onChange={(e) => setPreferences({ ...preferences, gpsAccuracy: e.target.value as any })}
              className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'} border-0`}
            >
              <option value="high">High</option>
              <option value="balanced">Balanced</option>
              <option value="low">Low (saves battery)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-3">Data Management</h3>
        <button
          onClick={handleReset}
          className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg font-medium text-sm border border-red-200"
        >
          🗑️ Reset All Data
        </button>
        <p className="text-xs text-gray-400 mt-2">This will clear all saved data including itinerary changes, expenses, and saved places.</p>
      </div>

      {/* About */}
      <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
        <h3 className="font-bold text-sm mb-2">About</h3>
        <div className="text-xs space-y-1 text-gray-500">
          <p>Gujarat Yatra Companion v1.0</p>
          <p>Family road trip planner for Indore → Gujarat pilgrimage</p>
          <p className="mt-2">Data sources:</p>
          <p>• Maps: OpenStreetMap (Leaflet)</p>
          <p>• Places: Overpass API / Nominatim</p>
          <p>• Routing: OSRM</p>
          <p>• Navigation: Google Maps (external)</p>
          <p className="mt-2">Map data © OpenStreetMap contributors</p>
        </div>
      </div>
    </div>
  );
}

// ==================== PLACE CARD COMPONENT ====================
function PlaceCard({ place, darkMode, onSave, showDetour, isAccommodation, showSave }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${darkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{place.name}</p>
          <p className="text-xs text-gray-500 truncate">{place.address}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              📍 {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <a
            href={getGoogleMapsNavigationUrl(place.coordinates)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-primary/10 text-primary"
            title="Navigate"
          >
            <Navigation size={14} />
          </a>
          <a
            href={getGoogleMapsSearchUrl(place.coordinates, place.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-green-100 text-green-600"
            title="Open in Google Maps"
          >
            <ExternalLink size={14} />
          </a>
          {(onSave || showSave) && (
            <button
              onClick={() => onSave?.(place)}
              className="p-1.5 rounded-full bg-amber-100 text-amber-600"
              title="Save place"
            >
              <Heart size={14} />
            </button>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          {place.phone && (
            <a href={`tel:${place.phone}`} className="flex items-center gap-1 text-xs text-primary">
              <Phone size={12} /> {place.phone}
            </a>
          )}
          {place.openingHours && <p className="text-xs text-gray-500">🕐 {place.openingHours}</p>}
          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
              <ExternalLink size={12} /> Website
            </a>
          )}
          <p className="text-xs text-gray-400">
            Source: {place.dataSource || 'Unknown'} {place.verified ? '✓ Verified' : '• Unverified'}
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(`${place.coordinates.lat}, ${place.coordinates.lng}`)}
            className="text-xs text-gray-500 underline"
          >
            Copy coordinates
          </button>
        </div>
      )}
      
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-1">
        {expanded ? 'Show less' : 'More details'}
      </button>
    </div>
  );
}
