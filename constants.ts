
import { Dish, User } from './types';

export const INITIAL_DISHES: Dish[] = [];

export const USERS: User[] = [
  { id: 'user_a', name: 'Marie', avatar: '👩‍🍳' },
  { id: 'user_b', name: 'Thomas', avatar: '👨‍🍳' },
];

export const STORAGE_KEYS = {
  DISHES: 'dsm_dishes',
  VOTES: 'dsm_votes',
  LAST_ACTIVE: 'dsm_last_active',
  GOOGLE_TOKEN: 'dsm_g_token',
};

export const AIRTABLE_CONFIG = {
  BASE_ID: 'apprpI3Y3hphyJ0t4', 
  TOKEN: 'DEIN_AIRTABLE_TOKEN_HIER_EINTRAGEN',
  TABLES: {
    DISHES: 'Dishes',
    VOTES: 'Votes'
  }
};

/**
 * Google Drive Konfiguration
 * Um Bilder hochzuladen, benötigst du eine Client ID von der Google Cloud Console.
 */
export const GOOGLE_CONFIG = {
  CLIENT_ID: 'DEINE_GOOGLE_CLIENT_ID_HIER_EINTRAGEN',
  SCOPES: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.install',
  // Die spezifische Ordner-ID aus deinem Link
  FOLDER_ID: '1RXJOS_hSk-HBcrJEOSEV7qKWv_mVIdMH',
};
