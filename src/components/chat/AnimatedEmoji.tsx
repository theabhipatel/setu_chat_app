"use client";

import { useState } from "react";
import { emojiToNotoAnimatedUrl } from "@/lib/emoji";

interface AnimatedEmojiProps {
  emoji: string;
  size?: number;
}

export function AnimatedEmoji({ emoji, size = 80 }: AnimatedEmojiProps) {
  const [useFallback, setUseFallback] = useState(false);
  const notoUrl = emojiToNotoAnimatedUrl(emoji);

  if (useFallback) {
    // Fallback: large static emoji with bounce animation
    return (
      <span
        className="animated-emoji-bounce"
        style={{ fontSize: `${size}px`, lineHeight: 1 }}
      >
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={notoUrl}
      alt={emoji}
      width={size}
      height={size}
      className="animated-emoji-pop"
      onError={() => setUseFallback(true)}
      draggable={false}
    />
  );
}
