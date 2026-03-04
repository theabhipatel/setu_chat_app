# Project Rules — Setu Chat App

## General
- This project is in **active development** — do NOT add backward compatibility layers, migration shims, or legacy fallbacks.
- When making database schema changes, modify the schema directly. No need to preserve old columns/constraints for existing data.
- Use **Tailwind CSS** for all styling. Only write manual CSS when Tailwind genuinely cannot achieve the desired effect.

## Tech Stack
- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS (do NOT use plain CSS classes unless absolutely necessary)
- **Database:** Supabase (PostgreSQL) — use service client for API routes
- **Storage:** Supabase Storage (bucket: `chat-files` for attachments)
- **State Management:** Zustand (`useChatStore`, `useAuthStore`)

## Code Style
- Use `"use client"` directive for client components
- Prefer functional components with hooks
- Use `lucide-react` for icons
- Use `next/image` for optimized images
- Use `next/dynamic` for lazy loading heavy components
- Prefer optimistic UI updates with rollback on failure
- Toast notifications via `@/stores/useToastStore`
