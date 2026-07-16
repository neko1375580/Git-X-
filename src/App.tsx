import React, { useState, useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import { useVault } from './contexts/VaultContext';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';

// Подгрузка видов
import { DashboardView } from './components/DashboardView';
import { GitHubView } from './components/GitHubView';
import { ProjectManagerView } from './components/ProjectManagerView';
import { TaskManagerView } from './components/TaskManagerView';
import { NotesView } from './components/NotesView';
import { SnippetsView } from './components/SnippetsView';
import { FilesView } from './components/FilesView';
import { GalleryView } from './components/GalleryView';
import { VSCodeView } from './components/VSCodeView';
import { DevToolsView } from './components/DevToolsView';
import { AIServicesView } from './components/AIServicesView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';

// Иконки
import { 
  FolderGit, ClipboardList, BookOpen, Code, Bot, Link, Settings, 
  Search, Shield, ShieldAlert, Sparkles, Terminal, LogOut, Lock, 
  Menu, X, Command, Globe, Check, CornerDownLeft, HardDrive, Film, FileCode, Wrench,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { isOffline, currentUser, logoutUser, projects, tasks, notes, snippets } = useApp();
  const { isUnlocked, isConfigured, lock } = useVault();

  // Маршрутизация видов
  const [view, setView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const openInVSCode = (fileId: string) => {
    setSelectedFileId(fileId);
    setView('vscode');
  };

  // Локальные тосты
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Состояние Raycast глобального поиска
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');

  // Мобильное меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = (text: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Шорткаты клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + P или Ctrl + P для быстрого поиска
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      // Ctrl + L для мгновенной блокировки сейфа
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        lock();
        showToast('Сейф немедленно заблокирован', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lock]);

  // Сортировка глобального поиска
  const searchResults = {
    projects: projects.filter(p => p.name.toLowerCase().includes(globalQuery.toLowerCase())),
    tasks: tasks.filter(t => t.title.toLowerCase().includes(globalQuery.toLowerCase())),
    notes: notes.filter(n => n.title.toLowerCase().includes(globalQuery.toLowerCase())),
    snippets: snippets.filter(s => s.title.toLowerCase().includes(globalQuery.toLowerCase()))
  };

  const totalResults = searchResults.projects.length + searchResults.tasks.length + searchResults.notes.length + searchResults.snippets.length;

  const handleSearchResultClick = (itemType: string, itemId: string, projectId: string | null = null) => {
    setIsSearchOpen(false);
    setGlobalQuery('');
    
    if (itemType === 'project') {
      setSelectedProjectId(itemId);
      setView('projects');
      showToast(`Переход к проекту: ${projects.find(p => p.id === itemId)?.name}`, 'info');
    } else if (itemType === 'task') {
      setView('tasks');
    } else if (itemType === 'note') {
      setView('notes');
    } else if (itemType === 'snippet') {
      setView('snippets');
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Главная', icon: Globe },
    { id: 'github', label: 'GitHub X', icon: Github },
    { id: 'projects', label: 'Проекты', icon: FolderGit },
    { id: 'tasks', label: 'Задачи', icon: ClipboardList },
    { id: 'notes', label: 'Заметки', icon: BookOpen },
    { id: 'snippets', label: 'Сниппеты', icon: Code },
    { id: 'files', label: 'Файлы', icon: HardDrive },
    { id: 'gallery', label: 'Галерея', icon: Film },
    { id: 'vscode', label: 'VS Code', icon: FileCode },
    { id: 'devtools', label: 'DevTools', icon: Wrench },
    { id: 'ai', label: 'ИИ Чат-боты', icon: Bot },
    { id: 'integrations', label: 'Интеграции', icon: Link },
    { id: 'settings', label: 'Настройки', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-transparent text-[#f4f4f5] flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200">
      
      {/* 1. ШАПКА ПРИЛОЖЕНИЯ */}
      <header className="sticky top-0 z-40 bg-[#040406]/55 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Бургер для мобилок */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Логотип */}
          <div onClick={() => setView('dashboard')} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base font-display shadow-lg shadow-indigo-600/20 group-hover:bg-indigo-500 transition-colors">
              X
            </div>
            <span className="font-display font-bold tracking-tight text-lg text-zinc-100 group-hover:text-white transition-colors">
              Git X
            </span>
          </div>
        </div>

        {/* Глобальный поиск триггер */}
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 px-3 py-1.5 rounded-xl text-zinc-400 text-xs w-80 cursor-pointer transition-all"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="flex-1 text-left text-[11px]">Поиск по системе...</span>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[9px] font-mono">
            <Command className="w-2.5 h-2.5" /><span>P</span>
          </div>
        </div>

        {/* Профиль и Статус Сейфа */}
        <div className="flex items-center gap-3.5">
          {isConfigured && (
            <button
              onClick={() => lock()}
              className={`p-1.5 rounded-lg border flex items-center justify-center cursor-pointer transition-all
                ${isUnlocked 
                  ? 'border-emerald-500/10 bg-emerald-950/10 text-emerald-400 hover:bg-rose-950/10 hover:border-rose-500/20' 
                  : 'border-rose-500/10 bg-rose-950/10 text-rose-400 hover:bg-emerald-950/10 hover:border-emerald-500/20'}`}
              title={isUnlocked ? 'Быстрая блокировка сейфа' : 'Разблокировать в настройках'}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Юзер аватар */}
          <div 
            onClick={() => setView('settings')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 overflow-hidden flex items-center justify-center shrink-0">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-500 font-bold font-mono text-xs">U</span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-zinc-200 truncate max-w-[100px]">{currentUser?.name || 'Разработчик'}</p>
              <span className="text-[10px] text-zinc-500 font-mono">RU Workspace</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. РАБОЧЕЕ ПРОСТРАНСТВО */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ЛЕВАЯ ПАНЕЛЬ НАВИГАЦИИ (DESKTOP) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-white/[0.01] backdrop-blur-xl shrink-0 p-4 justify-between">
          <div className="space-y-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all text-left
                  ${view === item.id 
                    ? 'bg-zinc-900 text-zinc-100 border border-zinc-850/80' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent'}`}
              >
                <item.icon className={`w-4 h-4 ${view === item.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Нижний колонтитул */}
          <div className="pt-4 border-t border-zinc-900 text-[10px] font-mono text-zinc-600 text-left space-y-1.5">
            <p>Git X v1.0.0 Stable</p>
            <p className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isOffline ? 'Работает оффлайн' : 'Сеть подключена'}
            </p>
          </div>
        </aside>

        {/* МОБИЛЬНОЕ ВЫЕЗДНОЕ МЕНЮ */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#09090b]/85 backdrop-blur-2xl border-r border-white/5 p-5 flex flex-col justify-between shadow-2xl md:hidden text-left"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="font-display font-bold text-zinc-200">Навигация Git X</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {sidebarItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all text-left
                        ${view === item.id ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      <item.icon className="w-4 h-4 text-zinc-500" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 text-[10px] font-mono text-zinc-500">
                <p>Локальное зашифрованное PWA</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ЦЕНТРАЛЬНОЕ ОКНО ПРИЛОЖЕНИЯ */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
            >
              {view === 'dashboard' && (
                <DashboardView setView={setView} showToast={showToast} setSelectedProjectId={setSelectedProjectId} />
              )}
              {view === 'github' && (
                <GitHubView />
              )}
              {view === 'projects' && (
                <ProjectManagerView showToast={showToast} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} />
              )}
              {view === 'tasks' && (
                <TaskManagerView showToast={showToast} />
              )}
              {view === 'notes' && (
                <NotesView showToast={showToast} />
              )}
              {view === 'snippets' && (
                <SnippetsView showToast={showToast} />
              )}
              {view === 'files' && (
                <FilesView showToast={showToast} openInVSCode={openInVSCode} setView={setView} />
              )}
              {view === 'gallery' && (
                <GalleryView showToast={showToast} setView={setView} />
              )}
              {view === 'vscode' && (
                <VSCodeView showToast={showToast} selectedFileId={selectedFileId} setSelectedFileId={setSelectedFileId} />
              )}
              {view === 'devtools' && (
                <DevToolsView showToast={showToast} />
              )}
              {view === 'ai' && (
                <AIServicesView showToast={showToast} />
              )}
              {view === 'integrations' && (
                <IntegrationsView showToast={showToast} />
              )}
              {view === 'settings' && (
                <SettingsView showToast={showToast} />
              )}
            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* 3. ГЛОБАЛЬНЫЙ ТОСТЕР */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* 4. RAYCAST COMMAND PALETTE (ГЛОБАЛЬНЫЙ ПОИСК) */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-md pt-[10vh]">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-xl bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Поле ввода */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-transparent">
                <Search className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Введите запрос для сквозного поиска по проектам, задачам, заметкам..."
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none text-zinc-200 text-xs flex-1 placeholder:text-zinc-600"
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-500 border border-zinc-850 text-[10px] font-semibold cursor-pointer shrink-0"
                >
                  ESC
                </button>
              </div>

              {/* Результаты поиска */}
              <div className="max-h-[350px] overflow-y-auto p-2 space-y-4">
                {globalQuery.trim() === '' ? (
                  <div className="py-12 text-center text-zinc-600 space-y-1.5">
                    <Command className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                    <p className="text-xs font-semibold text-zinc-500">Глобальный поиск Git X</p>
                    <p className="text-[10px]">Начните писать, чтобы осуществлять мгновенный сквозной поиск по всей системе.</p>
                  </div>
                ) : totalResults === 0 ? (
                  <div className="py-12 text-center text-zinc-600">
                    <p className="text-xs italic">Совпадений не найдено</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Раздел: Проекты */}
                    {searchResults.projects.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-3">Проекты ({searchResults.projects.length})</span>
                        <div className="space-y-1">
                          {searchResults.projects.map(p => (
                            <div
                              key={p.id}
                              onClick={() => handleSearchResultClick('project', p.id)}
                              className="px-3 py-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900 cursor-pointer flex justify-between items-center text-xs text-zinc-200 hover:text-white group"
                            >
                              <div className="flex items-center gap-2">
                                <FolderGit className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="font-semibold">{p.name}</span>
                              </div>
                              <CornerDownLeft className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Раздел: Задачи */}
                    {searchResults.tasks.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-3">Задачи ({searchResults.tasks.length})</span>
                        <div className="space-y-1">
                          {searchResults.tasks.map(t => (
                            <div
                              key={t.id}
                              onClick={() => handleSearchResultClick('task', t.id)}
                              className="px-3 py-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900 cursor-pointer flex justify-between items-center text-xs text-zinc-200 hover:text-white group"
                            >
                              <div className="flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-semibold">{t.title}</span>
                              </div>
                              <CornerDownLeft className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Раздел: Заметки */}
                    {searchResults.notes.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-3">Заметки ({searchResults.notes.length})</span>
                        <div className="space-y-1">
                          {searchResults.notes.map(n => (
                            <div
                              key={n.id}
                              onClick={() => handleSearchResultClick('note', n.id)}
                              className="px-3 py-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900 cursor-pointer flex justify-between items-center text-xs text-zinc-200 hover:text-white group"
                            >
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                                <span className="font-semibold">{n.title}</span>
                              </div>
                              <CornerDownLeft className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Раздел: Сниппеты */}
                    {searchResults.snippets.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-3">Сниппеты ({searchResults.snippets.length})</span>
                        <div className="space-y-1">
                          {searchResults.snippets.map(s => (
                            <div
                              key={s.id}
                              onClick={() => handleSearchResultClick('snippet', s.id)}
                              className="px-3 py-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900 cursor-pointer flex justify-between items-center text-xs text-zinc-200 hover:text-white group"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Code className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                <span className="font-semibold truncate">{s.title}</span>
                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-zinc-900 text-pink-400 border border-zinc-800 uppercase shrink-0">
                                  {s.language}
                                </span>
                              </div>
                              <CornerDownLeft className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Футер поиска */}
              <div className="px-4 py-2 bg-zinc-900/30 border-t border-zinc-900 text-[10px] text-zinc-500 flex justify-between items-center">
                <span>Используйте шорткат <strong>Ctrl + L</strong> для мгновенной блокировки сейфа</span>
                <span>Найдено результатов: {totalResults}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
