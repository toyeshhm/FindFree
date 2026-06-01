-- FindFree — Supabase Schema
-- Apply in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).
-- Run schema.sql first, then seed.sql for development data.

-- Enable PostGIS (must be done first)
CREATE EXTENSION IF NOT EXISTS postgis;

-- User profiles (extends auth.users — created automatically on sign-up via trigger)
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_url  TEXT,
  message_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Items
CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  category    TEXT DEFAULT 'other'
              CHECK (category IN ('furniture','electronics','clothing','books','kitchen','sports','toys','other')),
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  address     TEXT,
  photo_urls  TEXT[] DEFAULT '{}',
  source      TEXT NOT NULL DEFAULT 'user'
              CHECK (source IN ('user','facebook','craigslist','buynot')),
  source_id   TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'available'
              CHECK (status IN ('available','claimed','deleted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX items_location_idx ON items
  USING GIST(ST_Point(lng, lat));

-- Saved items (junction table)
CREATE TABLE saved_items (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    UUID REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- Conversations (one per item + requester pair)
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID REFERENCES items(id) ON DELETE CASCADE,
  requester_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poster_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, requester_id)
);

-- Messages
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET last_message = NEW.body,
      last_message_at = NEW.created_at,
      unread_count = unread_count + 1,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Nearby items RPC (uses PostGIS)
CREATE OR REPLACE FUNCTION get_nearby_items(
  user_lat       DOUBLE PRECISION,
  user_lng       DOUBLE PRECISION,
  radius_km      DOUBLE PRECISION DEFAULT 10,
  category       TEXT DEFAULT NULL,
  max_age_hours  INT  DEFAULT NULL
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
    i.user_id, i.status, i.created_at, i.expires_at,
    ST_Distance(
      ST_Point(i.lng, i.lat)::geography,
      ST_Point(user_lng, user_lat)::geography
    ) / 1000.0 AS distance_km
  FROM items i
  WHERE
    i.status = 'available'
    AND ST_DWithin(
      ST_Point(i.lng, i.lat)::geography,
      ST_Point(user_lng, user_lat)::geography,
      radius_km * 1000
    )
    AND (get_nearby_items.category IS NULL OR i.category = get_nearby_items.category)
    AND (max_age_hours IS NULL OR i.created_at > NOW() - (max_age_hours || ' hours')::INTERVAL)
  ORDER BY distance_km
  LIMIT 100;
$$;

-- Row-level security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- user_profiles: anyone can read, only owner can write
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- items: anyone can read available items, signed-in users can insert, only owner can update/delete
CREATE POLICY "items_select" ON items FOR SELECT USING (status != 'deleted');
CREATE POLICY "items_insert" ON items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "items_update" ON items FOR UPDATE USING (auth.uid() = user_id);

-- saved_items: only own saves
CREATE POLICY "saved_select" ON saved_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_insert" ON saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_delete" ON saved_items FOR DELETE USING (auth.uid() = user_id);

-- conversations: participants only
CREATE POLICY "conv_select" ON conversations FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = poster_id);
CREATE POLICY "conv_insert" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- messages: conversation participants only
CREATE POLICY "msg_select" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c WHERE c.id = conversation_id
      AND (c.requester_id = auth.uid() OR c.poster_id = auth.uid())
    )
  );
CREATE POLICY "msg_insert" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c WHERE c.id = conversation_id
      AND (c.requester_id = auth.uid() OR c.poster_id = auth.uid())
    )
  );
