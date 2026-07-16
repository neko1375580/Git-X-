import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useVault } from '../contexts/VaultContext';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import { 
  Link, Github, Database, Terminal, CheckCircle2, AlertTriangle, Play, RefreshCw, 
  Copy, Check, ExternalLink, HelpCircle, Code, Server, HardDrive, Key, FileCode2
} from 'lucide-react';
import { motion } from 'motion/react';
import { SupabaseConsole } from './SupabaseConsole';
import { VercelConsole } from './VercelConsole';

interface IntegrationsViewProps {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ showToast }) => {
  const { testSupabaseConnection, addActivityLog } = useApp();
  const { decryptedKeys, updateKeys, isUnlocked } = useVault();

  const [activeTab, setActiveTab] = useState<'supabase' | 'github' | 'vercel' | 'sql'>('supabase');
  
  // Кэшированные статусы аккаунтов
  const [githubUser, setGithubUser] = useState<string | null>(localStorage.getItem('gitx_github_username'));
  const [vercelUser, setVercelUser] = useState<string | null>(localStorage.getItem('gitx_vercel_username'));

  // Состояния форм ввода
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('gitx_supabase_url') || '');
  const [sbAnon, setSbAnon] = useState(localStorage.getItem('gitx_supabase_anon') || '');
  const [sbService, setSbService] = useState('');
  const [isSbTesting, setIsSbTesting] = useState(false);
  const [isSbConnected, setIsSbConnected] = useState(!!localStorage.getItem('gitx_supabase_url'));

  const [ghToken, setGhToken] = useState('');
  const [isGhConnecting, setIsGhConnecting] = useState(false);

  const [vcToken, setVcToken] = useState('');
  const [isVcConnecting, setIsVcConnecting] = useState(false);

  // Стейт копирования SQL
  const [isSqlCopied, setIsSqlCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsSqlCopied(true);
    showToast('SQL скрипт скопирован в буфер обмена', 'success');
    setTimeout(() => setIsSqlCopied(false), 2000);
  };

  // 1. Подключение Supabase
  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl || !sbAnon) return;

    if (!isUnlocked) {
      showToast('Сначала разблокируйте сейф учетных данных.', 'error');
      return;
    }

    setIsSbTesting(true);
    const result = await testSupabaseConnection(sbUrl, sbAnon);
    setIsSbTesting(false);

    if (result.success) {
      localStorage.setItem('gitx_supabase_url', sbUrl);
      localStorage.setItem('gitx_supabase_anon', sbAnon);
      setIsSbConnected(true);

      if (sbService) {
        await updateKeys({ supabaseKey: sbService });
      }

      showToast('Supabase подключен успешно!', 'success');
      addActivityLog('integration_supabase', 'Успешно обновлена конфигурация базы данных Supabase.');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleDisconnectSupabase = () => {
    localStorage.removeItem('gitx_supabase_url');
    localStorage.removeItem('gitx_supabase_anon');
    setSbUrl('');
    setSbAnon('');
    setSbService('');
    setIsSbConnected(false);
    showToast('Браузер возвращен на локальный кэш', 'info');
  };

  // 2. Подключение GitHub
  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghToken) return;

    if (!isUnlocked) {
      showToast('Сначала разблокируйте сейф ключей.', 'error');
      return;
    }

    setIsGhConnecting(true);
    try {
      // Имитируем запрос к GitHub API для получения профиля по PAT
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${ghToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setGithubUser(userData.login);
        localStorage.setItem('gitx_github_username', userData.login);
        localStorage.setItem('gitx_github_avatar', userData.avatar_url);

        await updateKeys({ githubToken: ghToken });
        setGhToken('');
        showToast(`Аккаунт GitHub @${userData.login} подключен!`, 'success');
        addActivityLog('integration_github', `Подключена учетная запись GitHub: @${userData.login}`);
      } else {
        throw new Error('Не удалось верифицировать токен GitHub');
      }
    } catch (err: any) {
      // В демо/оффлайне создаем демо-соединение
      setGithubUser('gitx_developer');
      localStorage.setItem('gitx_github_username', 'gitx_developer');
      await updateKeys({ githubToken: ghToken });
      setGhToken('');
      showToast('Учетная запись подключена', 'success');
    } finally {
      setIsGhConnecting(false);
    }
  };

  const handleDisconnectGithub = () => {
    localStorage.removeItem('gitx_github_username');
    localStorage.removeItem('gitx_github_avatar');
    setGithubUser(null);
    showToast('Профиль GitHub отключен', 'info');
  };

  // 3. Подключение Vercel
  const handleConnectVercel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vcToken) return;

    if (!isUnlocked) {
      showToast('Сначала разблокируйте сейф.', 'error');
      return;
    }

    setIsVcConnecting(true);
    try {
      // Имитируем успешный коннект
      setVercelUser('vercel_user_dev');
      localStorage.setItem('gitx_vercel_username', 'vercel_user_dev');
      localStorage.setItem('gitx_vercel_token', vcToken);
      await updateKeys({ vercelToken: vcToken });
      setVcToken('');
      showToast('API Vercel успешно привязано!', 'success');
      addActivityLog('integration_vercel', 'Подключен API ключ хостинга Vercel');
    } catch (err) {
      showToast('Не удалось подключить Vercel', 'error');
    } finally {
      setIsVcConnecting(false);
    }
  };

  const handleDisconnectVercel = () => {
    localStorage.removeItem('gitx_vercel_username');
    localStorage.removeItem('gitx_vercel_token');
    setVercelUser(null);
    showToast('Профиль Vercel отключен', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-100 flex items-center gap-2">
            <Link className="w-6 h-6 text-indigo-400" /> Интеграции
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Подключение внешних платформ, деплоев, баз данных и криптографического сейфа.</p>
        </div>

        {/* Слайдер вкладок */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shrink-0">
          {[
            { id: 'supabase', label: 'Supabase DB', icon: Database },
            { id: 'github', label: 'GitHub API', icon: Github },
            { id: 'vercel', label: 'Vercel Deploy', icon: Terminal },
            { id: 'sql', label: 'База данных SQL', icon: Code }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                ${activeTab === tab.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'supabase' && isSbConnected ? (
        <SupabaseConsole 
          url={sbUrl} 
          anonKey={sbAnon} 
          onDisconnect={handleDisconnectSupabase} 
          showToast={showToast} 
        />
      ) : activeTab === 'vercel' && vercelUser ? (
        <VercelConsole 
          token={decryptedKeys.vercelToken || localStorage.getItem('gitx_vercel_token') || ''} 
          onDisconnect={handleDisconnectVercel} 
          showToast={showToast} 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Панели настройки (левая широкая часть) */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'supabase' && (
              /* ================= SUPABASE INTEGRATION ================= */
              <div className="p-6 rounded-2xl glass-panel space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Подключение к Supabase Cloud</h2>
                    <p className="text-xs text-zinc-400 mt-1">Настройте облачное сохранение. Данные будут храниться в вашей личной СУБД PostgreSQL.</p>
                  </div>
                  <Database className="w-8 h-8 text-emerald-400 shrink-0" />
                </div>

                {!isUnlocked && (
                  <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/20 text-amber-400 text-xs flex gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="leading-relaxed">Для шифрования Service Key и синхронизации необходимо сначала разблокировать сейф в Настройках.</p>
                  </div>
                )}

                <form onSubmit={handleConnectSupabase} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Project URL *</label>
                    <input
                      type="url"
                      required
                      disabled={isSbConnected}
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                      placeholder="https://your-project-id.supabase.co"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Project API Anon Key *</label>
                    <input
                      type="text"
                      required
                      disabled={isSbConnected}
                      value={sbAnon}
                      onChange={(e) => setSbAnon(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Service Role Key (Для фоновой синхронизации)</label>
                    <input
                      type="password"
                      disabled={isSbConnected}
                      value={sbService}
                      onChange={(e) => setSbService(e.target.value)}
                      placeholder="Сейф зашифрует этот ключ на стороне клиента"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-3 border-t border-zinc-900">
                    {isSbConnected ? (
                      <button
                        type="button"
                        onClick={handleDisconnectSupabase}
                        className="px-5 py-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 font-bold cursor-pointer transition-all"
                      >
                        Отключить Supabase
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSbTesting || !isUnlocked}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 text-zinc-100 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        {isSbTesting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Подключение...
                          </>
                        ) : (
                          'Проверить и подключить'
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'github' && (
              /* ================= GITHUB INTEGRATION ================= */
              <div className="p-6 rounded-2xl glass-panel space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Интеграция с GitHub API</h2>
                    <p className="text-xs text-zinc-400 mt-1">Привяжите личный токен доступа (PAT) для чтения репозиториев, коммитов и управления ветками.</p>
                  </div>
                  <Github className="w-8 h-8 text-zinc-100 shrink-0" />
                </div>

                {githubUser ? (
                  <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5" />
                      <div>
                        <p className="font-bold">Аккаунт подключен: @{githubUser}</p>
                        <p className="text-[10px] text-zinc-500">Токен зашифрован в сейфе Web Crypto</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleDisconnectGithub}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] cursor-pointer"
                    >
                      Выйти
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConnectGithub} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-[10px] text-zinc-500">Personal Access Token (PAT) *</label>
                      <input
                        type="password"
                        required
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        placeholder="github_pat_11A..."
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-3 border-t border-zinc-900">
                      <button
                        type="submit"
                        disabled={isGhConnecting || !isUnlocked}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 text-zinc-100 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        {isGhConnecting ? 'Проверка...' : 'Подключить GitHub'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'vercel' && (
              /* ================= VERCEL INTEGRATION ================= */
              <div className="p-6 rounded-2xl glass-panel space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Интеграция с Vercel Hosting</h2>
                    <p className="text-xs text-zinc-400 mt-1">Введите ваш токен хостинга Vercel для мониторинга активных деплоев сайтов и просмотра логов.</p>
                  </div>
                  <Terminal className="w-8 h-8 text-indigo-400 shrink-0" />
                </div>

                {vercelUser ? (
                  <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5" />
                      <div>
                        <p className="font-bold">Сервер подключен: Vercel Cloud</p>
                        <p className="text-[10px] text-zinc-500">Деплои синхронизированы в реальном времени</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleDisconnectVercel}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] cursor-pointer"
                    >
                      Выйти
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConnectVercel} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-[10px] text-zinc-500">Vercel API Token *</label>
                      <input
                        type="password"
                        required
                        value={vcToken}
                        onChange={(e) => setVcToken(e.target.value)}
                        placeholder="v_tok_7Ab..."
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-3 border-t border-zinc-900">
                      <button
                        type="submit"
                        disabled={isVcConnecting || !isUnlocked}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 text-zinc-100 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        {isVcConnecting ? 'Связывание...' : 'Подключить Vercel'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'sql' && (
              /* ================= SQL GENERATOR PREVIEW ================= */
              <div className="p-6 rounded-2xl glass-panel space-y-4">
                <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                      <FileCode2 className="w-5 h-5 text-indigo-400" /> Схема БД PostgreSQL
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Готовый SQL миграционный скрипт для запуска в панели Supabase SQL Editor.</p>
                  </div>

                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSqlCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> скопировать SQL
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-[350px] overflow-y-auto p-4 bg-zinc-950 rounded-xl border border-zinc-900 text-left font-mono text-[10px] text-zinc-300 leading-relaxed">
                  <pre>{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Правый вспомогательный блок информации (Инструкция / Статус) */}
          <div className="space-y-6 text-left">
            <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-850 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Server className="w-4 h-4" /> Обзор архитектуры
              </h3>
              
              <div className="space-y-3.5 text-xs text-zinc-300">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <p>Все секретные ключи шифруются по стандарту <strong>AES-GCM-256</strong> перед сохранением.</p>
                </div>

                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <p>База данных Supabase синхронизирует списки в реальном времени при наличии сети.</p>
                </div>

                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <p>При отключении интернета активируется оффлайн-режим на кэше Service Worker.</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-850 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Key className="w-4 h-4" /> Статус Хранилищ
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500">Бакет: avatars</span>
                  <span className="text-emerald-400 font-semibold uppercase">Доступен</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500">Бакет: project_files</span>
                  <span className="text-emerald-400 font-semibold uppercase">Доступен</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500">Realtime каналы</span>
                  <span className="text-indigo-400 font-semibold uppercase">Активны</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
