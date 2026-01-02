
import { Dish, Vote } from '../types';
import { INITIAL_DISHES, STORAGE_KEYS, AIRTABLE_CONFIG } from '../constants';

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

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const airtableFetch = async (tableName: string, options: RequestInit = {}) => {
  if (!AIRTABLE_CONFIG.TOKEN || AIRTABLE_CONFIG.TOKEN.includes('HIER_EINTRAGEN')) {
    console.warn("Airtable Token fehlt in constants.ts");
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
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Airtable Error: ${JSON.stringify(error)}`);
  }
  return response.json();
};

export const storageService = {
  _saveToLocal: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  _readFromLocal: (key: string, fallback: any) => {
    const s = localStorage.getItem(key);
    try {
      return s ? JSON.parse(s) : fallback;
    } catch {
      return fallback;
    }
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
      console.warn("Airtable Sync failed:", err);
      return { 
        dishes: storageService.getDishes(), 
        votes: storageService.getVotes() 
      };
    }
  },

  getDishes: (): Dish[] => storageService._readFromLocal(STORAGE_KEYS.DISHES, INITIAL_DISHES),

  addDish: async (name: string, recipe?: string, imageBase64?: string): Promise<Dish> => {
    let finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(name + Date.now())}/600/800`;
    if (imageBase64) {
      finalImageUrl = await compressImage(imageBase64);
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
      console.error("Airtable Add Dish failed:", e);
    }

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
    const newVote: Vote = { 
      userId: safeString(userId), 
      dishId: safeString(dishId), 
      liked, 
      timestamp: Date.now() 
    };
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
      console.error("Airtable Vote failed:", e);
    }
  },

  checkForMatch: (dishId: string): boolean => {
    const votes = storageService.getVotes();
    const dishVotes = votes.filter(v => v.dishId === dishId && v.liked);
    const usersWhoLiked = new Set(dishVotes.map(v => v.userId));
    return usersWhoLiked.size >= 2;
  },

  getQueueForUser: (userId: string): Dish[] => {
    const allDishes = storageService.getDishes();
    const votes = storageService.getVotes();
    const userVotedDishIds = new Set(votes.filter(v => v.userId === userId).map(v => v.dishId));
    return allDishes.filter(d => !userVotedDishIds.has(d.id));
  }
};
