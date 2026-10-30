import { useState, useEffect, useRef, useMemo } from "react";
import { TRACKS, VIBES } from "./tracks.js";
import { buildMix, relevanceScore, formatTime, REL_ORDER, RELEVANCE_STYLE } from "./engine.js";

const PLAYLISTS = [
  { id: "p1", name: "GYM SONGS 💪 (for girlies) 2026", sub: "Playlist · The music enthusiast", color: "#c8102e", emoji: "💪" },
  { id: "p2", name: "Liked Songs", sub: "Playlist · 122 songs", color: "#4B0082", emoji: "♥" },
  { id: "p3", name: "Haunted — Beyoncé", sub: "Playlist · Oona Katariina Kastari", color: "#8B0000", emoji: "👻" },
  { id: "p4", name: "Flirting songs", sub: "Playlist · Bunny 🐰", color: "#ff69b4", emoji: "💕" },
  { id: "p5", name: "Tale of karma", sub: "Playlist · Dj Ashwin shetty", color: "#ff6600", emoji: "🎵" },
  { id: "p6", name: "Wedding 2024", sub: "Playlist · amritansu", color: "#8B6914", emoji: "💒" },
  { id: "p7", name: "Discovery Mix ✦", sub: "Playlist · Made for Prathamesh", color: "#1DB954", emoji: "◎", isDiscovery: true },
];

const VIBE_LABELS = {
  indie: "Indie",
  ambient: "Ambient",
  techno: "Late-night",
  hyperpop: "Hyperpop",
  jazz: "Jazz",
  shoegaze: "Shoegaze",
};

