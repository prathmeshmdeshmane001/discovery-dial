import { TRACKS } from "./tracks.js";

// Relevance tier order for sorting: high first, medium second, low last
export const REL_ORDER = { high: 0, medium: 1, low: 2 };

export const RELEVANCE_STYLE = {
  high:   { label: "Strong match", color: "#1DB954", star: "★" },
  medium: { label: "Good match",   color: "#d9c75a", star: "★" },
  low:    { label: "Wider stretch",color: "#e08a4f", star: "★" },
};

/**
 * Builds a discovery mix given active vibes and a dial percentage (0 - 100%).
 * Guarantees a full mix (8 or 10 tracks) regardless of individual pool sizes.
 */
export function buildMix(activeVibes, dialPct) {
  const vibeSet = activeVibes?.length ? activeVibes : ["indie"];
  const pool = TRACKS.filter((t) => vibeSet.includes(t.vibe));
  const familiar = pool.filter((t) => t.familiarity === "familiar");
  const newTracks = pool.filter((t) => t.familiarity === "new");
  const total = dialPct >= 40 ? 10 : 8;
  const newCount = Math.round(total * (dialPct / 100));
  const famCount = total - newCount;
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const shuffledFam = shuffle(familiar);
  const pickedFam = [];
  while (pickedFam.length < famCount && shuffledFam.length > 0) {
    const needed = famCount - pickedFam.length;
    pickedFam.push(...shuffledFam.slice(0, needed));
  }

  const shuffledNew = shuffle(newTracks);
  const pickedNew = [];
  while (pickedNew.length < newCount && shuffledNew.length > 0) {
    const needed = newCount - pickedNew.length;
    pickedNew.push(...shuffledNew.slice(0, needed));
  }

  return shuffle([...pickedFam, ...pickedNew]);
}

/**
 * Computes relevance tier (high, medium, low) for a track based on its energy proximity
 * to the average energy of familiar tracks within active vibes.
 */
export function relevanceScore(track, activeVibes) {
  if (!activeVibes?.includes(track.vibe)) return "low";
  const pool = TRACKS.filter((t) => activeVibes.includes(t.vibe) && t.familiarity === "familiar");
  if (!pool.length) return "medium";
  const avgEnergy = pool.reduce((sum, t) => sum + t.energy, 0) / pool.length;
  const diff = Math.abs(track.energy - avgEnergy);
  if (diff <= 0.75) return "high";
  if (diff <= 1.75) return "medium";
  return "low";
}

/**
 * Formats a time in seconds to mm:ss
 */
export function formatTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
