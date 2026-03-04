const STORAGE_KEY = "setu_drafts";

/**
 * Get all drafts from localStorage, keyed by conversationId.
 */
function getAllDrafts(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Save the full drafts map back to localStorage.
 */
function saveAllDrafts(map: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Get draft message for a specific conversation.
 */
export function getDraft(conversationId: string): string {
  return getAllDrafts()[conversationId] || "";
}

/**
 * Save draft message for a conversation.
 * Empty string clears the draft.
 */
export function saveDraft(conversationId: string, content: string) {
  const map = getAllDrafts();

  if (content.trim()) {
    map[conversationId] = content;
  } else {
    delete map[conversationId];
  }

  saveAllDrafts(map);
}

/**
 * Clear draft for a specific conversation (e.g. after sending).
 */
export function clearDraft(conversationId: string) {
  const map = getAllDrafts();
  delete map[conversationId];
  saveAllDrafts(map);
}
