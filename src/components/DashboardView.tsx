import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useVault } from '../contexts/VaultContext';
import { 
  FolderGit, ClipboardList, BookOpen, Code, Terminal, Zap, Shield, ShieldAlert,
  ArrowUpRight, Clock, Eye, CheckSquare, Star, Plus, Link, Database, Github
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  setView: (v: string) => void;
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
  setSelectedProjectId: (id: string | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setView, showToast, setSelectedProjectId }) => {
  const { 
    currentUser, projects, tasks, notes, snippets, activityLogs, isOffline, updateTask, addProject, addTask, addNote
  } = useApp();
  const { isUnlocked } = useVault();

  const activeProjects = projects.filter(p => p.status === 'active');
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const pinnedNotes = notes.filter(n => n.is_pinned);
  const favoriteSnippets = snippets.filter(s => s.is_favorite);

  // Получение статуса подключений
  const githubConnected = !!localStorage.getItem('gitx_vault_payload') && !!localStorage.getItem('gitx_github_username');
  const vercelConnected = !!localStorage.getItem('gitx_vault_payload') && !!localStorage.getItem('gitx_vercel_username');
  const supabaseConnected = !!localStorage.getItem('gitx_supabase_url');

  const handleQuickTaskToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    updateTask(id, { status: nextStatus as any });
    showToast(nextStatus === 'done' ? 'Задача отмечена как выполненная' : 'Задача возвращена в работу', 'success');
  };

  const handleCreateSampleProject = () => {
    addProject({
      name: 'Новый микросервис',
      description: 'Разработка высокопроизводительного API на Go/Rust.',
      status: 'active',
      priority: 'high',
      progress: 10,
      color: '#10B981',
      tags: ['API', 'Go', 'Rust'],
      technologies: ['Go', 'Rust', 'Docker'],
      todo_checklist: [{ text: 'Разработать структуру БД', done: false }],
      is_pinned: false
    });
    showToast('Новый проект создан', 'success');
  };

  const handleCreateSampleTask = () => {
    addTask({
      title: 'Провести ревью безопасности сейфа',
      description: 'Убедиться в отсутствии утечек ключей в логах.',
      status: 'todo',
      priority: 'high',
      labels: ['Безопасность']
    });
    showToast('Новая задача добавлена в список', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Приветственный баннер */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-zinc-100 flex items-center gap-3">
            Привет, {currentUser?.name || 'Разработчик'} 
            <span className="text-zinc-500 font-normal text-lg">@{currentUser?.username}</span>
          </h1>
          <p className="text-zinc-400 mt-1.5 text-sm max-w-xl">
            {currentUser?.bio || 'Добро пожаловать в рабочую среду Git X. Все процессы синхронизированы.'}
          </p>
        </div>

        {/* Индикатор статуса и сети */}
        <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'} pulse-dot`} />
            <span className="text-xs font-mono font-medium tracking-wide">
              {isOffline ? 'ОФФЛАЙН РЕЖИМ' : 'СЕТЬ АКТИВНА'}
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            {isUnlocked ? (
              <Shield className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
            <span className="text-xs font-mono font-medium">
              {isUnlocked ? 'СЕЙФ ОТКРЫТ' : 'СЕЙФ ЗАКРЫТ'}
            </span>
          </div>
        </div>
      </div>

      {/* Карточки метрик */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Активные проекты', value: activeProjects.length, icon: FolderGit, color: 'text-indigo-400', view: 'projects' },
          { label: 'Задачи в работе', value: pendingTasks.length, icon: ClipboardList, color: 'text-amber-400', view: 'tasks' },
          { label: 'Закрепленные заметки', value: pinnedNotes.length, icon: BookOpen, color: 'text-teal-400', view: 'notes' },
          { label: 'Избранные сниппеты', value: favoriteSnippets.length, icon: Code, color: 'text-pink-400', view: 'snippets' }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            onClick={() => setView(item.view)}
            className="p-5 rounded-2xl glass-panel glass-panel-hover transition-all duration-200 cursor-pointer flex flex-col justify-between h-32"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400 tracking-wide">{item.label}</span>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-zinc-100">{item.value}</span>
              <span className="text-[10px] text-zinc-500 font-mono">Git X</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Сетка модулей */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Столбец 1 и 2: Проекты и Задачи */}
        <div className="lg:col-span-2 space-y-6">
          {/* Быстрые действия */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" /> Быстрые операции
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={handleCreateSampleProject}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer hover:bg-zinc-800/50 transition-all"
              >
                <Plus className="w-4 h-4 text-indigo-400" /> Проект
              </button>
              <button
                onClick={handleCreateSampleTask}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer hover:bg-zinc-800/50 transition-all"
              >
                <Plus className="w-4 h-4 text-amber-400" /> Задача
              </button>
              <button
                onClick={() => {
                  addNote({ title: 'Черновик идеи', content: 'Опишите вашу идею здесь...', folder: 'Идеи', is_pinned: false, tags: ['Новый'] });
                  showToast('Создан черновик заметки', 'success');
                }}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer hover:bg-zinc-800/50 transition-all"
              >
                <Plus className="w-4 h-4 text-teal-400" /> Заметка
              </button>
              <button
                onClick={() => setView('settings')}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer hover:bg-zinc-800/50 transition-all"
              >
                <Shield className="w-4 h-4 text-pink-400" /> Ключи ИИ
              </button>
            </div>
          </div>

          {/* Текущие задачи */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" /> Задачи в фокусе
              </h3>
              <button onClick={() => setView('tasks')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer">
                Все задачи <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                <CheckSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Все задачи завершены! Отличная работа.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuickTaskToggle(task.id, task.status)}
                        className="w-4.5 h-4.5 rounded border border-zinc-700 flex items-center justify-center cursor-pointer text-zinc-800 hover:border-indigo-500 transition-all shrink-0"
                      >
                        <div className="w-2.5 h-2.5 rounded bg-transparent" />
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200 line-clamp-1">{task.title}</p>
                        {task.deadline && (
                          <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> до {new Date(task.deadline).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase border tracking-wider
                        ${task.priority === 'urgent' ? 'border-rose-500/20 text-rose-400 bg-rose-950/20' : 
                          task.priority === 'high' ? 'border-amber-500/20 text-amber-400 bg-amber-950/20' : 
                          'border-zinc-700 text-zinc-400'}`}
                      >
                        {task.priority === 'urgent' ? 'крит' : task.priority === 'high' ? 'высок' : 'норм'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Интеграции и коннекты */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* GitHub */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Github className="w-5 h-5 text-zinc-100" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-300">GitHub</p>
                <span className="text-[10px] font-mono text-zinc-500">
                  {githubConnected ? 'Подключен' : 'Отключен'}
                </span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full ${githubConnected ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            </div>

            {/* Vercel */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-300">Vercel</p>
                <span className="text-[10px] font-mono text-zinc-500">
                  {vercelConnected ? 'Активен' : 'Отключен'}
                </span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full ${vercelConnected ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            </div>

            {/* Supabase */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-300">Supabase</p>
                <span className="text-[10px] font-mono text-zinc-500">
                  {supabaseConnected ? 'Облако' : 'Локально'}
                </span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
          </div>
        </div>

        {/* Столбец 3: Активность и Закрепленное */}
        <div className="space-y-6">
          {/* Закрепленные файлы */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Star className="w-4 h-4 text-teal-400" /> Закрепленное
            </h3>
            {pinnedNotes.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Нет закрепленных заметок.</p>
            ) : (
              <div className="space-y-2">
                {pinnedNotes.map(note => (
                  <div 
                    key={note.id}
                    onClick={() => setView('notes')}
                    className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer transition-all"
                  >
                    <p className="text-xs font-semibold text-zinc-200 truncate">{note.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {note.folder || 'Заметки'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Журнал действий */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Логи действий
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Live</span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4">Журнал пуст.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-300 font-medium leading-relaxed">{log.description}</p>
                      <span className="text-[9px] font-mono text-zinc-500 mt-0.5 block">
                        {new Date(log.created_at).toLocaleTimeString('ru-RU')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