export default function App() {
  const [activeVibes, setActiveVibes]       = useState(["indie"]);
  const [dial, setDial]                     = useState(25);
  const [mix, setMix]                       = useState([]);
  const [reasons, setReasons]               = useState({});
  const [aiSource, setAiSource]             = useState(null);
  const [loading, setLoading]               = useState(false);
  const [selectedTrack, setSelectedTrack]   = useState(null);
  const [isPlaying, setIsPlaying]           = useState(false);
  const [activePlaylist, setActivePlaylist] = useState("p7");
  const [searchQuery, setSearchQuery]       = useState("");

  // Playback timeline simulation
  const [currentTime, setCurrentTime]       = useState(84);
  const trackDuration                       = 228; // 3:48
  const [volume, setVolume]                 = useState(0.7);
  const [isMuted, setIsMuted]               = useState(false);
  const [isShuffle, setIsShuffle]           = useState(false);
  const [isRepeat, setIsRepeat]             = useState(false);

  const sliderRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);

  // ── Relevance filter state ─────────────────────────────────────────
  // null = show all; "high" = strong only; "medium" = good only; "low" = wider stretch
  const [relFilter, setRelFilter] = useState(null);

  // ── Save / Skip — SESSION-WIDE ────────────────────────────────────
  const [saved, setSaved]           = useState(new Set());
  const [skipped, setSkipped]       = useState(new Set());
  const [allNewSeen, setAllNewSeen] = useState(new Map());

  // ── Playlist creator state ────────────────────────────────────────
  const [showPlaylistModal, setShowPlaylistModal]       = useState(false);
  const [playlistName, setPlaylistName]                 = useState("");
  const [userPlaylists, setUserPlaylists]               = useState([]);
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState(null);
  const [showAddMenu, setShowAddMenu]                   = useState(null);

  const dialLabel =
    dial <= 15
      ? "Comfort zone"
      : dial <= 35
      ? "Mostly familiar"
      : dial <= 60
      ? "Adventurous"
      : "Maximum discovery";

  const newCount = mix.filter((t) => t.familiarity === "new").length;
  const currentTrack = selectedTrack || mix[0] || {
    id: "default",
    title: "Discovery Mix",
    artist: "Prathamesh Deshmane",
    year: 2026,
    mood: "adventurous",
    energy: 3,
  };

  const newSeenCount = allNewSeen.size;
  const newSavedCount = [...allNewSeen.keys()].filter((id) => saved.has(id)).length;

  const vibeLabel = activeVibes
    .map((id) => VIBES.find((v) => v.id === id)?.label)
    .filter(Boolean)
    .join(" + ");
  const vibeSeed = activeVibes
    .map((id) => VIBES.find((v) => v.id === id)?.seed)
    .filter(Boolean)
    .join(", ");

  // ── Playback simulation timer ──────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= trackDuration) {
          if (isRepeat) return 0;
          playNext(currentTrack);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isRepeat, currentTrack, mix]);

  // ── Sorted + filtered display list ───────────────────────────────
  const displayMix = useMemo(() => {
    const newTracks = mix
      .filter((t) => t.familiarity === "new")
      .map((t) => ({ ...t, _rel: relevanceScore(t, activeVibes) }))
      .sort((a, b) => REL_ORDER[a._rel] - REL_ORDER[b._rel]);

    const familiarTracks = mix.filter((t) => t.familiarity === "familiar");

    const filteredNew = !relFilter
      ? newTracks
      : newTracks.filter((t) =>
          relFilter === "high"
            ? t._rel === "high"
            : relFilter === "medium"
            ? t._rel === "medium"
            : relFilter === "low"
            ? t._rel === "low"
            : true
        );

    let interleaved = [];
    if (!filteredNew.length) {
      interleaved = familiarTracks;
    } else if (!familiarTracks.length) {
      interleaved = filteredNew;
    } else {
      const result = [];
      const total = familiarTracks.length + filteredNew.length;
      const step = total / filteredNew.length;
      let newIdx = 0;
      let famIdx = 0;
      let nextNewAt = step / 2;

      for (let i = 0; i < total; i++) {
        if (newIdx < filteredNew.length && i >= Math.round(nextNewAt) - 1) {
          result.push(filteredNew[newIdx++]);
          nextNewAt += step;
        } else if (famIdx < familiarTracks.length) {
          result.push(familiarTracks[famIdx++]);
        } else {
          result.push(filteredNew[newIdx++]);
        }
      }
      interleaved = result;
    }

    if (!searchQuery.trim()) return interleaved;
    const q = searchQuery.toLowerCase().trim();
    return interleaved.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.mood && t.mood.toLowerCase().includes(q))
    );
  }, [mix, activeVibes, relFilter, searchQuery]);

  async function rebuild() {
    const newMix = buildMix(activeVibes, dial);
    setMix(newMix);
    if (!selectedTrack || !newMix.some((t) => t.id === selectedTrack.id)) {
      setSelectedTrack(newMix[0] || null);
    }
    setReasons({});
    setAiSource(null);
    setAllNewSeen((prev) => {
      const next = new Map(prev);
      newMix.filter((t) => t.familiarity === "new").forEach((t) => next.set(t.id, t));
      return next;
    });

    const newOnes = newMix.filter((t) => t.familiarity === "new");
    if (!newOnes.length) return;

    setLoading(true);
    try {
      const r = await fetch("/api/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibeLabel,
          vibeSeed,
          tracks: newOnes.map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            mood: t.mood,
            energy: t.energy,
            year: t.year,
          })),
        }),
      });
      const data = await r.json();
      const map = {};
      (data.reasons || []).forEach((x) => {
        map[x.id] = x.why;
      });
      setReasons(map);
      setAiSource(data.source);
    } catch {
      setAiSource("fallback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    rebuild();
  }, []);

  function toggleVibe(v) {
    setActiveVibes((prev) =>
      prev.includes(v) ? (prev.length > 1 ? prev.filter((x) => x !== v) : prev) : [...prev, v]
    );
  }

  // ── Drag & Click Handler for Discovery Dial Slider ──────────────
  function handleDialPointerDown(e) {
    if (!sliderRef.current) return;
    const updateDial = (evt) => {
      const rect = sliderRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, Math.round(((evt.clientX - rect.left) / rect.width) * 100)));
      setDial(pct);
    };
    updateDial(e);

    const onPointerMove = (evt) => updateDial(evt);
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  // ── Scrub Bar Click / Seek ───────────────────────────────────────
  function handleProgressClick(e) {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(Math.round(pct * trackDuration));
  }

  // ── Volume Bar Click ─────────────────────────────────────────────
  function handleVolumeClick(e) {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
    setIsMuted(false);
  }

  function toggleSave(trackId, e) {
    e?.stopPropagation?.();
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      return next;
    });
  }

  function handleTrackSelect(track) {
    if (selectedTrack?.id === track.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setSelectedTrack(track);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }

  function playNext(fromTrack) {
    const list = displayMix.length ? displayMix : mix;
    if (!list.length) return;
    if (isShuffle) {
      const randomTrack = list[Math.floor(Math.random() * list.length)];
      setSelectedTrack(randomTrack);
    } else {
      const idx = list.findIndex((t) => t.id === fromTrack?.id);
      const next = list[(idx + 1) % list.length];
      setSelectedTrack(next);
    }
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function handlePrev(e) {
    e?.stopPropagation?.();
    const list = displayMix.length ? displayMix : mix;
    if (!list.length) return;
    const idx = list.findIndex((t) => t.id === currentTrack?.id);
    const prev = list[(idx - 1 + list.length) % list.length];
    setSelectedTrack(prev);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function handleSkip(e) {
    e?.stopPropagation?.();
    const st = currentTrack;
    if (st?.id) setSkipped((prev) => new Set(prev).add(st.id));
    playNext(st);
  }

  function togglePlayPause() {
    if (!isPlaying) {
      if (!selectedTrack && mix[0]) setSelectedTrack(mix[0]);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }

  // ── Playlist helpers ──────────────────────────────────────────────
  function createPlaylist() {
    const name = playlistName.trim() || `My Discovery Playlist ${userPlaylists.length + 1}`;
    const newPl = { id: `up${Date.now()}`, name, tracks: [] };
    setUserPlaylists((prev) => [...prev, newPl]);
    setPlaylistName("");
    setShowPlaylistModal(false);
    return newPl.id;
  }

  function addTrackToPlaylist(playlistId, trackId, e) {
    e?.stopPropagation?.();
    setUserPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId && !pl.tracks.includes(trackId)
          ? { ...pl, tracks: [...pl.tracks, trackId] }
          : pl
      )
    );
    setShowAddMenu(null);
  }

  function toggleAddMenu(trackId, e) {
    e?.stopPropagation?.();
    setShowAddMenu((prev) => (prev === trackId ? null : trackId));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "'Circular Std', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
      }}
      onClick={() => setShowAddMenu(null)}
    >
      {/* TOP BAR */}
      <header
        style={{
          height: 64,
          background: "#000",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#1DB954" aria-label="Spotify Logo">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              aria-label="Back"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "#fff",
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ‹
            </button>
            <button
              aria-label="Forward"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "#b3b3b3",
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ flex: 1, maxWidth: 420, position: "relative", margin: "0 auto" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks, artists, or vibes in mix..."
            style={{
              width: "100%",
              padding: "10px 16px 10px 38px",
              borderRadius: 500,
              background: "#242424",
              border: "1px solid #383838",
              fontSize: 14,
              color: "#fff",
              boxSizing: "border-box",
              outline: "none",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#1DB954";
              e.target.style.background = "#2a2a2a";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#383838";
              e.target.style.background = "#242424";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#b3b3b3",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <button
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 500,
              padding: "8px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Explore Premium
          </button>
          <button
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 500,
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ↓ Install App
          </button>
          <div
            title="Prathamesh Deshmane (Original Developer & Owner)"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#532683",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              border: "2px solid #1DB954",
            }}
          >
            P
          </div>
        </div>
      </header>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 8, padding: "0 8px 8px" }}>
        {/* LEFT — Your Library */}
        <aside
          style={{
            width: 280,
            background: "#121212",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <span>☰</span> Your Library
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                onClick={() => setShowPlaylistModal(true)}
                title="Create new playlist"
                style={{ background: "transparent", border: "none", color: "#b3b3b3", fontSize: 22, cursor: "pointer", lineHeight: 1 }}
              >
                +
              </button>
              <span
                onClick={() => setShowPlaylistModal(true)}
                style={{ color: "#b3b3b3", fontSize: 13, cursor: "pointer" }}
              >
                Create
              </span>
            </div>
          </div>

          <div style={{ padding: "0 16px 8px", display: "flex", gap: 6 }}>
            {["Playlists", "Artists", "Albums"].map((f) => (
              <button
                key={f}
                style={{
                  background: f === "Playlists" ? "#fff" : "#2a2a2a",
                  color: f === "Playlists" ? "#000" : "#fff",
                  border: "none",
                  borderRadius: 500,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ padding: "0 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#b3b3b3", fontSize: 13, cursor: "pointer" }}>🔍</span>
            <span style={{ color: "#b3b3b3", fontSize: 12, cursor: "pointer" }}>Recents ☰</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {PLAYLISTS.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActivePlaylist(pl.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: activePlaylist === pl.id ? "#2a2a2a" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 4,
                    background: pl.isDiscovery ? "#1DB954" : pl.color || "#333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {pl.isDiscovery ? "◎" : pl.emoji}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: pl.isDiscovery ? "#1DB954" : "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {pl.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#b3b3b3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pl.sub}
                  </div>
                </div>
              </div>
            ))}

            {/* User-created playlists */}
            {userPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActivePlaylist(pl.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: activePlaylist === pl.id ? "#2a2a2a" : "transparent",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 4,
                    background: "#2a2a2a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  🎵
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pl.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#b3b3b3" }}>Playlist · {pl.tracks.length} songs</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER — Main Content Area */}
        <main style={{ flex: 1, background: "#121212", borderRadius: 8, overflowY: "auto" }}>
          {/* Top Banner & Quick Links */}
          <div style={{ background: "linear-gradient(180deg,#1a3a2e 0%,#121212 100%)", padding: "24px 24px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 24 }}>
              {[
                { name: "GYM SONGS 💪 (for girlies) 2026", color: "#c8102e", emoji: "💪" },
                { name: "Liked Songs", color: "#4B0082", emoji: "♥" },
                { name: "The Summer I Turned Pretty", color: "#8B4513", emoji: "🌸" },
                { name: "Shree Hanuman Chalisa", color: "#ff6600", emoji: "🙏" },
                { name: "Slow Coffee, Slow Heart", color: "#006400", emoji: "☕" },
                { name: "Ep. 17: Ritika Saraf", color: "#4169E1", emoji: "🎙️" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 12px 4px 4px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: item.color,
                      borderRadius: 4,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {item.emoji}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{item.name}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Getting started</h2>
                </div>
                <div style={{ background: "linear-gradient(135deg,#c8a84b 0%,#8B6914 100%)", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>1. Start playing</div>
                  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
                    Search, browse, and play your favorite artists and creators.
                  </div>
                  <button
                    style={{
                      background: "#1DB954",
                      color: "#000",
                      border: "none",
                      borderRadius: 500,
                      padding: "8px 20px",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#b3b3b3", marginBottom: 2 }}>Made For</div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Prathamesh</h2>
                  </div>
                  <span style={{ color: "#1DB954", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Show all</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { n: "Daily Mix 01", a: "Arijit Singh, Himesh...", c: "#ff6600" },
                    { n: "Daily Mix 02", a: "Olivia Rodrigo, Katy...", c: "#9B59B6" },
                  ].map((m, i) => (
                    <div key={i} style={{ flex: 1, background: "#2a2a2a", borderRadius: 8, padding: 12, cursor: "pointer" }}>
                      <div
                        style={{
                          width: "100%",
                          paddingBottom: "100%",
                          background: `linear-gradient(135deg,${m.c},#000)`,
                          borderRadius: 4,
                          position: "relative",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ position: "absolute", top: 8, left: 8, background: m.c, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 700 }}>
                          Daily Mix
                        </div>
                        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.8)", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 900 }}>
                          0{i + 1}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.n}</div>
                      <div style={{ fontSize: 12, color: "#b3b3b3" }}>{m.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DISCOVERY MIX SECTION */}
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ marginBottom: 12, color: "#b3b3b3", fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
              ALBUMS FEATURING SONGS YOU LIKE
            </div>

            <div style={{ background: "#181818", borderRadius: 8, overflow: "visible" }}>
              {/* Playlist header */}
              <div style={{ background: "linear-gradient(135deg,#1a5c2e 0%,#0d3018 100%)", padding: "20px 20px 0", borderRadius: "8px 8px 0 0" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20 }}>
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      background: "#1DB954",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 56 }}>◎</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                      PLAYLIST
                    </div>
                    <h1 style={{ margin: "0 0 8px", fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>Discovery Mix</h1>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                      Tuned to your dial — fresh music, on your terms.
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                      Made for you · {mix.length} songs ·{" "}
                      <span style={{ color: "#1DB954", fontWeight: 600 }}>{newCount} new</span> mixed in
                      {newSeenCount > 0 && (
                        <span style={{ marginLeft: 10, color: "rgba(255,255,255,0.55)" }}>
                          · <span style={{ color: "#1DB954", fontWeight: 600 }}>{newSavedCount}/{newSeenCount}</span> new saved this session
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <button
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? "Pause mix" : "Play mix"}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#1DB954",
                    border: "none",
                    color: "#000",
                    fontSize: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
                    transition: "transform 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <div
                  onClick={() => currentTrack.id && toggleSave(currentTrack.id)}
                  style={{ color: saved.has(currentTrack.id) ? "#1DB954" : "#b3b3b3", fontSize: 24, cursor: "pointer" }}
                >
                  {saved.has(currentTrack.id) ? "♥" : "♡"}
                </div>
                <button
                  onClick={() => setShowPlaylistModal(true)}
                  title="Save to new playlist"
                  style={{
                    background: "transparent",
                    border: "1px solid #535353",
                    borderRadius: 500,
                    color: "#b3b3b3",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  ＋ New playlist
                </button>
                <div style={{ color: "#b3b3b3", fontSize: 18, cursor: "pointer" }}>⋯</div>
              </div>

              {/* THE DISCOVERY DIAL CARD */}
              <div style={{ margin: "0 20px 16px", background: "#282828", borderRadius: 8, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ color: "#1DB954", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                    ✦ DISCOVERY DIAL
                  </span>
                  <span style={{ color: "#b3b3b3", fontSize: 13 }}>
                    {dialLabel} · <strong style={{ color: "#fff" }}>{dial}% new</strong>
                  </span>
                </div>

                {/* Draggable Slider Container */}
                <div
                  style={{ padding: "10px 0", cursor: "pointer", userSelect: "none", touchAction: "none" }}
                  onPointerDown={handleDialPointerDown}
                >
                  <div
                    ref={sliderRef}
                    style={{ position: "relative", height: 6, background: "#535353", borderRadius: 3 }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${dial}%`,
                        background: "#1DB954",
                        borderRadius: 3,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: `${dial}%`,
                        transform: "translate(-50%,-50%)",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                        cursor: "grab",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#b3b3b3", marginBottom: 12 }}>
                  <span>Comfort (0% new)</span>
                  <span>Maximum discovery (50-100% new)</span>
                </div>

                {/* Vibe Selection Chips & Build Button */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {VIBES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => toggleVibe(v.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 500,
                        border: activeVibes.includes(v.id) ? "2px solid #1DB954" : "1px solid #535353",
                        background: activeVibes.includes(v.id) ? "rgba(29,185,84,0.15)" : "transparent",
                        color: activeVibes.includes(v.id) ? "#1DB954" : "#b3b3b3",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {VIBE_LABELS[v.id]}
                    </button>
                  ))}

                  <button
                    onClick={rebuild}
                    disabled={loading}
                    style={{
                      marginLeft: "auto",
                      padding: "8px 22px",
                      borderRadius: 500,
                      background: "#1DB954",
                      border: "none",
                      color: "#000",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: loading ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {loading ? "Tuning…" : <><span style={{ fontSize: 15 }}>⊞</span> Build mix</>}
                  </button>
                </div>
              </div>

              {/* AI banner + relevance legend */}
              <div style={{ margin: "0 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(29,185,84,0.12)",
                    color: "#1DB954",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 999,
                  }}
                >
                  ★ {aiSource === "groq" ? "AI relevance live (Groq / Llama 3.1) — each new pick explained" : "AI relevance active — each new pick explained"}
                </div>

                {/* Relevance legend */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#b3b3b3" }}>
                  {Object.entries(RELEVANCE_STYLE).map(([key, rs]) => (
                    <span key={key} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ color: rs.color, fontSize: 13 }}>★</span>
                      <span style={{ color: "#888" }}>{rs.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Relevance filter chips — 3 tiers + All */}
              <div style={{ margin: "0 20px 12px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#888", marginRight: 4 }}>Filter:</span>
                {[
                  { key: null,     label: "All",            color: "#888" },
                  { key: "high",   label: "★ Strong match",  color: "#1DB954" },
                  { key: "medium", label: "★ Good match",    color: "#d9c75a" },
                  { key: "low",    label: "★ Wider stretch", color: "#e08a4f" },
                ].map((f) => (
                  <button
                    key={String(f.key)}
                    onClick={() => setRelFilter(f.key)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 500,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: relFilter === f.key ? f.color : "transparent",
                      color: relFilter === f.key ? (f.key ? "#000" : "#fff") : f.color,
                      border: `1px solid ${relFilter === f.key ? f.color : "#333"}`,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Track list */}
              <div style={{ padding: "0 20px 20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr 36px 36px 80px 60px",
                    gap: "0 8px",
                    padding: "8px 8px",
                    borderBottom: "1px solid #2a2a2a",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ color: "#b3b3b3", fontSize: 12 }}>#</div>
                  <div style={{ color: "#b3b3b3", fontSize: 12 }}>TITLE</div>
                  <div />
                  <div />
                  <div style={{ color: "#b3b3b3", fontSize: 12, textAlign: "right" }}>TAG</div>
                  <div style={{ color: "#b3b3b3", fontSize: 12, textAlign: "right" }}>YEAR</div>
                </div>

                {displayMix.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "#888", fontSize: 14 }}>
                    No tracks match your current filter. Try selecting "All" or rebuilding the mix.
                  </div>
                ) : (
                  displayMix.map((track, i) => {
                    const isSelected = selectedTrack?.id === track.id;
                    const isCurrentlyPlaying = isPlaying && isSelected;
                    const isNew = track.familiarity === "new";
                    const isSaved = saved.has(track.id);
                    const wasSkipped = skipped.has(track.id);
                    const rel = track._rel || (isNew ? relevanceScore(track, activeVibes) : null);
                    const relStyle = rel ? RELEVANCE_STYLE[rel] : null;

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleTrackSelect(track)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 1fr 36px 36px 80px 60px",
                          gap: "0 8px",
                          padding: "10px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                          background: isSelected ? "rgba(255,255,255,0.07)" : "transparent",
                          alignItems: "start",
                          opacity: wasSkipped ? 0.55 : 1,
                          position: "relative",
                          zIndex: showAddMenu === track.id ? 25 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#2a2a2a";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* # / playing animated bars */}
                        <div style={{ color: isSelected ? "#1DB954" : "#b3b3b3", fontSize: 13, paddingTop: 4, textAlign: "center" }}>
                          {isCurrentlyPlaying ? (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="#1DB954">
                              <rect x="1" y="3" width="2" height="8" rx="1">
                                <animate attributeName="height" values="8;3;8" dur="0.8s" repeatCount="indefinite" />
                                <animate attributeName="y" values="3;5.5;3" dur="0.8s" repeatCount="indefinite" />
                              </rect>
                              <rect x="5" y="1" width="2" height="12" rx="1">
                                <animate attributeName="height" values="12;4;12" dur="0.7s" repeatCount="indefinite" />
                                <animate attributeName="y" values="1;5;1" dur="0.7s" repeatCount="indefinite" />
                              </rect>
                              <rect x="9" y="2" width="2" height="10" rx="1">
                                <animate attributeName="height" values="10;6;10" dur="0.9s" repeatCount="indefinite" />
                                <animate attributeName="y" values="2;4;2" dur="0.9s" repeatCount="indefinite" />
                              </rect>
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>

                        {/* Title + AI line */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: `hsl(${(i * 47 + 120) % 360},40%,25%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                color: isSelected ? "#1DB954" : "rgba(255,255,255,0.7)",
                                flexShrink: 0,
                              }}
                            >
                              {track.artist
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  color: isSelected ? "#1DB954" : "#fff",
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                {track.title}
                                {relStyle && (
                                  <span
                                    title={`${relStyle.label} — Relevance Anchor`}
                                    style={{ color: relStyle.color, fontSize: 13, flexShrink: 0 }}
                                  >
                                    ★
                                  </span>
                                )}
                                {wasSkipped && <span style={{ fontSize: 10, color: "#888", fontWeight: 400 }}>(skipped)</span>}
                              </div>
                              <div style={{ fontSize: 12, color: "#b3b3b3" }}>{track.artist}</div>
                              {isNew && (
                                <div style={{ fontSize: 11, color: "#1DB954", marginTop: 3, display: "flex", alignItems: "flex-start", gap: 4 }}>
                                  <span
                                    style={{
                                      background: "#1DB954",
                                      color: "#000",
                                      borderRadius: 2,
                                      padding: "0 4px",
                                      fontSize: 9,
                                      fontWeight: 700,
                                      flexShrink: 0,
                                      marginTop: 1,
                                    }}
                                  >
                                    AI
                                  </span>
                                  <span style={{ lineHeight: 1.4 }}>
                                    {loading && !reasons[track.id]
                                      ? "Reasoning…"
                                      : reasons[track.id] || "Picked to fit your vibe but expand your taste."}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Save heart */}
                        <div style={{ paddingTop: 8, textAlign: "center" }}>
                          <button
                            onClick={(e) => toggleSave(track.id, e)}
                            title={isSaved ? "Saved" : "Save"}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 16,
                              color: isSaved ? "#1DB954" : "#888",
                              padding: 0,
                            }}
                          >
                            {isSaved ? "♥" : "♡"}
                          </button>
                        </div>

                        {/* Add to playlist "+" with dropdown */}
                        <div style={{ paddingTop: 8, textAlign: "center", position: "relative" }}>
                          <button
                            onClick={(e) => toggleAddMenu(track.id, e)}
                            title="Add to playlist"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 16,
                              color: "#888",
                              padding: 0,
                              lineHeight: 1,
                            }}
                          >
                            ＋
                          </button>
                          {showAddMenu === track.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: "absolute",
                                top: 28,
                                right: 0,
                                background: "#282828",
                                border: "1px solid #3a3a3a",
                                borderRadius: 8,
                                padding: 8,
                                zIndex: 100,
                                minWidth: 200,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
                              }}
                            >
                              <div style={{ fontSize: 11, color: "#888", padding: "4px 8px 8px", borderBottom: "1px solid #3a3a3a", marginBottom: 6 }}>
                                Add to playlist
                              </div>
                              {userPlaylists.length === 0 && (
                                <div style={{ fontSize: 12, color: "#888", padding: "4px 8px 8px" }}>
                                  No custom playlists yet
                                </div>
                              )}
                              {userPlaylists.map((pl) => (
                                <button
                                  key={pl.id}
                                  onClick={(e) => addTrackToPlaylist(pl.id, track.id, e)}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    background: "transparent",
                                    border: "none",
                                    color: pl.tracks.includes(track.id) ? "#1DB954" : "#fff",
                                    fontSize: 13,
                                    padding: "6px 8px",
                                    cursor: "pointer",
                                    borderRadius: 4,
                                  }}
                                >
                                  {pl.tracks.includes(track.id) ? "✓ " : ""}
                                  {pl.name}
                                </button>
                              ))}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowPlaylistModal(true);
                                  setAddToPlaylistTrackId(track.id);
                                  setShowAddMenu(null);
                                }}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  textAlign: "left",
                                  background: "transparent",
                                  border: "none",
                                  color: "#1DB954",
                                  fontSize: 13,
                                  padding: "6px 8px",
                                  cursor: "pointer",
                                  borderRadius: 4,
                                  marginTop: 4,
                                  borderTop: "1px solid #3a3a3a",
                                  paddingTop: 10,
                                }}
                              >
                                ＋ Create new playlist
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Tag column — New / In rotation only */}
                        <div style={{ textAlign: "right", paddingTop: 10 }}>
                          {isNew ? (
                            <span style={{ border: "1px solid #1DB954", color: "#1DB954", borderRadius: 500, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                              New
                            </span>
                          ) : (
                            <span style={{ color: "#b3b3b3", fontSize: 12 }}>In rotation</span>
                          )}
                        </div>

                        {/* Year */}
                        <div style={{ color: "#b3b3b3", fontSize: 13, paddingTop: 12, textAlign: "right" }}>
                          {track.year}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ textAlign: "center", color: "#4a4a4a", fontSize: 11, marginTop: 16 }}>
              Discovery Dial Concept Prototype · Created & Developed by Prathamesh Deshmane · NextLeap Cohort 42
            </div>
          </div>
        </main>

        {/* RIGHT PANEL — Now Playing & Artist Information */}
        <aside
          style={{
            width: 280,
            background: "#121212",
            borderRadius: 8,
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentTrack.title} <span style={{ color: "#b3b3b3", fontWeight: 400 }}>· {currentTrack.artist}</span>
            </div>
            <div
              style={{
                width: "100%",
                paddingBottom: "100%",
                background: "linear-gradient(135deg,#1a5c2e,#0d3018)",
                borderRadius: 8,
                position: "relative",
                marginBottom: 12,
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                ◎
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentTrack.title}
                </div>
                <div style={{ fontSize: 13, color: "#b3b3b3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentTrack.artist}
                </div>
              </div>
              <button
                onClick={(e) => currentTrack.id && toggleSave(currentTrack.id, e)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: currentTrack.id && saved.has(currentTrack.id) ? "#1DB954" : "#b3b3b3",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                {currentTrack.id && saved.has(currentTrack.id) ? "♥" : "♡"}
              </button>
            </div>
          </div>

          <div style={{ padding: "0 16px 8px", fontSize: 13, fontWeight: 700 }}>About the artist</div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
            <div style={{ background: "#282828", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ height: 100, background: "linear-gradient(135deg,#8B6914,#c8a84b)", display: "flex", alignItems: "flex-end", padding: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{currentTrack.artist}</span>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 12, color: "#b3b3b3", marginBottom: 6 }}>
                  {currentTrack.vibe ? VIBE_LABELS[currentTrack.vibe] || "Alternative" : "Featured Artist"}
                </div>
                <div style={{ fontSize: 12, color: "#b3b3b3", lineHeight: 1.5 }}>
                  An artist in your Discovery Mix — featured because they share your current listening groove with energy rating {currentTrack.energy || 3}/5.
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Next in mix</div>
            {mix.slice(1, 4).map((t, i) => (
              <div
                key={t.id}
                onClick={() => handleTrackSelect(t)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  cursor: "pointer",
                  borderBottom: "1px solid #2a2a2a",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: `hsl(${(i * 80 + 200) % 360},35%,25%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {t.artist.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#b3b3b3" }}>{t.artist}</div>
                </div>
                {t.familiarity === "new" && (
                  <span style={{ fontSize: 10, color: "#1DB954", border: "1px solid #1DB954", borderRadius: 500, padding: "1px 6px", flexShrink: 0 }}>
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* BOTTOM PLAYBACK CONTROLS BAR */}
      <footer
        style={{
          height: 76,
          background: "#181818",
          borderTop: "1px solid #282828",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 16,
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        {/* Left Track Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: 260, flexShrink: 0 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 4,
              background: "linear-gradient(135deg,#1a5c2e,#0d3018)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ◎
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentTrack.title}
            </div>
            <div style={{ fontSize: 12, color: "#b3b3b3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentTrack.artist}
            </div>
          </div>
          <button
            onClick={(e) => currentTrack.id && toggleSave(currentTrack.id, e)}
            style={{
              background: "transparent",
              border: "none",
              color: currentTrack.id && saved.has(currentTrack.id) ? "#1DB954" : "#b3b3b3",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            {currentTrack.id && saved.has(currentTrack.id) ? "♥" : "♡"}
          </button>
        </div>

        {/* Center Controls & Progress Scrub Bar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, maxWidth: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => setIsShuffle((prev) => !prev)}
              title="Shuffle"
              style={{
                background: "transparent",
                border: "none",
                color: isShuffle ? "#1DB954" : "#b3b3b3",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ⇄
            </button>
            <button
              onClick={handlePrev}
              title="Previous"
              style={{ background: "transparent", border: "none", color: "#b3b3b3", fontSize: 22, cursor: "pointer" }}
            >
              ⏮
            </button>
            <button
              onClick={togglePlayPause}
              title={isPlaying ? "Pause" : "Play"}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#fff",
                border: "none",
                color: "#000",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              onClick={handleSkip}
              title="Skip (interpreted gracefully by novelty steering)"
              style={{ background: "transparent", border: "none", color: "#b3b3b3", fontSize: 22, cursor: "pointer" }}
            >
              ⏭
            </button>
            <button
              onClick={() => setIsRepeat((prev) => !prev)}
              title="Repeat"
              style={{
                background: "transparent",
                border: "none",
                color: isRepeat ? "#1DB954" : "#b3b3b3",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ↺
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <span style={{ fontSize: 11, color: "#b3b3b3", minWidth: 32, textAlign: "right", flexShrink: 0 }}>
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressBarRef}
              onClick={handleProgressClick}
              style={{ flex: 1, height: 4, background: "#535353", borderRadius: 2, cursor: "pointer", position: "relative" }}
            >
              <div
                style={{
                  width: `${Math.min(100, (currentTime / trackDuration) * 100)}%`,
                  height: "100%",
                  background: isPlaying ? "#1DB954" : "#fff",
                  borderRadius: 2,
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: "#b3b3b3", minWidth: 32, flexShrink: 0 }}>
              {formatTime(trackDuration)}
            </span>
          </div>
        </div>

        {/* Right Volume & Extras */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: 220, justifyContent: "flex-end", flexShrink: 0 }}>
          <button style={{ background: "transparent", border: "none", color: "#b3b3b3", fontSize: 16, cursor: "pointer" }}>🎤</button>
          <button style={{ background: "transparent", border: "none", color: "#b3b3b3", fontSize: 16, cursor: "pointer" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#b3b3b3", fontSize: 14, padding: 0 }}
            >
              {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>
            <div
              ref={volumeBarRef}
              onClick={handleVolumeClick}
              style={{ width: 80, height: 4, background: "#535353", borderRadius: 2, cursor: "pointer", position: "relative" }}
            >
              <div
                style={{
                  width: `${isMuted ? 0 : Math.round(volume * 100)}%`,
                  height: "100%",
                  background: "#fff",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
          <button style={{ background: "transparent", border: "none", color: "#b3b3b3", fontSize: 14, cursor: "pointer" }}>⤢</button>
        </div>
      </footer>

      {/* CREATE PLAYLIST MODAL */}
      {showPlaylistModal && (
        <div
          onClick={() => {
            setShowPlaylistModal(false);
            setAddToPlaylistTrackId(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#282828", borderRadius: 12, padding: 28, width: 340, boxShadow: "0 16px 48px rgba(0,0,0,0.8)" }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Create playlist</div>
            <div style={{ fontSize: 13, color: "#b3b3b3", marginBottom: 20 }}>
              Give your Discovery Mix playlist a custom name
            </div>
            <input
              autoFocus
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const id = createPlaylist();
                  if (addToPlaylistTrackId) {
                    setUserPlaylists((prev) =>
                      prev.map((pl) => (pl.id === id ? { ...pl, tracks: [addToPlaylistTrackId] } : pl))
                    );
                    setAddToPlaylistTrackId(null);
                  }
                }
              }}
              placeholder="My Discovery Mix"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 6,
                background: "#3a3a3a",
                border: "1px solid #535353",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setAddToPlaylistTrackId(null);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #535353",
                  color: "#fff",
                  borderRadius: 500,
                  padding: "8px 20px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = createPlaylist();
                  if (addToPlaylistTrackId) {
                    setUserPlaylists((prev) =>
                      prev.map((pl) => (pl.id === id ? { ...pl, tracks: [addToPlaylistTrackId] } : pl))
                    );
                    setAddToPlaylistTrackId(null);
                  }
                }}
                style={{
                  background: "#1DB954",
                  border: "none",
                  color: "#000",
                  borderRadius: 500,
                  padding: "8px 20px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
