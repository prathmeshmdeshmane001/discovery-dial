import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, VIBES } from '../src/tracks.js';
import { buildMix, relevanceScore } from '../src/engine.js';
import handler, { getTrackFallbackReason } from '../api/reason.js';

test('Dataset Integrity: Verify all 75 tracks across 6 vibes', () => {
  assert.equal(TRACKS.length, 75, 'Should contain exactly 75 curated tracks');
  assert.equal(VIBES.length, 6, 'Should contain exactly 6 vibes');

  const vibeIds = VIBES.map(v => v.id);
  vibeIds.forEach(vibeId => {
    const familiar = TRACKS.filter(t => t.vibe === vibeId && t.familiarity === 'familiar');
    const newTracks = TRACKS.filter(t => t.vibe === vibeId && t.familiarity === 'new');

    assert.ok(familiar.length >= 4, `${vibeId} should have at least 4 familiar tracks`);
    assert.ok(newTracks.length >= 7, `${vibeId} should have at least 7 new tracks`);
  });

  TRACKS.forEach(track => {
    assert.ok(track.id, 'Track must have an id');
    assert.ok(track.title, 'Track must have a title');
    assert.ok(track.artist, 'Track must have an artist');
    assert.ok(track.vibe, 'Track must have a vibe');
    assert.ok(['familiar', 'new'].includes(track.familiarity), 'familiarity must be familiar or new');
    assert.ok(track.energy >= 1 && track.energy <= 5, 'Energy must be between 1 and 5');
    assert.ok(track.year > 1900, 'Year must be valid');
  });
});

test('Relevance Scoring: Computes high, medium, and low tiers correctly', () => {
  // Test Indie (average familiar energy ~2.43)
  const highTrack = { id: 'test1', vibe: 'indie', energy: 2 };
  assert.equal(relevanceScore(highTrack, ['indie']), 'high', 'Diff <= 0.75 should be high (Strong match)');

  const mediumTrack = { id: 'test2', vibe: 'indie', energy: 4 };
  assert.equal(relevanceScore(mediumTrack, ['indie']), 'medium', 'Diff <= 1.75 should be medium (Good match)');

  const lowTrack = { id: 'test3', vibe: 'indie', energy: 5 };
  assert.equal(relevanceScore(lowTrack, ['indie']), 'low', 'Diff > 1.75 should be low (Wider stretch)');

  // Track outside active vibes
  const mismatchedVibeTrack = { id: 'test4', vibe: 'techno', energy: 4 };
  assert.equal(relevanceScore(mismatchedVibeTrack, ['indie']), 'low', 'Mismatched vibe should be low');
});

test('Mix Generation: Respects Dial percentage and novelty ratios', () => {
  // 0% dial = 0% new tracks
  const mix0 = buildMix(['indie'], 0);
  assert.equal(mix0.length, 8, 'Mix length should be 8 at dial 0%');
  const newInMix0 = mix0.filter(t => t.familiarity === 'new');
  assert.equal(newInMix0.length, 0, '0% dial should have 0 new tracks');

  // 25% dial = ~25% new tracks
  const mix25 = buildMix(['indie'], 25);
  assert.equal(mix25.length, 8, 'Mix length should be 8 at dial 25%');
  const newInMix25 = mix25.filter(t => t.familiarity === 'new');
  assert.equal(newInMix25.length, 2, '25% of 8 should be 2 new tracks');

  // 50% dial = 50% new tracks (total tracks becomes 10 for high dial settings)
  const mix50 = buildMix(['indie'], 50);
  assert.equal(mix50.length, 10, 'Mix length should be 10 at dial 50%');
  const newInMix50 = mix50.filter(t => t.familiarity === 'new');
  assert.equal(newInMix50.length, 5, '50% of 10 should be 5 new tracks');

  // 100% dial = 100% new tracks
  const mix100 = buildMix(['indie'], 100);
  assert.equal(mix100.length, 10, 'Mix length should be 10 at dial 100%');
  const newInMix100 = mix100.filter(t => t.familiarity === 'new');
  assert.equal(newInMix100.length, 10, '100% dial should have all new tracks');
});

