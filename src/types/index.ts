export interface Profile {
  id: string;
  avatar_url?: string;
  banner_url?: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  location?: string;
  country?: string;
  city?: string;
  website?: string;
  github?: string;
  telegram?: string;
  discord?: string;
  x?: string;
  linkedin?: string;
  skills?: string[];
  tech_stack?: string[];
  experience?: string;
  joined_date?: string;
  created_at: string;
}

export type ProjectStatus = 'active' | 'completed' | 'archived' | 'planned';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  repository_url?: string;
  website_url?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  start_date?: string;
  finish_date?: string;
  color: string;
  tags: string[];
  technologies: string[];
  last_work_note?: string;
  todo_checklist: { text: string; done: boolean }[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  reminder?: boolean;
  labels: string[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  folder?: string;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  language: string;
  tags: string[];
  description?: string;
  code: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type AIServiceCategory = 'chat' | 'coding' | 'image' | 'video' | 'music' | 'search' | 'agents' | 'productivity';

export interface AIService {
  id: string;
  name: string;
  url: string;
  category: AIServiceCategory;
  description: string;
  is_favorite: boolean;
  is_custom?: boolean;
  user_id?: string;
  created_at?: string;
}

export interface ConnectionInfo {
  connected: boolean;
  username?: string;
  avatar_url?: string;
  error?: string;
}

export interface GitHubConnection {
  user_id: string;
  token: string;
  username?: string;
  avatar_url?: string;
  connected_at: string;
}

export interface VercelConnection {
  user_id: string;
  token: string;
  username?: string;
  connected_at: string;
}

export interface SupabaseConnection {
  user_id: string;
  project_url: string;
  anon_key: string;
  service_role_key: string; // Будет зашифрован
  project_name?: string;
  connected_at: string;
}

export interface EncryptedKeys {
  user_id: string;
  openai_key_enc?: string;
  gemini_key_enc?: string;
  github_token_enc?: string;
  vercel_token_enc?: string;
  supabase_service_key_enc?: string;
  salt: string;
  iv: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string; // 'create_project', 'update_task', 'ai_chat', etc.
  description: string;
  metadata?: any;
  created_at: string;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  item_type: 'project' | 'note' | 'snippet' | 'ai_service';
  item_id: string;
  created_at: string;
}

export interface AppSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: 'ru';
  notifications_enabled: boolean;
  offline_cache_enabled: boolean;
  updated_at: string;
}

export interface UserFile {
  id: string;
  user_id: string;
  name: string;
  folder_id: string | null;
  size: number;
  type: string;
  url?: string;
  is_favorite: boolean;
  is_in_trash: boolean;
  created_at: string;
  updated_at: string;
  content?: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  is_in_trash: boolean;
  created_at: string;
  updated_at: string;
}
