-- Run this exact file in your Supabase SQL Editor.

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('coupon', 'free-stuff', 'find')),
  body TEXT NOT NULL,
  coupon_code TEXT,
  coupon_claimed BOOLEAN DEFAULT FALSE,
  claimed_by UUID REFERENCES auth.users ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_post_likes (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view community posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert community posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON community_posts FOR DELETE USING (auth.uid() = user_id);
-- Coupon claiming is handled via claim_coupon() SECURITY DEFINER function below.
-- No open UPDATE policy — unrestricted UPDATE USING(true) lets any authenticated
-- user overwrite any column on any row.

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON community_comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON community_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert likes" ON community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete likes" ON community_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Atomically claims a coupon post. Guards:
--   1. Caller must be authenticated.
--   2. Idempotent: WHERE coupon_claimed = false prevents double-claiming.
--   3. Records who claimed it and when for audit purposes.
-- SECURITY DEFINER bypasses RLS for this one targeted write only.
CREATE OR REPLACE FUNCTION claim_coupon(post_id UUID) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE community_posts
  SET coupon_claimed = true,
      claimed_by     = auth.uid(),
      claimed_at     = now()
  WHERE id = post_id
    AND coupon_claimed = false;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_coupon(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION claim_coupon(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION increment_like_count(row_id UUID) RETURNS void AS $$
BEGIN
  UPDATE community_posts SET like_count = like_count + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count(row_id UUID) RETURNS void AS $$
BEGIN
  UPDATE community_posts SET like_count = like_count - 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_count(row_id UUID) RETURNS void AS $$
BEGIN
  UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
