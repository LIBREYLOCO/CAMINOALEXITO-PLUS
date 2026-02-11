import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, push, get } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";
import { GameState } from "../types";

// TODO: El usuario debe reemplazar esto con su propia configuración de Firebase Console
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: "G-E63LCL3VSF"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Analytics optional for now
const db = getDatabase(app);
const auth = getAuth(app);

// Helper to ensure auth
const ensureAuth = async () => {
    if (!auth.currentUser) {
        await signInAnonymously(auth);
    }
    return auth.currentUser;
};

export const createRoom = async (initialState: GameState) => {
    await ensureAuth();
    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key?.substring(1, 7).toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();

    // Usamos el ID corto como llave para facilitar la entrada de los jugadores
    const specificRoomRef = ref(db, `rooms/${roomId}`);
    await set(specificRoomRef, {
        state: initialState,
        createdAt: Date.now(),
        lastUpdate: Date.now()
    });

    return roomId;
};

export const joinRoom = async (roomId: string, playerName: string, avatar: string) => {
    await ensureAuth();
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("La sala no existe.");
    }

    const data = snapshot.val();
    const state = data.state as GameState;
    // Firebase doesn't store empty arrays, so we must default to []
    const players = state.players || [];

    if (players.length >= 4) {
        throw new Error("La sala está llena.");
    }

    // Return state with ensured players array
    return { ...state, players };
};

export const syncGameState = (roomId: string, newState: GameState) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    // Sanitize state to remove any 'undefined' values which Firebase rejects
    const sanitizedState = JSON.parse(JSON.stringify(newState));
    update(roomRef, {
        state: sanitizedState,
        lastUpdate: Date.now()
    });
};

export const subscribeToRoom = (roomId: string, callback: (state: GameState) => void) => {
    const roomRef = ref(db, `rooms/${roomId}/state`);
    return onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        }
    });
};

export default db;
