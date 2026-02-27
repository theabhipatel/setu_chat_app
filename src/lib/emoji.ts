/**
 * Emoji detection and Google Noto Animated Emoji utilities
 */

/**
 * Detects if a message contains only emoji characters (1-3 emojis).
 * Uses Intl.Segmenter for accurate grapheme cluster segmentation.
 */
export function getEmojiInfo(text: string): {
  isEmojiOnly: boolean;
  count: number;
  emojis: string[];
} {
  const trimmed = text.trim();
  if (!trimmed) return { isEmojiOnly: false, count: 0, emojis: [] };

  try {
    // Intl.Segmenter accurately splits text into grapheme clusters
    // so compound emojis (ZWJ sequences, skin tones, flags) are treated as single units
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    const segments = Array.from(segmenter.segment(trimmed));
    const emojis: string[] = [];

    for (const { segment } of segments) {
      // Skip whitespace between emojis
      if (/^\s+$/.test(segment)) continue;

      // \p{Emoji_Presentation} — characters rendered as emoji by default (😀, 🔥, etc.)
      // \p{Extended_Pictographic} with length > 1 — text emojis with VS16 or modifiers (❤️, ☺️)
      if (
        /\p{Emoji_Presentation}/u.test(segment) ||
        (/\p{Extended_Pictographic}/u.test(segment) && segment.length > 1)
      ) {
        emojis.push(segment);
      } else {
        // Non-emoji character found — not emoji-only
        return { isEmojiOnly: false, count: 0, emojis: [] };
      }
    }

    return {
      isEmojiOnly: emojis.length > 0 && emojis.length <= 3,
      count: emojis.length,
      emojis,
    };
  } catch {
    // Fallback for environments without Intl.Segmenter
    const emojiRegex =
      /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\p{Emoji_Modifier}|\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;
    const matches = trimmed.match(emojiRegex);

    if (!matches) return { isEmojiOnly: false, count: 0, emojis: [] };

    // Verify the entire string is only emojis
    const stripped = trimmed.replace(emojiRegex, "").trim();
    if (stripped.length > 0)
      return { isEmojiOnly: false, count: 0, emojis: [] };

    return {
      isEmojiOnly: matches.length <= 3,
      count: matches.length,
      emojis: matches,
    };
  }
}

/**
 * Converts an emoji character to a Google Noto Animated Emoji CDN URL.
 * The animated .webp will show the "live" animation (heartbeat, wave, flicker, etc.)
 */
export function emojiToNotoAnimatedUrl(emoji: string): string {
  const codepoints = Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16).toLowerCase())
    .join("_");

  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoints}/512.webp`;
}

/**
 * Returns emoji size based on count:
 * 1 emoji → 80px, 2 emojis → 64px, 3 emojis → 52px
 */
export function getEmojiSize(count: number): number {
  if (count === 1) return 80;
  if (count === 2) return 64;
  return 52;
}
