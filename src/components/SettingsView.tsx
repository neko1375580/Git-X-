import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useVault } from '../contexts/VaultContext';
import { 
  Settings, User, Key, Shield, ShieldAlert, ShieldCheck, Download, Upload, 
  Trash2, Moon, Sun, AlertTriangle, Save, LogOut, Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ showToast }) => {
  const { 
    currentUser, updateProfile, settings, updateSettings, deleteAccount, 
    logoutUser, exportData, importData, clearActivityLogs 
  } = useApp();

  const { 
    isUnlocked, isConfigured, configureVault, unlock, lock, updateKeys 
  } = useVault();

  // Состояние профиля
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [bio, setBio] = useState(currentUser?.bio || '');

  // Состояние сейфа
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Ключи API
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');

  // Импорт бэкапа
  const [backupFileContent, setBackupFileContent] = useState('');

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, username, avatar_url: avatarUrl, bio });
    showToast('Профиль успешно обновлен', 'success');
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Пароли не совпадают', 'error');
      return;
    }
    if (password.length < 4) {
      showToast('Пароль должен быть не менее 4 символов', 'error');
      return;
    }

    try {
      await configureVault(password);
      setPassword('');
      setConfirmPassword('');
      showToast('Криптографический сейф инициализирован!', 'success');
    } catch (err) {
      showToast('Не удалось настроить сейф', 'error');
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlock(password);
    setPassword('');
    if (success) {
      showToast('Сейф разблокирован. Ключи дешифрованы в память.', 'success');
    } else {
      showToast('Неверный мастер-пароль. Попробуйте еще раз.', 'error');
    }
  };

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      showToast('Сейф закрыт! Сначала разблокируйте его.', 'error');
      return;
    }

    try {
      await updateKeys({
        openaiKey: openaiKeyInput || undefined,
        geminiKey: geminiKeyInput || undefined
      });
      setOpenaiKeyInput('');
      setGeminiKeyInput('');
      showToast('API ключи зашифрованы и сохранены', 'success');
    } catch (err) {
      showToast('Не удалось сохранить ключи', 'error');
    }
  };

  // Экспорт бэкапа
  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gitx_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Резервная копия скачана (.json)', 'success');
  };

  // Импорт бэкапа
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const success = importData(result);
      if (success) {
        showToast('Данные бэкапа успешно импортированы!', 'success');
      } else {
        showToast('Не удалось распознать JSON бэкапа. Проверьте структуру.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div>
        <h1 className="text-2xl font-bold font-display text-zinc-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-zinc-400" /> Настройки
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Персонализация аккаунта, управление криптографическим сейфом и экспорт данных.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Столбец 1: Профиль и Оформление */}
        <div className="lg:col-span-2 space-y-6">
          {/* Редактирование Профиля */}
          <div className="p-5 sm:p-6 rounded-2xl glass-panel space-y-5">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-900 pb-3">
              <User className="w-4 h-4 text-indigo-400" /> Личные данные
            </h2>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 text-xs text-zinc-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Имя Фамилия</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-xl focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Никнейм (username)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-xl focus:outline-none text-zinc-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-[10px] text-zinc-500">Адрес ссылки на аватар (Avatar URL)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-xl focus:outline-none text-zinc-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-[10px] text-zinc-500">О себе (Био)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-xl focus:outline-none text-zinc-200"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" /> Сохранить изменения
                </button>
              </div>
            </form>
          </div>

          {/* Сейф учетных данных (Шифрование) */}
          <div className="p-5 sm:p-6 rounded-2xl glass-panel space-y-5">
            <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-pink-400" /> Шифрованный сейф ключей
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Встроенная защита на базе Web Crypto API. Ключи шифруются прямо в браузере.</p>
              </div>

              {isConfigured ? (
                isUnlocked ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Сейф открыт
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/20 border border-rose-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Сейф закрыт
                  </span>
                )
              ) : (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/20 border border-amber-500/25 px-2.5 py-1 rounded-full">
                  Не настроен
                </span>
              )}
            </div>

            {/* Сценарий 1: Сейф не создан */}
            {!isConfigured && (
              <form onSubmit={handleCreateVault} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-indigo-950/25 border border-indigo-500/20 text-indigo-300 leading-relaxed">
                  Придумайте Мастер-Пароль. Он будет использоваться для генерации уникального криптографического ключа. Мы никогда не отправляем этот пароль в сеть.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Задайте мастер-пароль</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 4 символа"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Подтвердите мастер-пароль</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Пароли должны совпадать"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold cursor-pointer transition-all">
                    Создать сейф
                  </button>
                </div>
              </form>
            )}

            {/* Сценарий 2: Сейф сконфигурирован, но закрыт */}
            {isConfigured && !isUnlocked && (
              <form onSubmit={handleUnlockVault} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Введите мастер-пароль для дешифрования сейфа</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Мастер-пароль"
                      className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold cursor-pointer transition-all">
                      Разблокировать сейф
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Сценарий 3: Сейф разблокирован */}
            {isConfigured && isUnlocked && (
              <div className="space-y-5 text-xs">
                {/* Блокировка */}
                <div className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-xl border border-zinc-850">
                  <div>
                    <p className="font-bold text-zinc-200">Ключи активны в памяти</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">В случае бездействия рекомендуется заблокировать сейф.</p>
                  </div>
                  <button
                    onClick={lock}
                    className="px-4 py-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold cursor-pointer"
                  >
                    Запереть сейф
                  </button>
                </div>

                {/* Добавление API Ключей в сейф */}
                <form onSubmit={handleSaveApiKeys} className="space-y-4 border-t border-zinc-900 pt-4">
                  <h3 className="font-bold uppercase text-[10px] text-zinc-500">Сохранение секретных токенов</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-medium text-zinc-400">OpenAI API Key</label>
                      <input
                        type="password"
                        value={openaiKeyInput}
                        onChange={(e) => setOpenaiKeyInput(e.target.value)}
                        placeholder="sk-or-proj-..."
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-zinc-400">Google Gemini API Key</label>
                      <input
                        type="password"
                        value={geminiKeyInput}
                        onChange={(e) => setGeminiKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold cursor-pointer transition-all">
                      Зашифровать и Сохранить
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Столбец 2: Тема, Бэкап и Опасная Зона */}
        <div className="space-y-6">
          {/* Настройки интерфейса */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-900 pb-2">
              Оформление
            </h2>
            
            <div className="space-y-3.5 text-xs">
              {/* Выбор темы */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Тема приложения</span>
                <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
                  {[
                    { id: 'light', icon: Sun, label: 'Светлая' },
                    { id: 'dark', icon: Moon, label: 'Темная' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateSettings({ theme: t.id as any })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                        ${settings.theme === t.id ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500'}`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Выбор языка */}
              <div className="flex justify-between items-center py-2 border-t border-zinc-900">
                <span className="text-zinc-400 font-medium">Язык интерфейса</span>
                <span className="font-bold text-zinc-400">Русский (RU)</span>
              </div>
            </div>
          </div>

          {/* Резервное копирование */}
          <div className="p-5 rounded-2xl glass-panel space-y-4 text-xs">
            <h2 className="text-sm font-bold text-zinc-100 border-b border-zinc-900 pb-2">
              Резервное копирование
            </h2>

            <div className="space-y-3">
              <p className="text-zinc-500 leading-relaxed">Скачайте полную копию ваших проектов, задач и заметок на локальный ПК.</p>
              
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold cursor-pointer hover:bg-zinc-850 transition-all"
              >
                <Download className="w-4 h-4 text-indigo-400" /> Экспортировать в JSON
              </button>

              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <p className="text-zinc-500">Восстановить из файла резервной копии:</p>
                <div className="relative flex items-center justify-center border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-3 bg-zinc-950/20 cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold">Загрузить файл бэкапа</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Опасная зона */}
          <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-950/5 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-rose-400 border-b border-rose-950/20 pb-2">
              Опасная зона (Danger Zone)
            </h2>

            <div className="space-y-3">
              <p className="text-zinc-500 leading-relaxed">Полная очистка локального кэша, истории переписок и логов. Это действие необратимо.</p>
              
              <button
                onClick={() => {
                  if (confirm('Вы уверены, что хотите стереть абсолютно всю информацию и логи из кэша?')) {
                    clearActivityLogs();
                    showToast('Журнал действий очищен', 'error');
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-rose-500/10 text-rose-400/80 font-semibold hover:border-rose-500/30 hover:bg-rose-950/25 cursor-pointer transition-all"
              >
                Очистить логи событий
              </button>

              <button
                onClick={() => {
                  if (confirm('ВНИМАНИЕ! Вы полностью сотрете все созданные проекты, задачи, заметки и зашифрованные секреты. Продолжить?')) {
                    deleteAccount();
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-400 font-semibold hover:bg-rose-900/30 cursor-pointer transition-all"
              >
                Сбросить приложение (Стереть всё)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
