
/**
 * ⛔ FIREBASE CONFIGURATION - DEPRECATED & DISABLED
 * 
 * MIGRATION STATUS: COMPLETED -> SUPABASE
 * This file is kept as a placeholder to prevent build errors in legacy imports.
 * All database and auth logic now resides in `supabaseClient.ts`.
 */

const app = null;
const db = null;
const auth = null;
const analytics = null;
const messaging = null;
const googleProvider = null;
const githubProvider = null;

const requestNotificationPermission = async () => {
    console.warn("Firebase Messaging is disabled. Use Supabase Realtime channels.");
    return null;
};

export { app, db, auth, analytics, messaging, googleProvider, githubProvider, requestNotificationPermission };
