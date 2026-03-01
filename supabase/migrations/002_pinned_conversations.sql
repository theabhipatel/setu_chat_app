-- ============================================
-- Pin Conversations Feature
-- Adds pinned_at column to conversation_members
-- ============================================

-- Add pinned_at column (nullable — null means not pinned)
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient pinned conversation queries
CREATE INDEX IF NOT EXISTS idx_conversation_members_pinned
  ON public.conversation_members(user_id, pinned_at)
  WHERE pinned_at IS NOT NULL;

-- Allow users to update their own membership row (for pinning)
CREATE POLICY "Users can update own membership" ON public.conversation_members
  FOR UPDATE USING (user_id = auth.uid());
