import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  push,
  remove,
  onDisconnect,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBi8gwBb0SAcS9QT4HOkPKniMGUcmJOxoI",
  authDomain: "cinemachill-75a5b.firebaseapp.com",
  projectId: "cinemachill-75a5b",
  databaseURL: "https://cinemachill-75a5b-default-rtdb.europe-west1.firebasedatabase.app",
  storageBucket: "cinemachill-75a5b.firebasestorage.app",
  messagingSenderId: "3543587617",
  appId: "1:3543587617:web:47b914a0fe2910d83afc60",
};

export function initFirebase() {
  if (!firebaseConfig.databaseURL) {
    throw new Error("Firebase não configurado");
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return { app, db: getDatabase(app) };
}

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function sanitizeRoomCode(value) {
  const clean = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return clean || generateRoomCode();
}

export function sanitizeUsername(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 20);
}

export function getSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const username = sanitizeUsername(
    params.get("nome") || localStorage.getItem("cinema_username") || "",
  );
  const salaId = sanitizeRoomCode(
    params.get("sala") || localStorage.getItem("cinema_sala") || "",
  );

  if (username) {
    localStorage.setItem("cinema_username", username);
  }
  localStorage.setItem("cinema_sala", salaId);

  return { username, salaId, params };
}

export function buildRoomUrl(page, username, salaId) {
  return `${page}?nome=${encodeURIComponent(username)}&sala=${encodeURIComponent(salaId)}`;
}

export function replaceRoomUrl(username, salaId) {
  const newUrl = buildRoomUrl(window.location.pathname, username, salaId);
  window.history.replaceState({}, "", newUrl);
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "?").toUpperCase();
}

export async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "true");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(input);
  return copied;
}

export async function registerPresence(db, salaId, username, extra = {}) {
  const userRef = ref(db, `salas/${salaId}/users/${username}`);
  const payload = { nome: username, online: true, entrou: Date.now(), ...extra };

  await set(userRef, payload);
  try {
    await onDisconnect(userRef).set({ nome: username, online: false, saiu: Date.now() });
  } catch (error) {
    console.warn("onDisconnect indisponível", error);
  }

  return userRef;
}

export { getDatabase, ref, set, get, onValue, push, remove, onDisconnect };