test('Fallback Reason Generator: Produces distinct musical explanations', () => {
  const track = { id: 'i7', title: 'Quarter to Three', artist: 'Hovvdy', mood: 'warm', energy: 2, year: 2021 };
  const seed = 'warm guitars, lo-fi, introspective';

  const reason0 = getTrackFallbackReason(track, seed, 0);
  const reason1 = getTrackFallbackReason(track, seed, 1);

  assert.ok(reason0 && reason0.length > 10, 'Reason should be a descriptive sentence');
  assert.notEqual(reason0, 'fallback', 'Must not be literal string "fallback"');
  assert.notEqual(reason0, reason1, 'Different indices should produce varied angles');
});

test('API Reason Handler: Handles method validation and fallback when no key', async () => {
  // Test GET rejection
  const getReq = { method: 'GET' };
  let getResCode = 0;
  let getResData = null;
  const getRes = {
    status(code) { getResCode = code; return this; },
    json(data) { getResData = data; return this; },
  };
  await handler(getReq, getRes);
  assert.equal(getResCode, 405, 'Non-POST requests should return 405');

  // Test POST with missing GROQ_API_KEY
  delete process.env.GROQ_API_KEY;
  const postReq = {
    method: 'POST',
    body: {
      vibeLabel: 'Indie & alternative',
      vibeSeed: 'warm guitars, lo-fi, introspective',
      tracks: [
        { id: 'i7', title: 'Quarter to Three', artist: 'Hovvdy', mood: 'warm', energy: 2, year: 2021 },
        { id: 'i8', title: 'Scott Street demo', artist: 'Indigo De Souza', mood: 'raw', energy: 3, year: 2021 },
      ],
    },
  };
  let postResCode = 0;
  let postResData = null;
  const postRes = {
    status(code) { postResCode = code; return this; },
    json(data) { postResData = data; return this; },
  };
  await handler(postReq, postRes);
  assert.equal(postResCode, 200, 'Fallback handler should return 200 status');
  assert.equal(postResData.source, 'fallback');
  assert.equal(postResData.reasons.length, 2);
  assert.ok(postResData.reasons[0].why.length > 10);
  assert.notEqual(postResData.reasons[0].why, 'fallback');
});

test('API Reason Handler: Parses Groq LLM response with code fences and deduplicates', async () => {
  const originalFetch = globalThis.fetch;
  process.env.GROQ_API_KEY = 'gsk_mock_test_key';

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      choices: [{
        message: {
          content: '```json\n[\n  {"i": 1, "why": "Brings raw emotional indie guitar hooks."},\n  {"i": 2, "why": "Brings raw emotional indie guitar hooks."}\n]\n```',
        },
      }],
    }),
  });

  try {
    const postReq = {
      method: 'POST',
      body: {
        vibeLabel: 'Indie & alternative',
        vibeSeed: 'warm guitars, lo-fi, introspective',
        tracks: [
          { id: 'i7', title: 'Quarter to Three', artist: 'Hovvdy', mood: 'warm', energy: 2, year: 2021 },
          { id: 'i8', title: 'Scott Street demo', artist: 'Indigo De Souza', mood: 'raw', energy: 3, year: 2021 },
        ],
      },
    };
    let postResCode = 0;
    let postResData = null;
    const postRes = {
      status(code) { postResCode = code; return this; },
      json(data) { postResData = data; return this; },
    };

    await handler(postReq, postRes);

    assert.equal(postResCode, 200);
    assert.equal(postResData.source, 'groq');
    assert.equal(postResData.reasons.length, 2);
    assert.equal(postResData.reasons[0].why, 'Brings raw emotional indie guitar hooks.');
    // Second item should be deduplicated with fallback reason rather than repeating
    assert.notEqual(postResData.reasons[1].why, 'Brings raw emotional indie guitar hooks.');
    assert.notEqual(postResData.reasons[1].why, 'fallback');
    assert.notEqual(postResData.reasons[1].why, 'dedup_fallback');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GROQ_API_KEY;
  }
});
