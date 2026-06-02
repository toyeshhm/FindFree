-- Run this exact file in your Supabase SQL Editor.

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('coupon', 'free-stuff', 'find')),
  body TEXT NOT NULL,
  coupon_code TEXT,
  coupon_claimed BOOLEAN DEFAULT FALSE,
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
CREATE POLICY "Anyone can claim coupons" ON community_posts FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON community_comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON community_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert likes" ON community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete likes" ON community_post_likes FOR DELETE USING (auth.uid() = user_id);

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
