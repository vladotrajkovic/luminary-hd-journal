-- ============================================
-- HUMAN DESIGN JOURNAL - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  -- Human Design Core Data
  hd_type TEXT CHECK (hd_type IN ('Manifestor', 'Generator', 'Manifesting Generator', 'Projector', 'Reflector')),
  hd_authority TEXT CHECK (hd_authority IN (
    'Sacral', 'Emotional/Solar Plexus', 'Splenic', 'Ego/Heart',
    'G Center/Self', 'Mental/Environment', 'Lunar', 'None/Outer Authority'
  )),
  hd_profile TEXT, -- e.g. "1/3", "2/4", "5/1", etc.
  hd_definition TEXT CHECK (hd_definition IN ('Single', 'Split', 'Triple Split', 'Quadruple Split')),
  hd_incarnation_cross TEXT,
  birth_date DATE,
  birth_time TIME,
  birth_city TEXT,
  birth_country TEXT,
  -- Defined/Open Centers (stored as JSON array of defined centers)
  defined_centers JSONB DEFAULT '[]',
  -- Gates and Channels
  active_gates JSONB DEFAULT '[]',
  active_channels JSONB DEFAULT '[]',
  -- Profile notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOURNAL ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  -- Main journal sections
  morning_reflection TEXT,
  strategy_check TEXT,       -- Did I follow my strategy today?
  authority_check TEXT,      -- Did I honor my authority?
  open_centers_log TEXT,     -- What did I amplify from open centers?
  deconditioning_notes TEXT, -- Noticing Not-Self theme
  body_awareness TEXT,       -- Sacral response / body signals
  synchronicities TEXT,      -- Moments of alignment
  gratitude TEXT,
  evening_reflection TEXT,
  -- HD-specific fields
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  followed_strategy BOOLEAN,
  mood_tags JSONB DEFAULT '[]',  -- array of mood strings
  gate_of_the_day TEXT,
  -- Metadata
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOON & TRANSIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  moon_phase TEXT,
  current_gate TEXT,
  transit_notes TEXT,
  how_i_felt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CENTERS REFLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS center_reflections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  center_name TEXT NOT NULL,
  is_defined BOOLEAN NOT NULL,
  conditioning_patterns TEXT,
  gifts_noticed TEXT,
  reflection_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_reflections ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Journal policies
CREATE POLICY "Users can CRUD own journal entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Transit log policies
CREATE POLICY "Users can CRUD own transit logs" ON transit_logs FOR ALL USING (auth.uid() = user_id);

-- Center reflection policies
CREATE POLICY "Users can CRUD own center reflections" ON center_reflections FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
