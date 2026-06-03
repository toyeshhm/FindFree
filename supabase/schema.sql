-- FindFree — Idempotent Migration
-- Safe to run multiple times. Creates everything if missing, skips if already present.

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Anonymous' CHECK (length(name) <= 80),
  avatar_url    TEXT,
  message_count INT  DEFAULT 0,
  push_token    TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  push_radius_miles INT DEFAULT 10,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  category    TEXT DEFAULT 'other',
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  address     TEXT,
  photo_urls  TEXT[] DEFAULT '{}',
  source      TEXT NOT NULL DEFAULT 'user',
  source_id   TEXT,
  source_url  TEXT,
  deal_type   TEXT,
  code        TEXT,
  tags        TEXT[] DEFAULT '{}',
  business_name TEXT,
  claim_instructions TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'available'
              CHECK (status IN ('available','claimed','deleted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS items_location_idx ON items USING GIST(ST_Point(lng, lat));
CREATE INDEX IF NOT EXISTS items_status_idx   ON items (status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_items_user_id  ON items (user_id);

CREATE TABLE IF NOT EXISTS saved_items (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    UUID REFERENCES items(id)      ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_id ON saved_items (item_id);

CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          UUID REFERENCES items(id)      ON DELETE CASCADE,
  requester_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poster_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ,
  requester_unread INT DEFAULT 0,
  poster_unread    INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, requester_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_item_id ON conversations (item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_requester_id ON conversations (requester_id);
CREATE INDEX IF NOT EXISTS idx_conversations_poster_id ON conversations (poster_id);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES auth.users(id)    ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_users_to_notify(
  item_lat DOUBLE PRECISION,
  item_lng DOUBLE PRECISION,
  poster_id UUID
)
RETURNS TABLE (
  id UUID,
  push_token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.push_token
  FROM user_profiles u
  WHERE u.push_token IS NOT NULL
    AND u.id != poster_id
    AND u.lat IS NOT NULL
    AND u.lng IS NOT NULL
    -- ST_DistanceSphere returns meters. (1 mile = 1609.34 meters)
    AND (ST_DistanceSphere(ST_Point(u.lng, u.lat), ST_Point(item_lng, item_lat)) / 1609.34) <= COALESCE(u.push_radius_miles, 10);
END;
$$;

-- Only the service-role key (used by the edge function) should call this.
-- Prevents authenticated users from enumerating push tokens of nearby users.
REVOKE EXECUTE ON FUNCTION get_users_to_notify(DOUBLE PRECISION, DOUBLE PRECISION, UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_users_to_notify(DOUBLE PRECISION, DOUBLE PRECISION, UUID) TO service_role;

-- Auto-create user_profiles row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(substring(NEW.raw_user_meta_data->>'name', 1, 80), 'Anonymous')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation metadata whenever a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET last_message     = NEW.body,
      last_message_at  = NEW.created_at,
      requester_unread = CASE
        WHEN NEW.sender_id = poster_id    THEN requester_unread + 1
        ELSE requester_unread
      END,
      poster_unread    = CASE
        WHEN NEW.sender_id = requester_id THEN poster_unread + 1
        ELSE poster_unread
      END,
      updated_at       = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ─── Nearby Items RPC ─────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS get_nearby_items(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, INT);

CREATE OR REPLACE FUNCTION get_nearby_items(
  user_lat       DOUBLE PRECISION,
  user_lng       DOUBLE PRECISION,
  radius_km      DOUBLE PRECISION DEFAULT 10,
  category       TEXT             DEFAULT NULL,
  max_age_hours  INT              DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  description TEXT,
  category    TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  address     TEXT,
  photo_urls  TEXT[],
  source      TEXT,
  source_id   TEXT,
  source_url  TEXT,
  deal_type   TEXT,
  code        TEXT,
  tags        TEXT[],
  business_name TEXT,
  claim_instructions TEXT,
  user_id     UUID,
  status      TEXT,
  created_at  TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
)
LANGUAGE SQL STABLE AS $$
  SELECT
    i.id, i.title, i.description, i.category,
    i.lat, i.lng, i.address,
    i.photo_urls, i.source, i.source_id,
    i.source_url, i.deal_type, i.code, i.tags, i.business_name, i.claim_instructions,
    i.user_id, i.status, i.created_at, i.expires_at,
    CASE 
      WHEN i.lat IS NULL OR i.lng IS NULL THEN 0.0
      ELSE ST_Distance(
        ST_Point(i.lng, i.lat)::geography,
        ST_Point(user_lng, user_lat)::geography
      ) / 1000.0
    END AS distance_km
  FROM items i
  WHERE
    i.status = 'available'
    AND (
      (i.lat IS NULL OR i.lng IS NULL) OR
      ST_DWithin(
        ST_Point(i.lng, i.lat)::geography,
        ST_Point(user_lng, user_lat)::geography,
        radius_km * 1000
      )
    )
    AND (get_nearby_items.category IS NULL OR i.category = get_nearby_items.category)
    AND (max_age_hours IS NULL OR i.created_at > NOW() - (max_age_hours * INTERVAL '1 hour'))
    AND (i.expires_at IS NULL OR i.expires_at > NOW())
  ORDER BY distance_km ASC
  LIMIT 100;
$$;

-- ─── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- user_profiles
DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "profiles_update" ON user_profiles;

CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- items
DROP POLICY IF EXISTS "items_select" ON items;
DROP POLICY IF EXISTS "items_insert" ON items;
DROP POLICY IF EXISTS "items_update" ON items;

CREATE POLICY "items_select" ON items FOR SELECT USING (status != 'deleted');
CREATE POLICY "items_insert" ON items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "items_update" ON items FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- saved_items
DROP POLICY IF EXISTS "saved_select" ON saved_items;
DROP POLICY IF EXISTS "saved_insert" ON saved_items;
DROP POLICY IF EXISTS "saved_delete" ON saved_items;

CREATE POLICY "saved_select" ON saved_items FOR SELECT USING  (auth.uid() = user_id);
CREATE POLICY "saved_insert" ON saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_delete" ON saved_items FOR DELETE USING  (auth.uid() = user_id);

-- conversations
DROP POLICY IF EXISTS "conv_select" ON conversations;
DROP POLICY IF EXISTS "conv_insert" ON conversations;

CREATE POLICY "conv_select" ON conversations FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = poster_id);
CREATE POLICY "conv_insert" ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND auth.uid() <> poster_id
    AND poster_id = (
      SELECT i.user_id FROM items i
      WHERE i.id = item_id AND i.status = 'available'
    )
  );

-- messages
DROP POLICY IF EXISTS "msg_select" ON messages;
DROP POLICY IF EXISTS "msg_insert" ON messages;

CREATE POLICY "msg_select" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.requester_id = auth.uid() OR c.poster_id = auth.uid())
    )
  );
CREATE POLICY "msg_insert" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.requester_id = auth.uid() OR c.poster_id = auth.uid())
    )
  );

-- ─── Storage bucket for item photos ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "item_photos_select"  ON storage.objects;
DROP POLICY IF EXISTS "item_photos_insert"  ON storage.objects;
DROP POLICY IF EXISTS "item_photos_delete"  ON storage.objects;

CREATE POLICY "item_photos_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'item-photos');

-- Require uploads to live under the uploader's own user-id folder
-- (e.g. item-photos/<user-id>/filename.jpg) so users can't overwrite each other's files.
CREATE POLICY "item_photos_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only allow deleting objects you own (owner is set by Supabase on upload).
CREATE POLICY "item_photos_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'item-photos' AND owner = auth.uid());
