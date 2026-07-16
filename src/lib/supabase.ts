import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Инициализирует или возвращает клиент Supabase
 */
export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const finalUrl = url || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const finalKey = anonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (!finalUrl || !finalKey) {
    return null;
  }

  try {
    supabaseInstance = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Ошибка инициализации Supabase:', error);
    return null;
  }
}

/**
 * Сбрасывает текущий инстанс Supabase клиента
 */
export function resetSupabaseClient() {
  supabaseInstance = null;
}

/**
 * Полный SQL скрипт для развертывания структуры в Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- GIT X: ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ ДЛЯ SUPABASE (POSTGRESQL)
-- Скопируйте и запустите этот скрипт в SQL Editor вашего проекта Supabase
-- ====================================================================

-- 1. СБРОС ТАБЛИЦ (ЕСЛИ СУЩЕСТВУЮТ)
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS snippets CASCADE;
-- DROP TABLE IF EXISTS notes CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS ai_services CASCADE;
-- DROP TABLE IF EXISTS encrypted_keys CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 2. ТАБЛИЦА ПРОФИЛЕЙ (СВЯЗАНА С AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ТАБЛИЦА ШИФРОВАННЫХ КЛЮЧЕЙ И ТОКЕНОВ
CREATE TABLE IF NOT EXISTS public.encrypted_keys (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    openai_key_enc TEXT,
    gemini_key_enc TEXT,
    github_token_enc TEXT,
    vercel_token_enc TEXT,
    supabase_service_key_enc TEXT,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ТАБЛИЦА ПРОЕКТОВ
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    repository_url TEXT,
    website_url TEXT,
    status TEXT DEFAULT 'active'::text CHECK (status IN ('active', 'completed', 'archived', 'planned')),
    priority TEXT DEFAULT 'medium'::text CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    finish_date DATE,
    color TEXT DEFAULT '#10B981'::text,
    tags TEXT[] DEFAULT '{}'::text[],
    technologies TEXT[] DEFAULT '{}'::text[],
    last_work_note TEXT,
    todo_checklist JSONB DEFAULT '[]'::jsonb,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ТАБЛИЦА ЗАДАЧ
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo'::text CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT DEFAULT 'medium'::text CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    deadline TIMESTAMP WITH TIME ZONE,
    reminder BOOLEAN DEFAULT false,
    labels TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ТАБЛИЦА ЗАМЕТОК
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    folder TEXT DEFAULT 'Черновики'::text,
    is_pinned BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ТАБЛИЦА СНИППЕТОВ КОДА
CREATE TABLE IF NOT EXISTS public.snippets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'javascript'::text,
    tags TEXT[] DEFAULT '{}'::text[],
    description TEXT,
    code TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ТАБЛИЦА СЕРВИСОВ ИИ
CREATE TABLE IF NOT EXISTS public.ai_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Опционально (null для дефолтных глобальных сервисов)
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('chat', 'coding', 'image', 'video', 'music', 'search', 'agents', 'productivity')),
    description TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ТАБЛИЦА ЛОГОВ АКТИВНОСТИ
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ТАБЛИЦА НАСТРОЕК
CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'dark'::text,
    language TEXT DEFAULT 'ru'::text,
    notifications_enabled BOOLEAN DEFAULT true,
    offline_cache_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON public.snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id_created ON public.activity_logs(user_id, created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) ПОЛИТИКИ БЕЗОПАСНОСТИ
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can view any profile" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Политики для encrypted_keys
CREATE POLICY "Users can manage their own keys" ON public.encrypted_keys FOR ALL USING (auth.uid() = user_id);

-- Политики для projects
CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- Политики для tasks
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- Политики для notes
CREATE POLICY "Users can manage their own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Политики для snippets
CREATE POLICY "Users can manage their own snippets" ON public.snippets FOR ALL USING (auth.uid() = user_id);

-- Политики для ai_services
CREATE POLICY "Users can view default and their custom AI services" ON public.ai_services 
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can manage their custom AI services" ON public.ai_services 
    FOR ALL USING (auth.uid() = user_id);

-- Политики для activity_logs
CREATE POLICY "Users can manage their own logs" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

-- Политики для settings
CREATE POLICY "Users can manage their own settings" ON public.settings FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- ТРИГГЕРЫ И ФУНКЦИИ ДЛЯ АВТОМАТИЗАЦИИ СИНХРОНИЗАЦИИ
-- ====================================================================

-- 1. Автоматическое создание профиля и настроек при регистрации в Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_username TEXT;
BEGIN
    v_username := split_part(new.email, '@', 1) || '_' || substring(md5(random()::text) from 1 for 4);
    
    INSERT INTO public.profiles (id, name, username, email, avatar_url, bio)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        v_username,
        new.email,
        new.raw_user_meta_data->>'avatar_url',
        'Пользователь Git X'
    );

    INSERT INTO public.settings (user_id, theme, language, notifications_enabled, offline_cache_enabled)
    VALUES (new.id, 'dark', 'ru', true, true);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ХРАНИЛИЩЕ ХОСТИНГА (STORAGE BUCKETS)
-- ====================================================================
-- Запустите данный блок для создания бакетов через Supabase API, либо вручную в Storage:
-- Имя бакета: "avatars" (публичный)
-- Имя бакета: "project_files" (приватный)
`;
