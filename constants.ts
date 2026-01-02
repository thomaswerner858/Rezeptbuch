
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
 * Google Apps Script Konfiguration
 * Ermöglicht den Upload ohne individuellen Nutzer-Login.
 */
export const GOOGLE_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxwDaozIoUyJAn8HgJWoeC8jtVippvj4KDt9sLj6bYuAEYYLXifXqn2XT6YMR9Ank3i/exec',
};
