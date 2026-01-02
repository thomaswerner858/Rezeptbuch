
import { Dish, Vote } from '../types';
import { INITIAL_DISHES, STORAGE_KEYS, AIRTABLE_CONFIG, GOOGLE_CONFIG } from '../constants';

const isToday = (timestamp: number) => {
  if (!timestamp || isNaN(timestamp)) return false;
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const safeString = (val: any, fallback: string = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val)) return safeString(val[0], fallback);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

/**
 * Upload via Google Apps Script (Zentraler Speicher)
 */
const uploadToGoogleDrive = async (name: string, base64Image: string): Promise<string> => {
  try {
    const response = await fetch(GOOGLE_CONFIG.GAS_URL, {
      method: 'POST',
      // Wir senden das Bild an das Skript. 
      // Damit beide die URL erhalten, sollte das Skript die Web-URL des Bildes zurückgeben.
      body: JSON.stringify({
        filename: `${name}_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        data: base64Image.split(',')[1]
      }),
    });
    
    // Falls das Skript CORS unterstützt, versuchen wir die URL zu lesen
    const result = await response.json();
    return result.url || result.link || base64Image;
  } catch (e) {
    // Falls das Skript im 'no-cors' Modus läuft oder kein JSON liefert:
    // Wir nutzen das Base64 als Fallback für die lokale Session.
    return base64Image; 
  }
};

const airtableFetch = async (tableName: string, options: RequestInit = {}) => {
  if (!AIRTABLE_CONFIG.TOKEN || AIRTABLE_CONFIG.TOKEN.includes('HIER_EINTRAGEN')) {
    throw new Error("Bitte Airtable Token eintragen");
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json();
};

export const storageService = {
  _saveToLocal: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  _readFromLocal: (key: string, fallback: any) => {
    const s = localStorage.getItem(key);
    try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
  },

  sync: async (): Promise<{ dishes: Dish[], votes: Vote[] }> => {
    try {
      // 1. Hole alle Gerichte von Airtable
      const dishesData = await airtableFetch(AIRTABLE_CONFIG.TABLES.DISHES);
      const remoteDishes: Dish[] = (dishesData.records || []).map((r: any) => ({
        id: safeString(r.fields.id || r.id),
        name: safeString(r.fields.name, "Unbekanntes Gericht"),
        recipe: safeString(r.fields.recipe),
        imageUrl: safeString(r.fields.imageUrl, `https://picsum.photos/seed/${r.id}/600/800`),
        isCustom: !!r.fields.isCustom
      })).reverse(); // Neueste oben

      // 2. Hole alle Stimmen von Airtable
      const votesData = await airtableFetch(AIRTABLE_CONFIG.TABLES.VOTES);
      const remoteVotes: Vote[] = (votesData.records || []).map((r: any) => ({
        userId: safeString(r.fields.userId),
        dishId: safeString(r.fields.dishId),
        liked: !!r.fields.liked,
        timestamp: Number(r.fields.timestamp) || Date.now()
      })).filter((v: any) => v.userId && v.dishId);

      storageService._saveToLocal(STORAGE_KEYS.DISHES, remoteDishes);
      storageService._saveToLocal(STORAGE_KEYS.VOTES, remoteVotes);

      return { dishes: remoteDishes, votes: remoteVotes };
    } catch (err) {
      console.error("Sync failed, using cache", err);
      return { dishes: storageService.getDishes(), votes: storageService.getVotes() };
    }
  },

  getDishes: (): Dish[] => storageService._readFromLocal(STORAGE_KEYS.DISHES, INITIAL_DISHES),

  addDish: async (name: string, recipe?: string, imageBase64?: string): Promise<Dish> => {
    let finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(name + Date.now())}/600/800`;
    
    if (imageBase64) {
      finalImageUrl = await uploadToGoogleDrive(name, imageBase64);
    }

    const newDish: Dish = {
      id: Date.now().toString(),
      name: safeString(name),
      recipe: safeString(recipe),
      imageUrl: finalImageUrl,
      isCustom: true,
    };

    // Sofort lokal speichern für schnelles UI-Feedback
    const dishes = storageService.getDishes();
    storageService._saveToLocal(STORAGE_KEYS.DISHES, [newDish, ...dishes]);

    // An Airtable senden, damit es der andere User beim nächsten Sync sieht
    try {
      await airtableFetch(AIRTABLE_CONFIG.TABLES.DISHES, {
        method: 'POST',
        body: JSON.stringify({
          records: [{
            fields: {
              id: newDish.id,
              name: newDish.name,
              recipe: newDish.recipe || "",
              imageUrl: newDish.imageUrl,
              isCustom: true
            }
          }]
        })
      });
    } catch (e) {
      console.error("Airtable push failed", e);
    }

    return newDish;
  },

  getVotes: (): Vote[] => {
    const votes = storageService._readFromLocal(STORAGE_KEYS.VOTES, []);
    const lastActiveStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
    const now = Date.now();
    
    // Reset der Stimmen, wenn der letzte Zugriff nicht heute war
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr);
      if (!isNaN(lastActive) && !isToday(lastActive)) {
        storageService._saveToLocal(STORAGE_KEYS.VOTES, []);
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
        return [];
      }
    }
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
    return votes;
  },

  castVote: async (userId: string, dishId: string, liked: boolean) => {
    const votes = storageService.getVotes();
    const newVote: Vote = { userId, dishId, liked, timestamp: Date.now() };
    
    const updatedVotes = [...votes.filter(v => !(v.userId === userId && v.dishId === dishId)), newVote];
    storageService._saveToLocal(STORAGE_KEYS.VOTES, updatedVotes);

    try {
      await airtableFetch(AIRTABLE_CONFIG.TABLES.VOTES, {
        method: 'POST',
        body: JSON.stringify({
          records: [{
            fields: {
              userId: newVote.userId,
              dishId: newVote.dishId,
              liked: newVote.liked,
              timestamp: newVote.timestamp
            }
          }]
        })
      });
    } catch (e) {
      console.error("Vote sync failed", e);
    }
  },

  checkForMatch: (dishId: string): boolean => {
    const votes = storageService.getVotes();
    const dishVotes = votes.filter(v => v.dishId === dishId && v.liked);
    // Ein Match liegt vor, wenn mindestens 2 verschiedene User 'liked' haben
    const uniqueUsers = new Set(dishVotes.map(v => v.userId));
    return uniqueUsers.size >= 2;
  },

  getQueueForUser: (userId: string): Dish[] => {
    const allDishes = storageService.getDishes();
    const votes = storageService.getVotes();
    const userVotedDishIds = new Set(votes.filter(v => v.userId === userId).map(v => v.dishId));
    // Zeige nur Gerichte, die der User noch nicht bewertet hat
    return allDishes.filter(d => !userVotedDishIds.has(d.id));
  }
};
