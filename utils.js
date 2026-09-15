// ============================================================
// utils.js — Shared Utilities for ROP Apply
// Imported by: index.html, review.html, status.html, dashboard.html
// ============================================================

// ── Compression / Decompression ──────────────────────────────

/**
 * Compress a JSON string using deflate and return a URL-safe Base64 string.
 * Falls back gracefully if CompressionStream is unavailable.
 */
async function compressPayload(str) {
  try {
    if (typeof CompressionStream === 'undefined') return null;
    const stream = new Blob([str]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('deflate'));
    const response = new Response(compressedStream);
    const buffer = await response.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('compressPayload failed:', e);
    return null;
  }
}

/**
 * Decompress a URL-safe Base64 deflate-compressed string back into a plain string.
 */
async function decompressPayload(base64) {
  try {
    let b64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const stream = new Blob([bytes]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate'));
    return await new Response(decompressedStream).text();
  } catch (e) {
    console.error('decompressPayload failed:', e);
    return null;
  }
}

// ── Security ──────────────────────────────────────────────────

/**
 * Safely escape HTML special characters to prevent XSS.
 */
function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str ?? '').replace(/[&<>"']/g, m => map[m]);
}

/**
 * Set element text content safely (no XSS risk via innerHTML).
 */
function setTextSafe(el, text) {
  if (el) el.textContent = String(text ?? '');
}

// ── Webhook ───────────────────────────────────────────────────

/**
 * Send a webhook payload with exponential-backoff retry.
 * Handles Discord's 429 rate-limit headers.
 * @param {string} url    - Discord webhook URL
 * @param {object} body   - JSON-serializable payload
 * @param {number} maxTries
 */
async function sendWithRetry(url, body, maxTries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxTries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Handle Discord rate limiting
      if (res.status === 429) {
        const retryAfter = parseFloat(res.headers.get('retry-after') || '2');
        await new Promise(r => setTimeout(r, retryAfter * 1000 + 200));
        continue;
      }

      return res; // Return for caller to inspect .ok / .status
    } catch (err) {
      lastError = err;
      // Exponential backoff: 500ms, 1000ms, 2000ms
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw lastError || new Error('Failed to reach Discord after retries.');
}

// ── Application ID ────────────────────────────────────────────

const APP_ID_STORAGE_KEY = 'rop_app_id_counter';

/**
 * Generate a new unique application ID in the format APP-YYYY-NNNNN.
 * Counter persists in localStorage so IDs are monotonically increasing
 * within the same browser.
 */
function generateAppId() {
  const year = new Date().getFullYear();
  const raw = parseInt(localStorage.getItem(APP_ID_STORAGE_KEY) || '0', 10);
  const next = raw + 1;
  localStorage.setItem(APP_ID_STORAGE_KEY, String(next));
  return `APP-${year}-${String(next).padStart(5, '0')}`;
}

// ── Draft Management ──────────────────────────────────────────

const DRAFT_PREFIX = 'rop_draft_';

/** Save draft data for a given role key. */
function saveDraft(roleKey, data) {
  try {
    localStorage.setItem(DRAFT_PREFIX + roleKey, JSON.stringify({ data, savedAt: Date.now() }));
  } catch (_) { /* Ignore QuotaExceededError */ }
}

/** Load a saved draft for a role key. Returns {data, savedAt} or null. */
function loadDraft(roleKey) {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + roleKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

/** Remove saved draft for a role key. */
function clearDraft(roleKey) {
  localStorage.removeItem(DRAFT_PREFIX + roleKey);
}

/** Check whether any draft exists for any role. */
function hasDraft(roleKey) {
  return localStorage.getItem(DRAFT_PREFIX + roleKey) !== null;
}

// ── Anti-Spam ──────────────────────────────────────────────────

const COOLDOWN_KEY      = 'rop_last_submit';
const SUBMITTED_IDS_KEY = 'rop_submitted_ids';
const COOLDOWN_MS       = 24 * 60 * 60 * 1000; // 24 hours

/** Returns true if the user is still within the submission cooldown window. */
function isOnCooldown() {
  const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
  return Date.now() - last < COOLDOWN_MS;
}

/** Returns remaining cooldown time in a human-readable format. */
function getCooldownRemaining() {
  const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
  const remaining = COOLDOWN_MS - (Date.now() - last);
  if (remaining <= 0) return null;
  const hours = Math.floor(remaining / 3_600_000);
  const mins  = Math.floor((remaining % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/** Record a submission timestamp to start the cooldown timer. */
function recordCooldown() {
  localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
}

/** Returns true if the given Discord ID has already submitted from this browser. */
function isDuplicateId(discordId) {
  try {
    const ids = JSON.parse(localStorage.getItem(SUBMITTED_IDS_KEY) || '[]');
    return ids.includes(discordId);
  } catch (_) { return false; }
}

/** Record a Discord ID as having submitted. */
function recordSubmittedId(discordId) {
  try {
    const ids = JSON.parse(localStorage.getItem(SUBMITTED_IDS_KEY) || '[]');
    if (!ids.includes(discordId)) {
      ids.push(discordId);
      localStorage.setItem(SUBMITTED_IDS_KEY, JSON.stringify(ids));
    }
  } catch (_) {}
}

// ── Submission History (for Dashboard) ────────────────────────

const HISTORY_KEY = 'rop_submission_history';

/** Add a submission record to the local history log. */
function recordSubmission(record) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.push({ ...record, timestamp: Date.now() });
    // Keep last 500 submissions to avoid localStorage bloat
    if (history.length > 500) history.splice(0, history.length - 500);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (_) {}
}

/** Retrieve the full submission history. */
function getSubmissionHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch (_) { return []; }
}

/** Update the status of an existing submission in history by appId. */
function updateSubmissionStatus(appId, newStatus, reviewerName, note) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = history.find(h => h.appId === appId);
    if (entry) {
      entry.status = newStatus;
      entry.reviewerName = reviewerName;
      entry.note = note || entry.note;
      entry.updatedAt = Date.now();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (_) {}
}

// ── Reviewer Activity Log ──────────────────────────────────────

const ACTIVITY_LOG_KEY = 'rop_activity_log';

/** Append a reviewer action to the activity log. */
function logReviewerActivity(action) {
  try {
    const log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
    log.unshift({ ...action, at: Date.now() });
    if (log.length > 200) log.splice(200);
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
  } catch (_) {}
}

/** Retrieve the reviewer activity log. */
function getActivityLog() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
  } catch (_) { return []; }
}

// ── Formatting Helpers ─────────────────────────────────────────



/** Format a UTC timestamp as a relative time string (e.g. "2 hours ago"). */
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60_000)        return 'just now';
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000)   return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Format a Discord embed field value with truncation. */
function formatEmbedValue(val, maxLen = 300) {
  const text = String(val ?? 'N/A').trim() || 'N/A';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '… *(truncated — view full answer in portal)*';
}

/** Return a safe non-empty string for Discord embed field values. */
function safeVal(v) {
  const s = String(v ?? '').trim();
  return s !== '' ? s : 'N/A';
}

/** Status config lookup table. */
const STATUS_CONFIG = {
  'pending':      { label: 'Pending Review',  color: '#5865f2', emoji: '🕐', discordColor: 5793266 },
  'under_review': { label: 'Under Review',    color: '#f0a500', emoji: '🔍', discordColor: 15729920 },
  'interview':    { label: 'Interview',       color: '#9b59b6', emoji: '🎤', discordColor: 10181046 },
  'accepted':     { label: 'Accepted',        color: '#248046', emoji: '✅', discordColor: 3066993 },
  'rejected':     { label: 'Rejected',        color: '#da373c', emoji: '❌', discordColor: 15158332 }
};
