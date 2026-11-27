// Récupère l'horaire de la fiche Google (Places API New) et l'écrit dans hours.json.
// Lancé chaque jour à midi par .github/workflows/hours.yml.
// Usage local : GOOGLE_API_KEY=xxx node scripts/update-hours.mjs
import { writeFileSync } from "node:fs";

const PLACE_ID = "ChIJ33J9HarpvkwRt7bYTrXwYZE";
const KEY = process.env.GOOGLE_API_KEY;
if (!KEY) { console.error("GOOGLE_API_KEY manquante"); process.exit(1); }

const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=regularOpeningHours`;
const res = await fetch(url, { headers: { "X-Goog-Api-Key": KEY } });
if (!res.ok) { console.error("Erreur Google", res.status, await res.text()); process.exit(1); }

const periods = (await res.json()).regularOpeningHours?.periods;
if (!periods) { console.error("Aucun horaire dans la réponse — hours.json inchangé."); process.exit(0); }

const p2 = n => String(n ?? 0).padStart(2, "0");
const days = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
for (const p of periods) {
  if (!p.close) { days[p.open.day].push(["00:00", "23:59"]); continue; } // ouvert 24 h
  days[p.open.day].push([`${p2(p.open.hour)}:${p2(p.open.minute)}`, `${p2(p.close.hour)}:${p2(p.close.minute)}`]);
}
for (const d in days) if (!days[d].length) days[d] = null;

// Réécrit le fichier chaque jour (date de mise à jour) : ce commit quotidien empêche
// GitHub de désactiver la tâche planifiée après 60 jours sans activité.
const out = { days };
writeFileSync("hours.json", JSON.stringify({ ...out, updated: new Date().toISOString() }, null, 2) + "\n");
console.log("hours.json mis à jour :", JSON.stringify(days));
