import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Profile, Project, Task, Note, Snippet, AIService, ActivityLog, AppSettings,
  ProjectStatus, ProjectPriority, TaskStatus, TaskPriority, AIServiceCategory,
  UserFile, Folder
} from '../types';
import { getSupabaseClient, resetSupabaseClient } from '../lib/supabase';

interface AppContextProps {
  isOffline: boolean;
  currentUser: Profile | null;
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  snippets: Snippet[];
  files: UserFile[];
  folders: Folder[];
  aiServices: AIService[];
  activityLogs: ActivityLog[];
  settings: AppSettings;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Auth actions
  registerUser: (name: string, email: string, password: string) => Promise<boolean>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => void;
  updateProfile: (updates: Partial<Profile>) => void;
  deleteAccount: () => void;
  // Project actions
  addProject: (p: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // Task actions
  addTask: (t: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // Note actions
  addNote: (n: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  // Snippet actions
  addSnippet: (s: Omit<Snippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateSnippet: (id: string, updates: Partial<Snippet>) => void;
  deleteSnippet: (id: string) => void;
  // File and Folder actions
  addFile: (f: Omit<UserFile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateFile: (id: string, updates: Partial<UserFile>) => void;
  deleteFile: (id: string) => void;
  addFolder: (f: Omit<Folder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  // AI Service actions
  addAIService: (s: Omit<AIService, 'id' | 'is_favorite'>) => void;
  updateAIService: (id: string, updates: Partial<AIService>) => void;
  deleteAIService: (id: string) => void;
  toggleFavoriteService: (id: string) => void;
  // App settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  addActivityLog: (actionType: string, description: string, metadata?: any) => void;
  clearActivityLogs: () => void;
  // Backup
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  testSupabaseConnection: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Список ИИ сервисов по умолчанию
const DEFAULT_AI_SERVICES: AIService[] = [
  { id: '1', name: 'Gemini', url: 'https://gemini.google.com', category: 'chat', description: 'Мультимодальный ИИ от Google', is_favorite: true },
  { id: '2', name: 'Lovable', url: 'https://lovable.dev', category: 'coding', description: 'Супербыстрый ИИ генератор веб-приложений', is_favorite: true },
  { id: '3', name: 'ChatGPT', url: 'https://chatgpt.com', category: 'chat', description: 'Популярный ИИ от OpenAI', is_favorite: true },
  { id: '4', name: 'Claude', url: 'https://claude.ai', category: 'chat', description: 'Продвинутый ИИ с фокусом на логику и код от Anthropic', is_favorite: true },
  { id: '5', name: 'DeepSeek', url: 'https://deepseek.com', category: 'chat', description: 'Высокопроизводительный открытый ИИ', is_favorite: false },
  { id: '6', name: 'Cursor', url: 'https://cursor.com', category: 'coding', description: 'Ультрасовременный редактор кода со встроенным ИИ', is_favorite: false },
  { id: '7', name: 'Bolt', url: 'https://bolt.new', category: 'coding', description: 'Интерфейс для генерации полноценных Full Stack приложений', is_favorite: false },
  { id: '8', name: 'Perplexity', url: 'https://perplexity.ai', category: 'search', description: 'Поисковый ИИ-движок, дающий ответы с источниками', is_favorite: false },
  { id: '9', name: 'Grok', url: 'https://grok.x.ai', category: 'search', description: 'Революционный ИИ от xAI Илона Маска', is_favorite: false },
  { id: '10', name: 'Qwen', url: 'https://qwen.ai', category: 'chat', description: 'Мощное семейство моделей от Alibaba Cloud', is_favorite: false },
  { id: '11', name: 'GitHub Copilot', url: 'https://github.com/features/copilot', category: 'coding', description: 'Умный автокомплит кода для разработчиков', is_favorite: false },
  { id: '12', name: 'Vercel AI', url: 'https://vercel.com/ai', category: 'productivity', description: 'Инструменты разработки интерфейсов на базе ИИ', is_favorite: false }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [aiServices, setAiServices] = useState<AIService[]>(DEFAULT_AI_SERVICES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<AppSettings>({
    user_id: 'local_user',
    theme: 'dark',
    language: 'ru',
    notifications_enabled: true,
    offline_cache_enabled: true,
    updated_at: new Date().toISOString()
  });

  // Отслеживание онлайна
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Инициализация данных (загрузка из LocalStorage в качестве кэша/локального стейта)
  useEffect(() => {
    const cachedUser = localStorage.getItem('gitx_user');
    const cachedProjects = localStorage.getItem('gitx_projects');
    const cachedTasks = localStorage.getItem('gitx_tasks');
    const cachedNotes = localStorage.getItem('gitx_notes');
    const cachedSnippets = localStorage.getItem('gitx_snippets');
    const cachedFiles = localStorage.getItem('gitx_files');
    const cachedFolders = localStorage.getItem('gitx_folders');
    const cachedServices = localStorage.getItem('gitx_services');
    const cachedLogs = localStorage.getItem('gitx_logs');
    const cachedSettings = localStorage.getItem('gitx_settings');

    if (cachedFiles) {
      setFiles(JSON.parse(cachedFiles));
    }
    if (cachedFolders) {
      setFolders(JSON.parse(cachedFolders));
    }

    if (cachedUser) {
      setCurrentUser(JSON.parse(cachedUser));
    } else {
      // Создаем дефолтного пользователя
      const defUser: Profile = {
        id: 'local_user',
        name: 'Разработчик Git X',
        username: 'gitx_dev',
        email: 'developer@gitx.dev',
        bio: 'Git X — моё рабочее пространство для проектирования, заметок и ИИ.',
        created_at: new Date().toISOString()
      };
      setCurrentUser(defUser);
      localStorage.setItem('gitx_user', JSON.stringify(defUser));
    }

    if (cachedProjects) {
      setProjects(JSON.parse(cachedProjects));
    } else {
      // Инициализируем демо-проект
      const demoProject: Project = {
        id: 'demo-proj-1',
        user_id: 'local_user',
        name: 'Платформа Git X',
        description: 'Суперфункциональное PWA-приложение для объединения процессов разработки: менеджер проектов, Kanban, Markdown-заметки, Сниппеты кода, справочник ИИ-ассистентов с встроенными чатами OpenAI и Gemini, а также интеграция с GitHub и Vercel.',
        repository_url: 'https://github.com/developer/git-x',
        website_url: 'https://git-x.vercel.app',
        status: 'active',
        priority: 'urgent',
        progress: 75,
        start_date: '2026-07-01',
        finish_date: '2026-08-15',
        color: '#6366F1', // Indigo
        tags: ['PWA', 'React', 'Premium', 'AI'],
        technologies: ['React', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'Web Crypto API'],
        last_work_note: 'Спроектированы криптографические функции шифрования ключей на базе Web Crypto API.',
        todo_checklist: [
          { text: 'Реализовать криптографический сейф ключей', done: true },
          { text: 'Разработать Kanban доску для задач', done: true },
          { text: 'Добавить редактор заметок с Live Preview', done: true },
          { text: 'Интегрировать GitHub API & Vercel Webhooks', done: false },
          { text: 'Реализовать оффлайн-кэш сервис-воркера для PWA', done: false }
        ],
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProjects([demoProject]);
      localStorage.setItem('gitx_projects', JSON.stringify([demoProject]));
    }

    if (cachedTasks) {
      setTasks(JSON.parse(cachedTasks));
    } else {
      const demoTasks: Task[] = [
        { id: 't1', user_id: 'local_user', project_id: 'demo-proj-1', title: 'Добавить поддержку Markdown таблиц в редакторе заметок', description: 'Необходимо подключить плагины парсера и стилизовать таблицы под Notion', status: 'in_progress', priority: 'medium', deadline: '2026-07-20T18:00:00Z', reminder: true, labels: ['Заметки', 'Интерфейс'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 't2', user_id: 'local_user', project_id: 'demo-proj-1', title: 'Настроить Ролевую Политику Безопасности (RLS) в Supabase', description: 'Запретить доступ к чужим записям на уровне СУБД Postgres', status: 'todo', priority: 'high', deadline: '2026-07-25T12:00:00Z', reminder: true, labels: ['Безопасность', 'Бэкенд'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 't3', user_id: 'local_user', project_id: 'demo-proj-1', title: 'Зашифровать ИИ ключи на клиенте с помощью мастер-пароля', description: 'Разработать компонент Сейфа на базе Web Crypto API', status: 'done', priority: 'urgent', deadline: '2026-07-15T15:00:00Z', reminder: false, labels: ['Безопасность', 'Крипто'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ];
      setTasks(demoTasks);
      localStorage.setItem('gitx_tasks', JSON.stringify(demoTasks));
    }

    if (cachedNotes) {
      setNotes(JSON.parse(cachedNotes));
    } else {
      const demoNotes: Note[] = [
        {
          id: 'n1',
          user_id: 'local_user',
          title: 'Добро пожаловать в Git X 🚀',
          content: `## Добро пожаловать в Git X!

Это ваше персональное премиум-пространство для разработки.
Здесь объединены все инструменты:

1. **Менеджер проектов** — планируйте дорожные карты и ведите трекинг прогресса.
2. **Задачи Kanban** — двигайте карточки задач, планируйте в календаре.
3. **Редактор кода и Сниппеты** — храните важные фрагменты с подсветкой синтаксиса.
4. **Интерактивный ИИ** — общайтесь с ChatGPT и Gemini с использованием собственных ключей.

### Полезные шорткаты:
* **Ctrl + P** или **Cmd + P** — открыть быстрый глобальный поиск.
* **Ctrl + L** — мгновенно заблокировать сейф учетных данных.

*Создано с любовью к прекрасному дизайну.*`,
          folder: 'Руководство',
          is_pinned: true,
          tags: ['Старт', 'Инструкция'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setNotes(demoNotes);
      localStorage.setItem('gitx_notes', JSON.stringify(demoNotes));
    }

    if (cachedSnippets) {
      setSnippets(JSON.parse(cachedSnippets));
    } else {
      const demoSnippets: Snippet[] = [
        {
          id: 's1',
          user_id: 'local_user',
          title: 'Шифрование AES-GCM (Web Crypto)',
          language: 'typescript',
          tags: ['Crypto', 'Security'],
          description: 'Функция шифрования строки текста с использованием алгоритма AES-GCM и ключа шифрования на стороне браузера.',
          code: `async function encryptText(text: string, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  return await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    data
  );
}`,
          is_favorite: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setSnippets(demoSnippets);
      localStorage.setItem('gitx_snippets', JSON.stringify(demoSnippets));
    }

    if (cachedServices) {
      setAiServices(JSON.parse(cachedServices));
    } else {
      localStorage.setItem('gitx_services', JSON.stringify(DEFAULT_AI_SERVICES));
    }

    if (cachedLogs) {
      setActivityLogs(JSON.parse(cachedLogs));
    } else {
      const startLogs: ActivityLog[] = [
        { id: 'log1', user_id: 'local_user', action_type: 'system', description: 'Система инициализирована. Добро пожаловать в Git X!', created_at: new Date().toISOString() }
      ];
      setActivityLogs(startLogs);
      localStorage.setItem('gitx_logs', JSON.stringify(startLogs));
    }

    if (cachedSettings) {
      setSettings(JSON.parse(cachedSettings));
    }
  }, []);

  // Синхронизаторы с LocalStorage
  const syncProjects = (data: Project[]) => {
    setProjects(data);
    localStorage.setItem('gitx_projects', JSON.stringify(data));
  };

  const syncTasks = (data: Task[]) => {
    setTasks(data);
    localStorage.setItem('gitx_tasks', JSON.stringify(data));
  };

  const syncNotes = (data: Note[]) => {
    setNotes(data);
    localStorage.setItem('gitx_notes', JSON.stringify(data));
  };

  const syncSnippets = (data: Snippet[]) => {
    setSnippets(data);
    localStorage.setItem('gitx_snippets', JSON.stringify(data));
  };

  const syncServices = (data: AIService[]) => {
    setAiServices(data);
    localStorage.setItem('gitx_services', JSON.stringify(data));
  };

  const syncLogs = (data: ActivityLog[]) => {
    setActivityLogs(data);
    localStorage.setItem('gitx_logs', JSON.stringify(data));
  };

  const syncSettings = (data: AppSettings) => {
    setSettings(data);
    localStorage.setItem('gitx_settings', JSON.stringify(data));
    // Применяем тему к html элементу
    if (data.theme === 'dark' || (data.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Метод добавления логов активности
  const addActivityLog = (actionType: string, description: string, metadata?: any) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id || 'local_user',
      action_type: actionType,
      description,
      metadata,
      created_at: new Date().toISOString()
    };
    syncLogs([newLog, ...activityLogs].slice(0, 100)); // Сохраняем последние 100 логов
  };

  const clearActivityLogs = () => {
    syncLogs([]);
  };

  // Auth actions
  const registerUser = async (name: string, email: string, password: string): Promise<boolean> => {
    // В оффлайн/демо-режиме регистрируем локально
    const newUser: Profile = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      username: email.split('@')[0],
      email,
      bio: 'Новый участник Git X',
      joined_date: new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
      created_at: new Date().toISOString()
    };
    
    // Clear everything so the app is completely empty!
    setProjects([]);
    setTasks([]);
    setNotes([]);
    setSnippets([]);
    setFiles([]);
    setFolders([]);

    localStorage.setItem('gitx_projects', JSON.stringify([]));
    localStorage.setItem('gitx_tasks', JSON.stringify([]));
    localStorage.setItem('gitx_notes', JSON.stringify([]));
    localStorage.setItem('gitx_snippets', JSON.stringify([]));
    localStorage.setItem('gitx_files', JSON.stringify([]));
    localStorage.setItem('gitx_folders', JSON.stringify([]));

    setCurrentUser(newUser);
    localStorage.setItem('gitx_user', JSON.stringify(newUser));
    addActivityLog('auth_register', `Зарегистрирован новый аккаунт: ${name} (${email})`);
    return true;
  };

  const loginUser = async (email: string, password: string): Promise<boolean> => {
    const cachedUser = localStorage.getItem('gitx_user');
    if (cachedUser) {
      const user = JSON.parse(cachedUser) as Profile;
      if (user.email === email) {
        setCurrentUser(user);
        addActivityLog('auth_login', `Выполнен вход в аккаунт: ${user.name}`);
        return true;
      }
    }
    // Создаем пользователя, если не совпало
    const user: Profile = {
      id: 'local_user',
      name: email.split('@')[0],
      username: email.split('@')[0],
      email,
      bio: 'Разработчик Git X',
      created_at: new Date().toISOString()
    };
    setCurrentUser(user);
    localStorage.setItem('gitx_user', JSON.stringify(user));
    addActivityLog('auth_login', `Выполнен вход в аккаунт: ${user.name}`);
    return true;
  };

  const logoutUser = () => {
    // Сбрасываем только текущего юзера в стейте, оставляя локальные кэши
    setCurrentUser(null);
    addActivityLog('auth_logout', 'Выполнен выход из учетной записи');
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('gitx_user', JSON.stringify(updated));
    addActivityLog('profile_update', 'Профиль пользователя успешно обновлен');
  };

  const deleteAccount = () => {
    setCurrentUser(null);
    setProjects([]);
    setTasks([]);
    setNotes([]);
    setSnippets([]);
    setFiles([]);
    setFolders([]);
    setAiServices(DEFAULT_AI_SERVICES);
    setActivityLogs([]);
    localStorage.clear();
    resetSupabaseClient();
    window.location.reload();
  };

  // Sync utilities for files and folders
  const syncFiles = (data: UserFile[]) => {
    setFiles(data);
    localStorage.setItem('gitx_files', JSON.stringify(data));
  };

  const syncFolders = (data: Folder[]) => {
    setFolders(data);
    localStorage.setItem('gitx_folders', JSON.stringify(data));
  };

  // File and Folder actions
  const addFile = (f: Omit<UserFile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newFile: UserFile = {
      ...f,
      id: Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id || 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    syncFiles([newFile, ...files]);
    addActivityLog('file_create', `Создан файл: ${f.name}`);
  };

  const updateFile = (id: string, updates: Partial<UserFile>) => {
    const updated = files.map(file => file.id === id ? { ...file, ...updates, updated_at: new Date().toISOString() } : file);
    syncFiles(updated);
  };

  const deleteFile = (id: string) => {
    const updated = files.filter(file => file.id !== id);
    syncFiles(updated);
    addActivityLog('file_delete', 'Файл удален');
  };

  const addFolder = (f: Omit<Folder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newFolder: Folder = {
      ...f,
      id: Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id || 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    syncFolders([newFolder, ...folders]);
    addActivityLog('folder_create', `Создана папка: ${f.name}`);
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    const updated = folders.map(folder => folder.id === id ? { ...folder, ...updates, updated_at: new Date().toISOString() } : folder);
    syncFolders(updated);
  };

  const deleteFolder = (id: string) => {
    const updatedFolders = folders.filter(folder => folder.id !== id);
    const updatedFiles = files.map(file => file.folder_id === id ? { ...file, folder_id: null } : file);
    syncFolders(updatedFolders);
    syncFiles(updatedFiles);
    addActivityLog('folder_delete', 'Папка удалена');
  };

  // Project actions
  const addProject = (p: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newProj: Project = {
      ...p,
      id: Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id || 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    syncProjects([newProj, ...projects]);
    addActivityLog('project_create', `Создан проект: ${p.name}`);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
    syncProjects(updated);
    const proj = projects.find(p => p.id === id);
    addActivityLog('project_update', `Обновлен проект: ${proj?.name || id}`);
  };

  const deleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    const filtered = projects.filter(p => p.id !== id);
    // Удаляем также связанные задачи
    const filteredTasks = tasks.filter(t => t.project_id !== id);
    syncProjects(filtered);
    syncTasks(filteredTasks);
    addActivityLog('project_delete', `Удален проект: ${proj?.name || id}`);
  };

  // Task actions
  const addTask = (t: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newTask: Task = {
      ...t,
      id: Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id || 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    syncTasks([newTask, ...tasks]);
    addActivityLog('task_create', `Создана задача: ${t.title}`);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
    syncTasks(updated);
    const task = tasks.find(t => t.id === id);
    addActivityLog('task_update', `Обновлена задача: ${task?.title || id}`);
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    syncTasks(filtered);
    addActivityLog('task_delete', `Удалена задача: ${task?.title || id}`);
  };

  // Note actions
  const addNote = (n: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newNote: Note = {
      ...n,
      id: Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id || 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    syncNotes([newNote, ...notes]);
    addActivityLog('note_create', `Создана заметка: ${n.title}`);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n);
    syncNotes(updated);
    const note = notes.find(n => n.id === id);
    addActivityLog('note_update', `Сохранена заметка: ${note?.title || id}`);
  };

  const deleteNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    const filtered = notes.filter(n => n.id !== id);
    syncNotes(filtered);
    addActivityLog('note_delete', `Удалена заметка: ${note?.title || id}`);
  };

  // Snippet actions
  const addSnippet = (s: Omit<Snippet, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newSnip: Snippet = {
      ...s,
      id: Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id || 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    syncSnippets([newSnip, ...snippets]);
    addActivityLog('snippet_create', `Создан сниппет: ${s.title}`);
  };

  const updateSnippet = (id: string, updates: Partial<Snippet>) => {
    const updated = snippets.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s);
    syncSnippets(updated);
    const snip = snippets.find(s => s.id === id);
    addActivityLog('snippet_update', `Обновлен сниппет: ${snip?.title || id}`);
  };

  const deleteSnippet = (id: string) => {
    const snip = snippets.find(s => s.id === id);
    const filtered = snippets.filter(s => s.id !== id);
    syncSnippets(filtered);
    addActivityLog('snippet_delete', `Удален сниппет: ${snip?.title || id}`);
  };

  // AI Service actions
  const addAIService = (s: Omit<AIService, 'id' | 'is_favorite'>) => {
    const newService: AIService = {
      ...s,
      id: Math.random().toString(36).substring(2, 9),
      is_favorite: false
    };
    syncServices([...aiServices, newService]);
    addActivityLog('ai_service_add', `Добавлен ИИ сервис: ${s.name}`);
  };

  const updateAIService = (id: string, updates: Partial<AIService>) => {
    const updated = aiServices.map(s => s.id === id ? { ...s, ...updates } : s);
    syncServices(updated);
  };

  const deleteAIService = (id: string) => {
    const s = aiServices.find(srv => srv.id === id);
    const filtered = aiServices.filter(srv => srv.id !== id);
    syncServices(filtered);
    addActivityLog('ai_service_delete', `Удален ИИ сервис: ${s?.name || id}`);
  };

  const toggleFavoriteService = (id: string) => {
    const updated = aiServices.map(s => s.id === id ? { ...s, is_favorite: !s.is_favorite } : s);
    syncServices(updated);
  };

  // App settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates, updated_at: new Date().toISOString() };
    syncSettings(updated);
    addActivityLog('settings_update', 'Настройки интерфейса обновлены');
  };

  // Export/Import
  const exportData = () => {
    const payload = {
      projects,
      tasks,
      notes,
      snippets,
      aiServices,
      settings,
      activityLogs
    };
    return JSON.stringify(payload, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.projects) syncProjects(data.projects);
      if (data.tasks) syncTasks(data.tasks);
      if (data.notes) syncNotes(data.notes);
      if (data.snippets) syncSnippets(data.snippets);
      if (data.aiServices) syncServices(data.aiServices);
      if (data.settings) syncSettings(data.settings);
      if (data.activityLogs) syncLogs(data.activityLogs);
      
      addActivityLog('backup_import', 'Резервная копия данных успешно импортирована');
      return true;
    } catch (err) {
      console.error('Ошибка импорта:', err);
      return false;
    }
  };

  // Тест соединения с Supabase
  const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
    try {
      const testClient = createClient(url, key);
      const { data, error } = await testClient.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        // Если таблицы не существует (42P01) — соединение успешно, просто база пустая!
        throw error;
      }
      
      addActivityLog('supabase_connect', `Успешное тестирование подключения к Supabase: ${url}`);
      return { success: true, message: 'Соединение успешно установлено! Проект доступен.' };
    } catch (error: any) {
      console.error('Ошибка теста Supabase:', error);
      return { 
        success: false, 
        message: `Ошибка подключения: ${error.message || 'Проверьте URL и Anon Key'}` 
      };
    }
  };

  return (
    <AppContext.Provider value={{
      isOffline,
      currentUser,
      projects,
      tasks,
      notes,
      snippets,
      files,
      folders,
      aiServices,
      activityLogs,
      settings,
      searchQuery,
      setSearchQuery,
      registerUser,
      loginUser,
      logoutUser,
      updateProfile,
      deleteAccount,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      addNote,
      updateNote,
      deleteNote,
      addSnippet,
      updateSnippet,
      deleteSnippet,
      addFile,
      updateFile,
      deleteFile,
      addFolder,
      updateFolder,
      deleteFolder,
      addAIService,
      updateAIService,
      deleteAIService,
      toggleFavoriteService,
      updateSettings,
      addActivityLog,
      clearActivityLogs,
      exportData,
      importData,
      testSupabaseConnection
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp должен использоваться внутри AppProvider');
  return context;
};
