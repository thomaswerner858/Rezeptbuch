
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
 * Upload via Google Apps Script
 */
const uploadToGoogleDrive = async (name: string, base64Image: string): Promise<string> => {
  console.log("Starte Upload zu Google Drive für:", name);
  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    const payload = {
      filename: `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      data: base64Data
    };

    // Wir nutzen 'text/plain' um den CORS Preflight zu umgehen, 
    // da Google Apps Script keine OPTIONS-Requests für 'application/json' mag.
    const response = await fetch(GOOGLE_CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'cors', 
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Fehler! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Google Apps Script Antwort:", result);
    
    if (result.url) {
      return result.url;
    } else if (result.error) {
      throw new Error(`Script Fehler: ${result.error}`);
    }
    
    throw new Error("Keine URL in der Antwort gefunden");
  } catch (e) {
    console.error("Detaillierter Upload-Fehler:", e);
    // Wenn der Upload fehlschlägt, nutzen wir ein Platzhalterbild
    // WICHTIG: Kein Base64 in Airtable speichern (zu groß!)
    return `https://picsum.photos/seed/${encodeURIComponent(name)}/600/800`;
  }
};

const airtableFetch = async (tableName: string, options: RequestInit = {}) => {
  if (!AIRTABLE_CONFIG.TOKEN || AIRTABLE_CONFIG.TOKEN.includes('HIER_EINTRAGEN')) {
    console.warn("Airtable Sync deaktiviert: Kein Token gefunden.");
    return { records: [] };
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
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Airtable API Error: ${JSON.stringify(error)}`);
  }
  
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
      const dishesData = await airtableFetch(AIRTABLE_CONFIG.TABLES.DISHES);
      const remoteDishes: Dish[] = (dishesData.records || []).map((r: any) => ({
        id: safeString(r.fields.id || r.id),
        name: safeString(r.fields.name, "Unbekanntes Gericht"),
        recipe: safeString(r.fields.recipe),
        imageUrl: safeString(r.fields.imageUrl, `https://picsum.photos/seed/${r.id}/600/800`),
        isCustom: r.fields.isCustom === true || r.fields.isCustom === "true"
      })).reverse();

      const votesData = await airtableFetch(AIRTABLE_CONFIG.TABLES.VOTES);
      const remoteVotes: Vote[] = (votesData.records || []).map((r: any) => ({
        userId: safeString(r.fields.userId),
        dishId: safeString(r.fields.dishId),
        liked: r.fields.liked === true || r.fields.liked === "true",
        timestamp: Number(r.fields.timestamp) || Date.now()
      })).filter((v: any) => v.userId && v.dishId);

      storageService._saveToLocal(STORAGE_KEYS.DISHES, remoteDishes);
      storageService._saveToLocal(STORAGE_KEYS.VOTES, remoteVotes);

      return { dishes: remoteDishes, votes: remoteVotes };
    } catch (err) {
      console.error("Sync fehlgeschlagen:", err);
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
      id: "dish_" + Date.now().toString(),
      name: safeString(name),
      recipe: safeString(recipe),
      imageUrl: finalImageUrl,
      isCustom: true,
    };

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
      console.log("Airtable Update erfolgreich.");
    } catch (e) {
      console.error("Airtable Fehler beim Hinzufügen:", e);
    }

    const dishes = storageService.getDishes();
    storageService._saveToLocal(STORAGE_KEYS.DISHES, [newDish, ...dishes]);

    return newDish;
  },

  getVotes: (): Vote[] => {
    const votes = storageService._readFromLocal(STORAGE_KEYS.VOTES, []);
    const lastActiveStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
    const now = Date.now();
    
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
    const uniqueUsers = new Set(dishVotes.map(v => v.userId));
    return uniqueUsers.size >= 2;
  },

  getQueueForUser: (userId: string): Dish[] => {
    const allDishes = storageService.getDishes();
    const votes = storageService.getVotes();
    const userVotedDishIds = new Set(votes.filter(v => v.userId === userId).map(v => v.dishId));
    return allDishes.filter(d => !userVotedDishIds.has(d.id));
  }
};
