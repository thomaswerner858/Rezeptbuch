
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

// Hilfsfunktion: Wandelt Base64 in ein Blob um (für Drive Upload)
const base64ToBlob = (base64: string): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

/**
 * Google Drive Upload Logik
 */
const uploadToGoogleDrive = async (name: string, base64Image: string): Promise<string> => {
  const token = localStorage.getItem(STORAGE_KEYS.GOOGLE_TOKEN);
  if (!token) throw new Error("Nicht mit Google Drive verbunden. Bitte erst einloggen.");

  const blob = base64ToBlob(base64Image);
  const metadata = {
    name: `${name}_${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    parents: [GOOGLE_CONFIG.FOLDER_ID] // Hier wird die Ordner-ID gesetzt
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKEN);
      throw new Error("Google Sitzung abgelaufen. Bitte erneut verbinden.");
    }
    const errorData = await response.json();
    console.error("Drive API Error:", errorData);
    throw new Error("Fehler beim Upload zu Google Drive");
  }

  const result = await response.json();
  // Wir nutzen das Format für Drive-Bilder, das meistens direkt funktioniert
  return `https://lh3.googleusercontent.com/u/0/d/${result.id}`;
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
      const dishesData = await airtableFetch(AIRTABLE_CONFIG.TABLES.DISHES);
      const remoteDishes: Dish[] = (dishesData.records || []).map((r: any) => ({
        id: safeString(r.fields.id || r.id),
        name: safeString(r.fields.name, "Unbekanntes Gericht"),
        recipe: safeString(r.fields.recipe),
        imageUrl: safeString(r.fields.imageUrl, `https://picsum.photos/seed/${r.id}/600/800`),
        isCustom: !!r.fields.isCustom
      }));

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
      return { dishes: storageService.getDishes(), votes: storageService.getVotes() };
    }
  },

  getDishes: (): Dish[] => storageService._readFromLocal(STORAGE_KEYS.DISHES, INITIAL_DISHES),

  addDish: async (name: string, recipe?: string, imageBase64?: string): Promise<Dish> => {
    let finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(name + Date.now())}/600/800`;
    
    if (imageBase64) {
      try {
        finalImageUrl = await uploadToGoogleDrive(name, imageBase64);
      } catch (e) {
        console.error("Drive Upload failed", e);
        throw e;
      }
    }

    const newDish: Dish = {
      id: Date.now().toString(),
      name: safeString(name),
      recipe: safeString(recipe),
      imageUrl: finalImageUrl,
      isCustom: true,
    };

    const dishes = storageService.getDishes();
    storageService._saveToLocal(STORAGE_KEYS.DISHES, [newDish, ...dishes]);

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
    } catch (e) {}
  },

  checkForMatch: (dishId: string): boolean => {
    const votes = storageService.getVotes();
    const dishVotes = votes.filter(v => v.dishId === dishId && v.liked);
    return new Set(dishVotes.map(v => v.userId)).size >= 2;
  },

  getQueueForUser: (userId: string): Dish[] => {
    const allDishes = storageService.getDishes();
    const votes = storageService.getVotes();
    const userVotedDishIds = new Set(votes.filter(v => v.userId === userId).map(v => v.dishId));
    return allDishes.filter(d => !userVotedDishIds.has(d.id));
  }
};
