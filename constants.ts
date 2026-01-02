
import { Dish, User } from './types';

export const INITIAL_DISHES: Dish[] = [];

export const USERS: User[] = [
  { id: 'user_a', name: 'Partner A', avatar: '🦖' },
  { id: 'user_b', name: 'Partner B', avatar: '🦄' },
];

export const STORAGE_KEYS = {
  DISHES: 'dsm_dishes',
  VOTES: 'dsm_votes',
  LAST_ACTIVE: 'dsm_last_active',
};

/**
 * Airtable Konfiguration
 * Trage hier deinen Token direkt ein. 
 * Um den GitHub-Upload zu ermöglichen, musst du in den GitHub-Repository-Einstellungen 
 * unter "Code security and analysis" die "Push Protection" für diesen Key deaktivieren 
 * oder das Repository auf "Privat" stellen.
 */
export const AIRTABLE_CONFIG = {
  BASE_ID: 'apprpI3Y3hphyJ0t4', 
  TOKEN: 'DEIN_AIRTABLE_TOKEN_HIER_EINTRAGEN',
  TABLES: {
    DISHES: 'Dishes',
    VOTES: 'Votes'
  }
};
