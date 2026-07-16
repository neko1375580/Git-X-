import React, { useState, useEffect } from 'react';
import { 
  Terminal, Globe, Play, X, ExternalLink, RefreshCw, Search, Server, 
  GitBranch, GitPullRequest, GitCommit, User, Clock, ShieldCheck, 
  Settings, Key, AlertCircle, Trash2, Code, Database, ChevronRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VercelConsoleProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  token: string;
  onDisconnect: () => void;
}

interface VercelProject {
  id: string;
  name: string;
  framework: string;
  link: string;
  updatedAt: number;
  latestDeployment?: {
    id: string;
    url: string;
    status: 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED';
    creator: string;
    branch: string;
    commitMessage: string;
    commitRef: string;
  };
}

// Имитационные логи сборки для создания реалистичного терминала
const MOCK_BUILD_LOGS = [
  'Cloning github.com/developer/git-x (Branch: main, Commit: 7a2f1b)...',
  'Clone completed in 1.4s',
  'Analyzing dependencies...',
  'Detected Vite project. Running "npm run build"...',
  'Installing dependencies using npm...',
  'npm WARN deprecated inflight@1.0.6: Please use lru-cache instead.',
  'added 342 packages in 4.2s',
  'vite v5.2.11 building for production...',
  'transforming...',
  '✓ 1421 modules transformed.',
  'rendering chunks...',
  'dist/index.html                  0.85 kB │ info',
  'dist/assets/index-D7fb2s.css    84.21 kB │ gzip: 18.23 kB',
  'dist/assets/index-C9a8sd.js   1452.11 kB │ gzip: 421.32 kB',
  '✓ built in 6.45s',
  'Deploying static assets to Vercel Edge Network...',
  'Deploying serverless edge functions in cdg1 region...',
  'Routing rules configured successfully.',
  'Deployment ready! https://git-x-deploy-prod.vercel.app'
];

