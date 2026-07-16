import React, { useState, useEffect } from 'react';
import { useVault } from '../contexts/VaultContext';
import { useApp } from '../contexts/AppContext';
import { 
  Github, Search, Star, GitFork, GitBranch, GitPullRequest, AlertCircle, 
  ChevronRight, Folder, File, ExternalLink, RefreshCw, Eye, BookOpen, 
  Terminal, Users, Settings, Pin, ShieldAlert, Key, CornerDownLeft, 
  Plus, Check, Award, Flame, Languages, Calendar, Tag, ArrowLeft, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import Editor from '@monaco-editor/react';

// Настройка marked для безопасного и красивого рендеринга
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface GitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  html_url: string;
  clone_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  visibility: string;
  pushed_at: string;
  default_branch: string;
}

interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: {
    avatar_url: string;
    login: string;
  };
}

interface PullRequest {
  id: number;
  title: string;
  number: number;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  html_url: string;
}

interface Issue {
  id: number;
  title: string;
  number: number;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  labels: { name: string; color: string }[];
  created_at: string;
  html_url: string;
}

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
}

interface Release {
  id: number;
  name: string;
  tag_name: string;
  published_at: string;
  body: string;
}

export const GitHubView: React.FC = () => {
  const { decryptedKeys, isUnlocked } = useVault();
  const { addActivityLog } = useApp();

  // Состояния авторизации
  const [activeToken, setActiveToken] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [orgs, setOrgs] = useState<any[]>([]);

  // Состояния репозиториев
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'stars' | 'forks' | 'name' | 'updated'>('stars');
  const [langFilter, setLangFilter] = useState<string>('all');
  
  // Кастомные пины и избранное (храним локально)
  const [pinnedRepos, setPinnedRepos] = useState<number[]>(() => {
    const saved = localStorage.getItem('gitx_pinned_repos');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteRepos, setFavoriteRepos] = useState<number[]>(() => {
    const saved = localStorage.getItem('gitx_favorite_repos');
    return saved ? JSON.parse(saved) : [];
  });

  // Вкладка настройки PAT входа
  const [inputPat, setInputPat] = useState<string>('');
  const [patError, setPatError] = useState<string>('');

  // Выбранный репозиторий и его детали
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repoTab, setRepoTab] = useState<'overview' | 'files' | 'commits' | 'pulls' | 'issues' | 'contributors' | 'releases'>('overview');
  
  // Данные внутри репозитория
  const [readmeHtml, setReadmeHtml] = useState<string>('');
  const [readmeLoading, setReadmeLoading] = useState<boolean>(false);
  
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  // Навигация по файлам
  const [currentPath, setCurrentPath] = useState<string>('');
  const [filesList, setFilesList] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState<boolean>(false);

  // Коммиты, PR, Issues, Авторы, Релизы
  const [commits, setCommits] = useState<Commit[]>([]);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [tabLoading, setTabLoading] = useState<boolean>(false);

  // Синхронизация с токеном из Vault
  useEffect(() => {
    if (decryptedKeys.githubToken) {
      setActiveToken(decryptedKeys.githubToken);
      loadGitHubData(decryptedKeys.githubToken);
    } else {
      const storedUser = localStorage.getItem('gitx_github_username');
      if (storedUser) {
        setIsDemoMode(true);
        loadGitHubData('', storedUser);
      }
    }
  }, [decryptedKeys.githubToken]);

  // Хранение пинов и фаворитов
  useEffect(() => {
    localStorage.setItem('gitx_pinned_repos', JSON.stringify(pinnedRepos));
  }, [pinnedRepos]);

  useEffect(() => {
    localStorage.setItem('gitx_favorite_repos', JSON.stringify(favoriteRepos));
  }, [favoriteRepos]);

  // Безопасный декодер base64
  const decodeBase64Utf8 = (str: string) => {
    try {
      const clean = str.replace(/\s/g, '');
      return decodeURIComponent(
        atob(clean)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (e) {
      try {
        return atob(str);
      } catch (err) {
        return 'Ошибка декодирования содержимого файла';
      }
    }
  };

  // Вспомогательный фетч к API GitHub
  const fetchGitHub = async (endpoint: string, customToken?: string) => {
    const token = customToken || activeToken;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    const response = await fetch(`https://api.github.com${endpoint}`, { headers });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Ошибка авторизации или лимит API запросов превышен. Пожалуйста, укажите валидный PAT токен.');
      }
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }
    return response.json();
  };

  // Загрузка профиля и репозиториев
  const loadGitHubData = async (token: string, fallbackUsername?: string) => {
    setIsLoadingProfile(true);
    setPatError('');
    try {
      let userEndpoint = '/user';
      if (!token && fallbackUsername) {
        userEndpoint = `/users/${fallbackUsername}`;
      } else if (!token && !fallbackUsername) {
        throw new Error('Токен или имя пользователя не указаны');
      }

      const profileData = await fetchGitHub(userEndpoint, token);
      setProfile(profileData);

      // Загрузка организаций
      try {
        const orgsData = await fetchGitHub(token ? '/user/orgs' : `/users/${profileData.login}/orgs`, token);
        setOrgs(orgsData);
      } catch (e) {
        setOrgs([]);
      }

      // Загрузка репозиториев
      const reposEndpoint = token ? '/user/repos?per_page=100' : `/users/${profileData.login}/repos?per_page=100`;
      const reposData = await fetchGitHub(reposEndpoint, token);
      setRepos(reposData);

      addActivityLog('github_sync', `Синхронизирован профиль GitHub для @${profileData.login}`);
    } catch (err: any) {
      console.error(err);
      setPatError(err.message || 'Произошла непредвиденная ошибка подключения');
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Подключение по PAT вручную
  const handleConnectPAT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPat.trim()) return;
    setIsLoadingProfile(true);
    setPatError('');
    try {
      await loadGitHubData(inputPat);
      setActiveToken(inputPat);
      localStorage.setItem('gitx_github_username', ''); // сбрасываем демо, если был
      setIsDemoMode(false);
    } catch (err: any) {
      setPatError(err.message || 'Ошибка валидации токена');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Вход с демо-профилем
  const handleConnectDemo = async (username: string) => {
    setIsLoadingProfile(true);
    setPatError('');
    setIsDemoMode(true);
    setActiveToken('');
    try {
      await loadGitHubData('', username);
      localStorage.setItem('gitx_github_username', username);
    } catch (err: any) {
      setPatError(err.message || 'Не удалось загрузить демо-профиль');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Выход из профиля
  const handleDisconnect = () => {
    setProfile(null);
    setRepos([]);
    setActiveToken('');
    setIsDemoMode(false);
    localStorage.removeItem('gitx_github_username');
    addActivityLog('github_disconnect', 'Отключена интеграция GitHub');
  };

  // Фильтрация и сортировка репозиториев
  const filteredRepos = repos.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLang = langFilter === 'all' || r.language === langFilter;
    return matchesSearch && matchesLang;
  }).sort((a, b) => {
    // Пины всегда сверху
    const aPinned = pinnedRepos.includes(a.id) ? 1 : 0;
    const bPinned = pinnedRepos.includes(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
    if (sortBy === 'forks') return b.forks_count - a.forks_count;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'updated') return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    return 0;
  });

  // Получение уникальных языков для фильтра
  const availableLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean)));

  // Переключение пина
  const togglePin = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedRepos(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Переключение фаворита
  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteRepos(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Действия при выборе репозитория
  const handleSelectRepo = async (repo: Repository) => {
    setSelectedRepo(repo);
    setRepoTab('overview');
    setReadmeHtml('');
    setSelectedFileContent(null);
    setSelectedFileName(null);
    setCurrentPath('');
    
    // Загрузка веток
    try {
      const branchesData = await fetchGitHub(`/repos/${repo.full_name}/branches`);
      const names = branchesData.map((b: any) => b.name);
      setBranches(names);
      setSelectedBranch(repo.default_branch || names[0] || 'main');
    } catch (e) {
      setBranches(['main']);
      setSelectedBranch('main');
    }

    // Загрузка README автоматически
    setReadmeLoading(true);
    try {
      const readmeData = await fetchGitHub(`/repos/${repo.full_name}/readme`);
      const decoded = decodeBase64Utf8(readmeData.content);
      const html = await marked.parse(decoded);
      setReadmeHtml(html);
    } catch (e) {
      setReadmeHtml('<p className="text-zinc-500 italic">README.md отсутствует или недоступен для этого репозитория.</p>');
    } finally {
      setReadmeLoading(false);
    }
  };

  // Загрузка контента вкладки репозитория
  useEffect(() => {
    if (!selectedRepo) return;
    
    const loadTabContent = async () => {
      setTabLoading(true);
      try {
        if (repoTab === 'files') {
          setFilesLoading(true);
          const pathParam = currentPath ? `/${currentPath}` : '';
          const url = `/repos/${selectedRepo.full_name}/contents${pathParam}?ref=${selectedBranch}`;
          const contents = await fetchGitHub(url);
          // Сортируем: сначала папки, потом файлы
          const sorted = Array.isArray(contents) ? contents.sort((a: any, b: any) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
          }) : [contents];
          setFilesList(sorted);
          setFilesLoading(false);
        } else if (repoTab === 'commits') {
          const commitsData = await fetchGitHub(`/repos/${selectedRepo.full_name}/commits?sha=${selectedBranch}`);
          setCommits(commitsData.slice(0, 30));
        } else if (repoTab === 'pulls') {
          const pullsData = await fetchGitHub(`/repos/${selectedRepo.full_name}/pulls?state=all`);
          setPulls(pullsData.slice(0, 20));
        } else if (repoTab === 'issues') {
          const issuesData = await fetchGitHub(`/repos/${selectedRepo.full_name}/issues?state=all`);
          setIssues(issuesData.slice(0, 20));
        } else if (repoTab === 'contributors') {
          const contributorsData = await fetchGitHub(`/repos/${selectedRepo.full_name}/contributors`);
          setContributors(contributorsData.slice(0, 20));
        } else if (repoTab === 'releases') {
          const releasesData = await fetchGitHub(`/repos/${selectedRepo.full_name}/releases`);
          setReleases(releasesData);
        }
      } catch (e) {
        console.error('Ошибка загрузки вкладки', e);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabContent();
  }, [selectedRepo, repoTab, currentPath, selectedBranch]);

  // Загрузка контента отдельного файла
  const handleOpenFile = async (file: any) => {
    setFileLoading(true);
    setSelectedFileName(file.name);
    try {
      const fileData = await fetchGitHub(`/repos/${selectedRepo?.full_name}/contents/${file.path}?ref=${selectedBranch}`);
      const decoded = decodeBase64Utf8(fileData.content);
      setSelectedFileContent(decoded);
    } catch (e) {
      setSelectedFileContent('Не удалось загрузить содержимое файла.');
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. ЭКРАН ВХОДА (Если профиль не загружен) */}
      <AnimatePresence mode="wait">
        {!profile ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center mx-auto shadow-xl">
                <Github className="w-9 h-9 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-white">Интеграция с GitHub X</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Исследуйте репозитории, ведите ревью коммитов, управляйте пулл-реквестами и запускайте код прямо внутри Saas-платформы Git X.
              </p>
            </div>

            {/* Вход по токену */}
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                <Key className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-zinc-100">Способ 1: Персональный Токен (PAT)</h2>
              </div>

              {!isUnlocked && (
                <div className="p-3.5 rounded-xl bg-amber-950/15 border border-amber-500/20 text-amber-400 text-xs flex gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <p>Разблокируйте крипто-сейф в настройках, чтобы сохранить токен в зашифрованном виде.</p>
                </div>
              )}

              <form onSubmit={handleConnectPAT} className="space-y-4 text-xs text-left">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">GitHub Personal Access Token *</label>
                    <a 
                      href="https://github.com/settings/tokens/new?scopes=repo,read:user,read:org" 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Создать PAT <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    required
                    value={inputPat}
                    onChange={(e) => setInputPat(e.target.value)}
                    placeholder="github_pat_..."
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Рекомендуется генерировать токен с минимальными правами (scopes: <code>repo</code>, <code>read:user</code>, <code>read:org</code>).
                  </p>
                </div>

                {patError && (
                  <div className="p-3 rounded-xl bg-rose-950/15 border border-rose-500/20 text-rose-400 text-[11px]">
                    {patError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoadingProfile}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {isLoadingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Подключение...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Подключить токен доступа</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Быстрый демо-вход */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 text-left">
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                <Award className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-zinc-100 font-display">Способ 2: Демонстрационный доступ (Публичные репозитории)</h2>
              </div>
              
              <p className="text-xs text-zinc-400">
                Вы можете войти, используя любой популярный публичный профиль GitHub для демонстрации работы. Ключи и авторизация не требуются.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { name: 'torvalds', label: 'Linus Torvalds' },
                  { name: 'gaearon', label: 'Dan Abramov' },
                  { name: 'yyx990803', label: 'Evan You' },
                  { name: 'rich-harris', label: 'Rich Harris' }
                ].map(user => (
                  <button
                    key={user.name}
                    onClick={() => handleConnectDemo(user.name)}
                    disabled={isLoadingProfile}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 text-center transition-all cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-zinc-200 truncate">@{user.name}</p>
                    <span className="text-[10px] text-zinc-500">{user.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        ) : (
          
          /* 2. ОСНОВНОЙ РАБОЧИЙ ЭКРАН (Интеграция активна) */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            
            {/* А) Кнопка "Назад" при просмотре репозитория */}
            {selectedRepo && (
              <button
                onClick={() => setSelectedRepo(null)}
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs font-semibold bg-white/[0.02] hover:bg-white/[0.04] px-4 py-2 rounded-xl border border-white/5 cursor-pointer transition-all w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад к списку репозиториев</span>
              </button>
            )}

            {/* Б) ШАПКА ПРОФИЛЯ GITHUB (Bento Grid) */}
            {!selectedRepo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                
                {/* Карточка 1: Основная инфа */}
                <div className="md:col-span-2 glass-panel rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Github className="w-24 h-24 text-white" />
                  </div>

                  <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 shadow-lg">
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white truncate font-display">{profile.name || profile.login}</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {isDemoMode ? 'Демо-режим' : 'Учетка привязана'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">@{profile.login}</p>
                    {profile.bio && (
                      <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-2 pr-6">"{profile.bio}"</p>
                    )}
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="sm:self-center bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    Выйти
                  </button>
                </div>

                {/* Карточка 2: Статистика */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Показатели профиля</span>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 rounded-xl bg-white/[0.01] border border-white/5">
                      <p className="text-lg font-bold text-white font-mono">{profile.public_repos}</p>
                      <span className="text-[9px] text-zinc-500">Репозитории</span>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white/[0.01] border border-white/5">
                      <p className="text-lg font-bold text-white font-mono">{profile.followers}</p>
                      <span className="text-[9px] text-zinc-500">Подписчики</span>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white/[0.01] border border-white/5">
                      <p className="text-lg font-bold text-white font-mono">{profile.following}</p>
                      <span className="text-[9px] text-zinc-500">Подписки</span>
                    </div>
                  </div>

                  {/* Организции */}
                  {orgs.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">Организации:</span>
                      <div className="flex flex-wrap gap-1.5 max-h-[25px] overflow-hidden">
                        {orgs.map(org => (
                          <img 
                            key={org.id} 
                            src={org.avatar_url} 
                            alt={org.login} 
                            title={org.login}
                            className="w-5 h-5 rounded bg-zinc-800 border border-white/10" 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* В) ЭКРАН 2.1: СПИСОК РЕПОЗИТОРИЕВ */}
            {!selectedRepo ? (
              <div className="space-y-5 text-left">
                
                {/* Фильтры и панели управления списком */}
                <div className="glass-panel rounded-2xl p-3 flex flex-col lg:flex-row gap-3 items-center">
                  
                  {/* Поле поиска */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Поиск репозиториев по названию или описанию..."
                      className="w-full bg-white/[0.02] border border-white/5 pl-10 pr-4 py-2.5 rounded-xl text-xs text-zinc-200 focus:border-zinc-700 focus:outline-none"
                    />
                  </div>

                  {/* Фильтры */}
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    {/* Язык */}
                    <select
                      value={langFilter}
                      onChange={e => setLangFilter(e.target.value)}
                      className="bg-zinc-900 border border-white/5 px-3 py-2 rounded-xl text-xs text-zinc-300 font-semibold cursor-pointer"
                    >
                      <option value="all">Все языки</option>
                      {availableLanguages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>

                    {/* Сортировка */}
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="bg-zinc-900 border border-white/5 px-3 py-2 rounded-xl text-xs text-zinc-300 font-semibold cursor-pointer"
                    >
                      <option value="stars">Сортировка: Звёзды</option>
                      <option value="forks">Сортировка: Форки</option>
                      <option value="name">Сортировка: Имя</option>
                      <option value="updated">Сортировка: Обновление</option>
                    </select>

                    <button
                      onClick={() => loadGitHubData(activeToken, profile.login)}
                      className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center justify-center"
                      title="Обновить список"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Сетка репозиториев */}
                {filteredRepos.length === 0 ? (
                  <div className="glass-panel rounded-2xl py-16 text-center space-y-2">
                    <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-300">Репозитории не найдены</h3>
                    <p className="text-xs text-zinc-500">Попробуйте изменить параметры поиска или фильтров.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRepos.map(repo => {
                      const isPinned = pinnedRepos.includes(repo.id);
                      const isFav = favoriteRepos.includes(repo.id);
                      
                      return (
                        <div
                          key={repo.id}
                          onClick={() => handleSelectRepo(repo)}
                          className="glass-panel glass-panel-hover rounded-2xl p-4.5 flex flex-col justify-between h-44 cursor-pointer relative group text-left border border-white/5 hover:border-white/10"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-xs font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors truncate max-w-[70%]">
                                {repo.name}
                              </h3>

                              {/* Пины/Фавориты */}
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={(e) => togglePin(repo.id, e)}
                                  className={`p-1 rounded-md hover:bg-white/5 transition-colors ${isPinned ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-500'}`}
                                  title={isPinned ? 'Открепить' : 'Закрепить'}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => toggleFavorite(repo.id, e)}
                                  className={`p-1 rounded-md hover:bg-white/5 transition-colors ${isFav ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-500'}`}
                                  title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                            </div>

                            {repo.description ? (
                              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                                {repo.description}
                              </p>
                            ) : (
                              <p className="text-[11px] text-zinc-600 italic">Описание отсутствует.</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-3 border-t border-zinc-900">
                            {/* Язык */}
                            <div className="flex items-center gap-1.5">
                              {repo.language && (
                                <>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: repo.language === 'TypeScript' ? '#3178c6' : repo.language === 'JavaScript' ? '#f1e05a' : repo.language === 'Python' ? '#3572A5' : '#6366F1' }} />
                                  <span>{repo.language}</span>
                                </>
                              )}
                            </div>

                            {/* Stars & Forks */}
                            <div className="flex gap-3">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-zinc-500" />
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitFork className="w-3 h-3 text-zinc-500" />
                                {repo.forks_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            ) : (
              
              /* Г) ЭКРАН 2.2: СТРАНИЦА КОНКРЕТНОГО РЕПОЗИТОРИЯ (TABS) */
              <div className="space-y-6 text-left">
                
                {/* 1. Header репозитория */}
                <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <Github className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-base font-bold text-white font-display">{selectedRepo.name}</h2>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                        {selectedRepo.visibility}
                      </span>
                    </div>
                    {selectedRepo.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{selectedRepo.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <a 
                      href={selectedRepo.html_url} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/[0.04] text-white border border-white/5 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all"
                    >
                      <span>Открыть на GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 2. Навигация вкладок */}
                <div className="flex overflow-x-auto bg-zinc-950/20 border-b border-zinc-900 pb-px scrollbar-none gap-1">
                  {[
                    { id: 'overview', label: 'Описание', icon: BookOpen },
                    { id: 'files', label: 'Файлы', icon: Folder },
                    { id: 'commits', label: 'Коммиты', icon: GitBranch },
                    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
                    { id: 'issues', label: 'Issues', icon: AlertCircle },
                    { id: 'contributors', label: 'Авторы', icon: Users },
                    { id: 'releases', label: 'Релизы', icon: Tag }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setRepoTab(tab.id as any);
                        setSelectedFileContent(null);
                        setSelectedFileName(null);
                        setCurrentPath('');
                      }}
                      className={`flex items-center gap-2 px-4.5 py-3 text-xs font-semibold cursor-pointer border-b-2 transition-all whitespace-nowrap
                        ${repoTab === tab.id ? 'border-indigo-500 text-indigo-400 bg-white/[0.01]' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Выбор ветки */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-400 font-mono">Ветка:</span>
                    <select
                      value={selectedBranch}
                      onChange={e => setSelectedBranch(e.target.value)}
                      className="bg-zinc-900 border border-white/5 px-2.5 py-1.5 rounded-xl text-xs text-zinc-300 font-mono font-semibold cursor-pointer"
                    >
                      {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {currentPath && repoTab === 'files' && (
                    <button
                      onClick={() => {
                        const parts = currentPath.split('/');
                        parts.pop();
                        setCurrentPath(parts.join('/'));
                      }}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Назад к папке
                    </button>
                  )}
                </div>

                {/* 3. Рендеринг Контента Вкладки */}
                <div className="min-h-[350px] bg-transparent">
                  
                  {/* ТАБ 1: OVERVIEW (README) */}
                  {repoTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* README Рендер */}
                        <div className="md:col-span-2 glass-panel rounded-2xl p-6 prose prose-invert max-w-none text-zinc-200">
                          <h3 className="text-sm font-bold border-b border-zinc-900 pb-3 mb-4 text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-400" /> README.md
                          </h3>
                          
                          {readmeLoading ? (
                            <div className="py-20 text-center text-zinc-500">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                              <span>Подготовка документации...</span>
                            </div>
                          ) : (
                            <div className="space-y-4 markdown-body" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
                          )}
                        </div>

                        {/* Метаданные репозитория справа */}
                        <div className="space-y-5">
                          <div className="glass-panel rounded-2xl p-5 space-y-4 text-xs">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Статистика</span>
                            
                            <div className="space-y-2.5">
                              <div className="flex justify-between border-b border-zinc-900 pb-2">
                                <span className="text-zinc-500">Звёзды</span>
                                <span className="font-bold text-white font-mono">{selectedRepo.stargazers_count}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-900 pb-2">
                                <span className="text-zinc-500">Форки</span>
                                <span className="font-bold text-white font-mono">{selectedRepo.forks_count}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-900 pb-2">
                                <span className="text-zinc-500">Открытые Issues</span>
                                <span className="font-bold text-white font-mono">{selectedRepo.open_issues_count}</span>
                              </div>
                              <div className="flex justify-between border-b border-zinc-900 pb-2">
                                <span className="text-zinc-500">Язык по умолчанию</span>
                                <span className="font-bold text-white font-mono">{selectedRepo.language || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Последний пуш</span>
                                <span className="font-bold text-white font-mono">{new Date(selectedRepo.pushed_at).toLocaleDateString('ru-RU')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* ТАБ 2: FILES (Explorer) */}
                  {repoTab === 'files' && (
                    <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                      
                      {selectedFileContent === null ? (
                        /* Просмотр списка файлов */
                        <div className="space-y-2">
                          <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider mb-2 px-1">
                            Репозиторий / {currentPath || 'Корень'}
                          </div>

                          {filesLoading ? (
                            <div className="py-20 text-center text-zinc-500">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                              <span>Чтение структуры файлов...</span>
                            </div>
                          ) : (
                            <div className="divide-y divide-zinc-900/55 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950/20">
                              {filesList.map(file => (
                                <div
                                  key={file.sha}
                                  onClick={() => {
                                    if (file.type === 'dir') {
                                      setCurrentPath(file.path);
                                    } else {
                                      handleOpenFile(file);
                                    }
                                  }}
                                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {file.type === 'dir' ? (
                                      <Folder className="w-4 h-4 text-amber-400 fill-amber-400/15" />
                                    ) : (
                                      <File className="w-4 h-4 text-indigo-400" />
                                    )}
                                    <span className="text-xs font-semibold text-zinc-200">{file.name}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Просмотр содержимого конкретного файла */
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-indigo-400" />
                              <span className="text-xs font-bold text-white font-mono">{selectedFileName}</span>
                            </div>

                            <button
                              onClick={() => setSelectedFileContent(null)}
                              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              Закрыть просмотр
                            </button>
                          </div>

                          <div className="h-[450px] border border-zinc-900 rounded-xl overflow-hidden bg-black">
                            {fileLoading ? (
                              <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                              </div>
                            ) : (
                              <Editor
                                height="100%"
                                language={
                                  selectedFileName?.endsWith('.js') ? 'javascript' :
                                  selectedFileName?.endsWith('.ts') ? 'typescript' :
                                  selectedFileName?.endsWith('.tsx') ? 'typescript' :
                                  selectedFileName?.endsWith('.html') ? 'html' :
                                  selectedFileName?.endsWith('.css') ? 'css' :
                                  selectedFileName?.endsWith('.json') ? 'json' :
                                  selectedFileName?.endsWith('.py') ? 'python' :
                                  selectedFileName?.endsWith('.rs') ? 'rust' :
                                  selectedFileName?.endsWith('.md') ? 'markdown' : 'plaintext'
                                }
                                theme="vs-dark"
                                value={selectedFileContent || ''}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 12,
                                  lineNumbers: 'on',
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                  fontFamily: '"JetBrains Mono", Fira Code, Courier New, monospace'
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* ТАБ 3: COMMITS */}
                  {repoTab === 'commits' && (
                    <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Лента последних коммитов</h3>
                      
                      {tabLoading ? (
                        <div className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
                        </div>
                      ) : (
                        <div className="space-y-3.5 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-zinc-900 pl-1">
                          {commits.map(c => (
                            <div key={c.sha} className="flex gap-4 relative">
                              <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-850 shrink-0 overflow-hidden flex items-center justify-center z-10">
                                {c.author?.avatar_url ? (
                                  <img src={c.author.avatar_url} alt="author" className="w-full h-full object-cover" />
                                ) : (
                                  <Github className="w-3.5 h-3.5 text-zinc-600" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 p-3 rounded-xl transition-all">
                                <p className="text-xs font-bold text-zinc-200 line-clamp-1">{c.commit.message}</p>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1.5">
                                  <span className="text-indigo-400">@{c.author?.login || c.commit.author.name}</span>
                                  <span>•</span>
                                  <span>{new Date(c.commit.author.date).toLocaleString('ru-RU')}</span>
                                  <span>•</span>
                                  <span className="text-zinc-600">{c.sha.substring(0, 7)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ТАБ 4: PULL REQUESTS */}
                  {repoTab === 'pulls' && (
                    <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Список Pull Requests</h3>
                      
                      {tabLoading ? (
                        <div className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
                        </div>
                      ) : pulls.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 italic text-xs">Активные или завершенные пулл-реквесты не найдены.</div>
                      ) : (
                        <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/20">
                          {pulls.map(pr => (
                            <a
                              key={pr.id}
                              href={pr.html_url}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="space-y-1 text-left">
                                <div className="flex items-center gap-2">
                                  <GitPullRequest className={`w-4 h-4 ${pr.state === 'open' ? 'text-emerald-400' : 'text-purple-400'}`} />
                                  <span className="text-xs font-bold text-zinc-200">#{pr.number} {pr.title}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  Создал @{pr.user.login} • {new Date(pr.created_at).toLocaleDateString('ru-RU')}
                                </div>
                              </div>

                              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border 
                                ${pr.state === 'open' 
                                  ? 'border-emerald-500/10 bg-emerald-500/10 text-emerald-400' 
                                  : 'border-purple-500/10 bg-purple-500/10 text-purple-400'}`}
                              >
                                {pr.state}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ТАБ 5: ISSUES */}
                  {repoTab === 'issues' && (
                    <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Зарегистрированные задачи (Issues)</h3>
                      
                      {tabLoading ? (
                        <div className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
                        </div>
                      ) : issues.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 italic text-xs">Задачи отсутствуют.</div>
                      ) : (
                        <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/20">
                          {issues.map(issue => (
                            <a
                              key={issue.id}
                              href={issue.html_url}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="space-y-1.5 text-left">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className={`w-4 h-4 ${issue.state === 'open' ? 'text-rose-400' : 'text-zinc-600'}`} />
                                  <span className="text-xs font-bold text-zinc-200">#{issue.number} {issue.title}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    Автор: @{issue.user.login} • {new Date(issue.created_at).toLocaleDateString('ru-RU')}
                                  </span>
                                  {issue.labels.map(label => (
                                    <span 
                                      key={label.name} 
                                      className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.03] text-zinc-400 border border-white/5"
                                    >
                                      {label.name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border 
                                ${issue.state === 'open' 
                                  ? 'border-rose-500/10 bg-rose-500/10 text-rose-400' 
                                  : 'border-zinc-500/10 bg-zinc-500/10 text-zinc-400'}`}
                              >
                                {issue.state}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ТАБ 6: CONTRIBUTORS */}
                  {repoTab === 'contributors' && (
                    <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Авторы проекта (Contributors)</h3>
                      
                      {tabLoading ? (
                        <div className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {contributors.map(c => (
                            <div key={c.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center gap-3">
                              <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">@{c.login}</p>
                                <p className="text-[10px] font-mono text-zinc-500">{c.contributions} коммитов</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ТАБ 7: RELEASES */}
                  {repoTab === 'releases' && (
                    <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Официальные релизы</h3>
                      
                      {tabLoading ? (
                        <div className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
                        </div>
                      ) : releases.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 italic text-xs">Релизы в данном репозитории отсутствуют.</div>
                      ) : (
                        <div className="space-y-4">
                          {releases.map(rel => (
                            <div key={rel.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2 text-left">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                    {rel.name || rel.tag_name}
                                  </h4>
                                  <p className="text-[10px] text-zinc-500 font-mono">Опубликован: {new Date(rel.published_at).toLocaleString('ru-RU')}</p>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  {rel.tag_name}
                                </span>
                              </div>
                              {rel.body && (
                                <div className="text-[11px] text-zinc-400 leading-relaxed pt-2 border-t border-zinc-900 whitespace-pre-wrap">
                                  {rel.body}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
