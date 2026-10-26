import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ItineraryDay, TripExpense, SavedPlace, ChecklistItem, UserPreferences } from '../types';

interface YatraDB extends DBSchema {
  itinerary: { key: number; value: ItineraryDay };
  expenses: { key: string; value: TripExpense };
  savedPlaces: { key: string; value: SavedPlace };
  checklist: { key: string; value: ChecklistItem };
  preferences: { key: string; value: UserPreferences };
  tripNotes: { key: number; value: { day: number; notes: string } };
}

let dbInstance: IDBPDatabase<YatraDB> | null = null;

async function getDB(): Promise<IDBPDatabase<YatraDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<YatraDB>('yatra-companion', 1, {
    upgrade(db) {
      db.createObjectStore('itinerary', { keyPath: 'day' });
      db.createObjectStore('expenses', { keyPath: 'id' });
      db.createObjectStore('savedPlaces', { keyPath: 'id' });
      db.createObjectStore('checklist', { keyPath: 'id' });
      db.createObjectStore('preferences', { keyPath: 'language' });
      db.createObjectStore('tripNotes', { keyPath: 'day' });
    },
  });
  return dbInstance;
}

export const StorageService = {
  async saveItinerary(days: ItineraryDay[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('itinerary', 'readwrite');
    for (const day of days) {
      await tx.store.put(day);
    }
    await tx.done;
  },

  async getItinerary(): Promise<ItineraryDay[]> {
    const db = await getDB();
    return db.getAll('itinerary');
  },

  async saveExpense(expense: TripExpense): Promise<void> {
    const db = await getDB();
    await db.put('expenses', expense);
  },

  async getExpenses(): Promise<TripExpense[]> {
    const db = await getDB();
    return db.getAll('expenses');
  },

  async deleteExpense(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('expenses', id);
  },

  async savePlace(place: SavedPlace): Promise<void> {
    const db = await getDB();
    await db.put('savedPlaces', place);
  },

  async getSavedPlaces(): Promise<SavedPlace[]> {
    const db = await getDB();
    return db.getAll('savedPlaces');
  },

  async deleteSavedPlace(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('savedPlaces', id);
  },

  async saveChecklist(items: ChecklistItem[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('checklist', 'readwrite');
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
  },

  async getChecklist(): Promise<ChecklistItem[]> {
    const db = await getDB();
    return db.getAll('checklist');
  },

  async savePreferences(prefs: UserPreferences): Promise<void> {
    const db = await getDB();
    await db.put('preferences', prefs);
  },

  async getPreferences(): Promise<UserPreferences | null> {
    const db = await getDB();
    const all = await db.getAll('preferences');
    return all.length > 0 ? all[0] : null;
  },

  async saveTripNote(day: number, notes: string): Promise<void> {
    const db = await getDB();
    await db.put('tripNotes', { day, notes });
  },

  async getTripNote(day: number): Promise<string> {
    const db = await getDB();
    const note = await db.get('tripNotes', day);
    return note?.notes || '';
  },

  async clearAll(): Promise<void> {
    const db = await getDB();
    const stores = ['itinerary', 'expenses', 'savedPlaces', 'checklist', 'preferences', 'tripNotes'] as const;
    const tx = db.transaction(stores, 'readwrite');
    for (const store of stores) {
      await tx.objectStore(store).clear();
    }
    await tx.done;
  }
};

export const defaultChecklist: ChecklistItem[] = [
  { id: 'cl-1', text: 'Aadhar cards / ID proofs', category: 'documents', checked: false },
  { id: 'cl-2', text: 'Hotel booking confirmations', category: 'documents', checked: false },
  { id: 'cl-3', text: 'Driving license', category: 'documents', checked: false },
  { id: 'cl-4', text: 'Vehicle RC & insurance', category: 'documents', checked: false },
  { id: 'cl-5', text: 'Clothes for 7 days', category: 'luggage', checked: false },
  { id: 'cl-6', text: 'Temple visit attire (modest)', category: 'luggage', checked: false },
  { id: 'cl-7', text: 'Comfortable walking shoes', category: 'luggage', checked: false },
  { id: 'cl-8', text: 'Umbrella / rain gear', category: 'luggage', checked: false },
  { id: 'cl-9', text: 'First aid kit', category: 'medicine', checked: false },
  { id: 'cl-10', text: 'Personal medicines', category: 'medicine', checked: false },
  { id: 'cl-11', text: 'Motion sickness tablets', category: 'medicine', checked: false },
  { id: 'cl-12', text: 'Water bottles', category: 'food', checked: false },
  { id: 'cl-13', text: 'Dry snacks & namkeen', category: 'food', checked: false },
  { id: 'cl-14', text: 'Fruits', category: 'food', checked: false },
  { id: 'cl-15', text: 'Phone chargers & power bank', category: 'electronics', checked: false },
  { id: 'cl-16', text: 'Car charger', category: 'electronics', checked: false },
  { id: 'cl-17', text: 'Camera / selfie stick', category: 'electronics', checked: false },
  { id: 'cl-18', text: 'Cash (small denominations)', category: 'documents', checked: false },
  { id: 'cl-19', text: 'Torches', category: 'electronics', checked: false },
  { id: 'cl-20', text: 'Sanitizer & masks', category: 'medicine', checked: false },
];

export const defaultPreferences: UserPreferences = {
  theme: 'light',
  budgetMax: 2000,
  dietaryPreferences: ['vegetarian'],
  gpsUpdateInterval: 5000,
  gpsAccuracy: 'balanced',
  searchRadius: 5,
  language: 'en',
};