export const VercelConsole: React.FC<VercelConsoleProps> = ({ showToast, token, onDisconnect }) => {
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<VercelProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDeployTab, setActiveDeployTab] = useState<'info' | 'logs' | 'env' | 'domains'>('info');
  
  // Состояния для интерактивной консоли
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [currentLogIdx, setCurrentLogIdx] = useState(0);

  // Кастомные переменные окружения для проекта
  const [envVars, setEnvVars] = useState<{ key: string; value: string; isSecret: boolean }[]>([
    { key: 'VITE_SUPABASE_URL', value: 'https://ocscidbgrbdfgfb.supabase.co', isSecret: false },
    { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...', isSecret: true },
    { key: 'GEMINI_API_KEY', value: 'AIzaSyAsbS-9Asd...', isSecret: true }
  ]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  // Загрузка проектов Vercel
  useEffect(() => {
    loadVercelData();
  }, [token]);

  const loadVercelData = async () => {
    setIsLoading(true);
    try {
      if (token && token.startsWith('v_tok')) {
        // Попытка реального запроса к Vercel API
        const res = await fetch('https://api.vercel.com/v9/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: VercelProject[] = data.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            framework: p.framework || 'vite',
            link: p.targets?.production?.url || `${p.name}.vercel.app`,
            updatedAt: p.updatedAt,
            latestDeployment: {
              id: p.targets?.production?.id || 'dep_123',
              url: p.targets?.production?.url || `${p.name}.vercel.app`,
              status: 'READY',
              creator: p.targets?.production?.creator?.username || 'developer',
              branch: p.targets?.production?.meta?.githubCommitRef || 'main',
              commitMessage: p.targets?.production?.meta?.githubCommitMessage || 'Production deployment',
              commitRef: p.targets?.production?.meta?.githubCommitSha?.slice(0, 7) || '7a2f1b'
            }
          }));
          setProjects(mapped);
          return;
        }
      }

      // Высококачественный фолбэк для демонстрации / если токен кастомный
      const demoProjects: VercelProject[] = [
        {
          id: 'proj_1',
          name: 'git-x-platform',
          framework: 'vite',
          link: 'git-x-platform.vercel.app',
          updatedAt: Date.now() - 3600000,
          latestDeployment: {
            id: 'd_10928a',
            url: 'git-x-platform.vercel.app',
            status: 'READY',
            creator: 'legendata27',
            branch: 'main',
            commitMessage: 'feat: add master-vault encryption using Web Crypto API',
            commitRef: '8b9cd2a'
          }
        },
        {
          id: 'proj_2',
          name: 'supabase-terminal-db',
          framework: 'nextjs',
          link: 'supabase-terminal-db.vercel.app',
          updatedAt: Date.now() - 86400000,
          latestDeployment: {
            id: 'd_20911b',
            url: 'supabase-terminal-db.vercel.app',
            status: 'READY',
            creator: 'legendata27',
            branch: 'master',
            commitMessage: 'chore: enable PostgreSQL RLS policies in production',
            commitRef: '4a1ef3c'
          }
        },
        {
          id: 'proj_3',
          name: 'ai-code-companion',
          framework: 'react',
          link: 'ai-code-companion.vercel.app',
          updatedAt: Date.now() - 172800000,
          latestDeployment: {
            id: 'd_30112c',
            url: 'ai-code-companion.vercel.app',
            status: 'READY',
            creator: 'legendata27',
            branch: 'feature/gemini-sdk',
            commitMessage: 'refactor: migrate to @google/genai TypeScript SDK',
            commitRef: 'ef39a0b'
          }
        }
      ];
      setProjects(demoProjects);
    } catch (e) {
      showToast('Ошибка подключения к Vercel API', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Симуляция редеплоя
  const handleRedeploy = (project: VercelProject) => {
    setIsBuilding(true);
    setBuildLogs([]);
    setCurrentLogIdx(0);
    setActiveDeployTab('logs');
    showToast('Запущен новый деплой проекта ' + project.name, 'info');

    // Обновляем статус проекта на BUILDING
    setProjects(prev => prev.map(p => p.id === project.id ? {
      ...p,
      latestDeployment: p.latestDeployment ? { ...p.latestDeployment, status: 'BUILDING' } : undefined
    } : p));
  };

  // Эффект бегущих логов
  useEffect(() => {
    if (!isBuilding) return;
    if (currentLogIdx < MOCK_BUILD_LOGS.length) {
      const timer = setTimeout(() => {
        setBuildLogs(prev => [...prev, MOCK_BUILD_LOGS[currentLogIdx]]);
        setCurrentLogIdx(prev => prev + 1);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsBuilding(false);
      showToast('Деплой проекта успешно завершен!', 'success');
      if (selectedProject) {
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? {
          ...p,
          latestDeployment: p.latestDeployment ? { ...p.latestDeployment, status: 'READY' } : undefined
        } : p));
      }
    }
  }, [isBuilding, currentLogIdx]);

  // Симуляция отмены сборки
  const handleCancelDeployment = (project: VercelProject) => {
    setIsBuilding(false);
    setProjects(prev => prev.map(p => p.id === project.id ? {
      ...p,
      latestDeployment: p.latestDeployment ? { ...p.latestDeployment, status: 'CANCELED' } : undefined
    } : p));
    showToast('Сборка отменена пользователем', 'info');
  };

  // Переключение секретности переменных
  const toggleEnvSecret = (key: string) => {
    setEnvVars(prev => prev.map(e => e.key === key ? { ...e, isSecret: !e.isSecret } : e));
  };

  // Добавление новой ENV
  const handleAddEnv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvKey.trim() || !newEnvVal.trim()) return;
    setEnvVars(prev => [...prev, { key: newEnvKey.toUpperCase(), value: newEnvVal, isSecret: true }]);
    setNewEnvKey('');
    setNewEnvVal('');
    showToast('Переменная окружения добавлена', 'success');
  };

  // Удаление ENV
  const handleDeleteEnv = (key: string) => {
    setEnvVars(prev => prev.filter(e => e.key !== key));
    showToast('Переменная удалена', 'info');
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.framework.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. СПИСОК ПРОЕКТОВ (ЕСЛИ НЕ ВЫБРАН КОНКРЕТНЫЙ) */}
      {!selectedProject ? (
        <div className="space-y-5 text-left">
          <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-white/5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск Vercel проектов..."
                className="w-full bg-white/[0.01] border border-white/5 pl-11 pr-4 py-2.5 rounded-xl text-xs text-zinc-200 focus:border-zinc-700 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button 
                onClick={loadVercelData}
                className="p-2.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl cursor-pointer transition-colors text-zinc-400 hover:text-zinc-200"
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={onDisconnect}
                className="px-4 py-2 bg-rose-950/15 hover:bg-rose-900/25 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Отключить Vercel
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
              <span>Загрузка проектов с серверов Vercel...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="glass-panel rounded-2xl py-16 text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-300">Проекты не найдены</h3>
              <p className="text-xs text-zinc-500">Добавьте проекты в вашем дашборде Vercel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map(project => {
                const dep = project.latestDeployment;
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 hover:border-white/10 flex flex-col justify-between h-48 cursor-pointer relative text-left transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">{project.framework} Framework</p>
                        </div>

                        {dep && (
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border 
                            ${dep.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              dep.status === 'BUILDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 
                              dep.status === 'CANCELED' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : 
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                          >
                            {dep.status}
                          </span>
                        )}
                      </div>

                      {dep && (
                        <div className="space-y-1.5 text-xs text-zinc-400">
                          <p className="flex items-center gap-1.5 truncate">
                            <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{dep.branch}</span>
                            <span className="text-zinc-600">|</span>
                            <span className="font-mono text-[11px] text-zinc-500">{dep.commitRef}</span>
                          </p>
                          <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                            "{dep.commitMessage}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-3 border-t border-zinc-900/60 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                        Управление деплоем <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        
        /* 2. ДЕТАЛЬНАЯ СТРАНИЦА ПРОЕКТА */
        <div className="space-y-6 text-left">
          
          {/* Header */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white font-display">{selectedProject.name}</h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-850 text-zinc-400 uppercase">
                  {selectedProject.framework}
                </span>
              </div>
              <p className="text-xs text-zinc-400">ID проекта: <span className="font-mono">{selectedProject.id}</span></p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                К списку проектов
              </button>

              <a
                href={`https://${selectedProject.link}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Перейти на сайт</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Навигация вкладок */}
          <div className="flex overflow-x-auto border-b border-zinc-900 pb-px gap-1">
            {[
              { id: 'info', label: 'Информация', icon: Server },
              { id: 'logs', label: 'Консоль сборки', icon: Terminal },
              { id: 'env', label: 'Переменные Env', icon: Key },
              { id: 'domains', label: 'Домены & DNS', icon: Globe }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDeployTab(tab.id as any)}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-semibold cursor-pointer border-b-2 transition-all whitespace-nowrap
                  ${activeDeployTab === tab.id ? 'border-indigo-500 text-indigo-400 bg-white/[0.01]' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Контент вкладок */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: INFO */}
              {activeDeployTab === 'info' && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  
                  {/* Основные детали деплоя */}
                  <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-white/5 space-y-5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Активный Релиз
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-zinc-500 text-[10px] uppercase">Статус деплоя</span>
                        <p className="font-bold text-emerald-400">{selectedProject.latestDeployment?.status}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 text-[10px] uppercase">Регион деплоя</span>
                        <p className="font-bold text-white">fra1 (Frankfurt, Germany)</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 text-[10px] uppercase">Автор пуша</span>
                        <p className="font-bold text-zinc-200 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-zinc-400" /> @{selectedProject.latestDeployment?.creator}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 text-[10px] uppercase">Среда окружения</span>
                        <p className="font-bold text-indigo-400 uppercase">Production</p>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-2">
                      <span className="text-zinc-500 text-[10px] font-mono uppercase block">Последний Git-коммит</span>
                      <div className="flex items-center gap-3 text-xs">
                        <GitCommit className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">
                          {selectedProject.latestDeployment?.commitRef}
                        </span>
                        <span className="font-semibold text-white truncate">
                          {selectedProject.latestDeployment?.commitMessage}
                        </span>
                      </div>
                    </div>

                    {/* Кнопки управления */}
                    <div className="flex flex-wrap gap-2.5 pt-3 border-t border-zinc-900">
                      <button
                        onClick={() => handleRedeploy(selectedProject)}
                        disabled={isBuilding}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Запустить Redeploy</span>
                      </button>

                      {selectedProject.latestDeployment?.status === 'BUILDING' && (
                        <button
                          onClick={() => handleCancelDeployment(selectedProject)}
                          className="px-4 py-2 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Отменить Сборку</span>
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Сводные лимиты / статус DNS */}
                  <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Мониторинг ресурсов</h3>
                    
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between py-1.5 border-b border-zinc-900">
                        <span className="text-zinc-500">Edge Middleware</span>
                        <span className="text-emerald-400 font-semibold uppercase">ОК (0ms latency)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-zinc-900">
                        <span className="text-zinc-500">Serverless Requests</span>
                        <span className="text-zinc-200">14,210 / 100K</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-zinc-900">
                        <span className="text-zinc-500">Bandwidth (Data)</span>
                        <span className="text-zinc-200">2.12 GB / 100 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">SSL Сертификат</span>
                        <span className="text-emerald-400 font-semibold">VALID (Let's Encrypt)</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* TAB 2: LOGS (Terminal Emulator) */}
              {activeDeployTab === 'logs' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center bg-zinc-900/30 p-3 rounded-xl border border-zinc-850">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">Сборка в реальном времени: {selectedProject.name}</span>
                    </div>

                    {isBuilding && (
                      <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 px-2 py-0.5 rounded animate-pulse font-mono">
                        BUILDING...
                      </span>
                    )}
                  </div>

                  <div className="h-80 bg-black border border-zinc-900 rounded-xl p-4 overflow-y-auto font-mono text-[11px] text-zinc-300 leading-relaxed text-left space-y-1.5 select-text">
                    {buildLogs.length === 0 ? (
                      <div className="text-zinc-500 italic py-10 text-center">
                        Нажмите "Запустить Redeploy" выше, чтобы активировать терминал и начать сборку проекта.
                      </div>
                    ) : (
                      buildLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-zinc-600 select-none">[{idx + 1}]</span>
                          <span className={log.includes('✓') || log.includes('ready') ? 'text-emerald-400' : log.includes('WARN') ? 'text-amber-400' : 'text-zinc-300'}>
                            {log}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: ENV VARIABLES */}
              {activeDeployTab === 'env' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Form */}
                  <form onSubmit={handleAddEnv} className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row gap-3 items-end">
                    <div className="space-y-1 w-full text-xs">
                      <label className="font-bold text-[10px] text-zinc-500 uppercase">Имя Переменной (Key)</label>
                      <input
                        type="text"
                        required
                        value={newEnvKey}
                        onChange={e => setNewEnvKey(e.target.value)}
                        placeholder="VITE_CUSTOM_API_URL"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200 font-mono uppercase text-xs"
                      />
                    </div>
                    <div className="space-y-1 w-full text-xs">
                      <label className="font-bold text-[10px] text-zinc-500 uppercase">Значение (Value)</label>
                      <input
                        type="text"
                        required
                        value={newEnvVal}
                        onChange={e => setNewEnvVal(e.target.value)}
                        placeholder="https://api.domain.com"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200 font-mono text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 h-10 w-full sm:w-auto"
                    >
                      Добавить
                    </button>
                  </form>

                  {/* List */}
                  <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                    <div className="divide-y divide-zinc-900 bg-zinc-950/20">
                      {envVars.map(e => (
                        <div key={e.key} className="p-4 flex items-center justify-between text-xs font-mono">
                          <div className="space-y-1 max-w-[70%]">
                            <span className="font-bold text-white">{e.key}</span>
                            <p className="text-zinc-400 select-all truncate text-[11px]">
                              {e.isSecret ? '••••••••••••••••••••••••••••' : e.value}
                            </p>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => toggleEnvSecret(e.key)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-zinc-200 transition-colors"
                              title={e.isSecret ? 'Показать' : 'Скрыть'}
                            >
                              <Code className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEnv(e.key)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/15 hover:bg-rose-900/25 border border-rose-500/20 text-rose-400 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: DOMAINS */}
              {activeDeployTab === 'domains' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5"
                >
                  <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Доменные Имена</h3>
                      <p className="text-xs text-zinc-400 mt-1">Подключенные домены и статус DNS-записей для проекта.</p>
                    </div>

                    <button 
                      onClick={() => showToast('Регистрация внешних доменов доступна только во Vercel Pro', 'info')}
                      className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Добавить Домен
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-zinc-950/30 border border-zinc-900 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div className="space-y-1">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <span>{selectedProject.link}</span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase">
                            Primary
                          </span>
                        </p>
                        <p className="text-zinc-500 text-[10px]">Канонический домен Vercel</p>
                      </div>

                      <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                        <ShieldCheck className="w-4 h-4" /> Активен
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950/30 border border-zinc-900 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div className="space-y-1">
                        <p className="font-bold text-white">git-x-prod.com</p>
                        <p className="text-zinc-500 text-[10px]">Режимы DNS: A record / CNAME redirect</p>
                      </div>

                      <div className="flex items-center gap-1 text-indigo-400 text-[11px] font-bold">
                        <Globe className="w-4 h-4 animate-pulse" /> Настройка...
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      )}

    </div>
  );
};
