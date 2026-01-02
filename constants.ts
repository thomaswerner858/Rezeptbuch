
import { Dish, User } from './types';

// Die Liste wurde geleert, damit du direkt mit deinen eigenen Test-Gerichten starten kannst.
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

// Die bereitgestellte Google Apps Script URL für den Drive-Upload
export const DRIVE_PROXY_URL = "https://script.google.com/macros/s/AKfycbxwDaozIoUyJAn8HgJWoeC8jtVippvj4KDt9sLj6bYuAEYYLXifXqn2XT6YMR9Ank3i/exec";
export const DRIVE_FOLDER_ID = "1RXJOS_hSk-HBcrJEOSEV7qKWv_mVIdMH";
