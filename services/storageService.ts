
import { Dish, Vote, User } from '../types';
import { INITIAL_DISHES, STORAGE_KEYS, DRIVE_PROXY_URL } from '../constants';

const isToday = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // Etwas größer für Drive
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

export const storageService = {
  getDishes: (): Dish[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.DISHES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(INITIAL_DISHES));
      return INITIAL_DISHES;
    }
    return JSON.parse(stored);
  },

  uploadToDrive: async (imageBase64: string, filename: string): Promise<string> => {
    if (!DRIVE_PROXY_URL || DRIVE_PROXY_URL.includes("YOUR_APPS_SCRIPT_URL")) {
      console.warn("Google Drive Proxy URL nicht gesetzt. Speichere nur lokal.");
      return imageBase64;
    }

    try {
      // Wir nutzen text/plain, um CORS-Preflight-Probleme mit Apps Script zu vermeiden
      await fetch(DRIVE_PROXY_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          filename,
          mimeType: 'image/jpeg',
          imageBase64
        })
      });
      
      console.log('Upload-Anfrage an Google Drive gesendet.');
      return imageBase64; 
    } catch (error) {
      console.error('Drive Upload Fehler:', error);
      return imageBase64;
    }
  },

  addDish: async (name: string, recipe?: string, imageBase64?: string): Promise<Dish> => {
    const dishes = storageService.getDishes();
    let finalImageUrl = `https://picsum.photos/seed/${name.replace(/\s/g, '')}/600/800`;
    
    if (imageBase64) {
      const compressed = await compressImage(imageBase64);
      // Hintergrund-Upload zu Drive
      storageService.uploadToDrive(compressed, `${Date.now()}_${name.replace(/\s/g, '_')}.jpg`);
      finalImageUrl = compressed;
    }

    const newDish: Dish = {
      id: Date.now().toString(),
      name,
      recipe,
      imageUrl: finalImageUrl,
      isCustom: true,
    };
    
    const updatedDishes = [newDish, ...dishes];
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(updatedDishes));
    return newDish;
  },

  getVotes: (): Vote[] => {
    const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
    const now = Date.now();
    if (lastActive && !isToday(parseInt(lastActive))) {
      localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
      return [];
    }
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, now.toString());
    const stored = localStorage.getItem(STORAGE_KEYS.VOTES);
    return stored ? JSON.parse(stored) : [];
  },

  castVote: (userId: string, dishId: string, liked: boolean) => {
    const votes = storageService.getVotes();
    const filtered = votes.filter(v => !(v.userId === userId && v.dishId === dishId));
    const newVote: Vote = { userId, dishId, liked, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify([...filtered, newVote]));
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
  },

  resetUserVotes: (userId: string) => {
    const votes = storageService.getVotes();
    const updatedVotes = votes.filter(v => v.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(updatedVotes));
  }
};
