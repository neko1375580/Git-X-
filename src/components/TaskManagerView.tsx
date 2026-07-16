import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, TaskPriority } from '../types';
import { 
  ClipboardList, Search, Plus, Calendar, Kanban, CheckSquare, Trash2, Edit3,
  ChevronLeft, ChevronRight, X, AlertTriangle, Clock, ArrowLeft, ArrowRight, Tag, BookMarked,
  TrendingUp, Milestone, Hourglass, Activity, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskManagerViewProps {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'planned';
}

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({ showToast }) => {
  const { tasks, addTask, updateTask, deleteTask, projects } = useApp();

  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar' | 'timeline' | 'sprints'>('kanban');
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // --- SPRINT STATE ---
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const cached = localStorage.getItem('gitx_sprints');
    if (cached) return JSON.parse(cached);
    return [
      { id: 'sprint-1', name: 'Спринт 1: Ядро и Безопасность', description: 'Реализация Сейфа ключей и шифрования Web Crypto API', startDate: '2026-07-01', endDate: '2026-07-15', status: 'completed' },
      { id: 'sprint-2', name: 'Спринт 2: Интеграции', description: 'Интеграция с API GitHub, Supabase и консолью Vercel', startDate: '2026-07-16', endDate: '2026-07-30', status: 'active' },
      { id: 'sprint-3', name: 'Спринт 3: UI/UX & PWA', description: 'Разработка оффлайн кэша, анимаций и оптимизация интерфейса', startDate: '2026-08-01', endDate: '2026-08-15', status: 'planned' }
    ];
  });

  const [taskSprintMap, setTaskSprintMap] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem('gitx_task_sprints');
    if (cached) return JSON.parse(cached);
    // Default task sprint assignments
    return { 't3': 'sprint-1', 't1': 'sprint-2', 't2': 'sprint-2' };
  });

  useEffect(() => {
    localStorage.setItem('gitx_sprints', JSON.stringify(sprints));
  }, [sprints]);

  useEffect(() => {
    localStorage.setItem('gitx_task_sprints', JSON.stringify(taskSprintMap));
  }, [taskSprintMap]);

  // Sprint Creation States
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintDesc, setNewSprintDesc] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');
  const [newSprintStatus, setNewSprintStatus] = useState<'active' | 'completed' | 'planned'>('planned');

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: newSprintName.trim(),
      description: newSprintDesc.trim() || undefined,
      startDate: newSprintStart || new Date().toISOString().split('T')[0],
      endDate: newSprintEnd || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      status: newSprintStatus
    };

    setSprints(prev => [...prev, newSprint]);
    setNewSprintName('');
    setNewSprintDesc('');
    setNewSprintStart('');
    setNewSprintEnd('');
    setNewSprintStatus('planned');
    setIsSprintModalOpen(false);
    showToast('Спринт успешно запланирован!', 'success');
  };

  const handleDeleteSprint = (sprintId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот спринт? Задачи будут отвязаны.')) {
      setSprints(prev => prev.filter(s => s.id !== sprintId));
      setTaskSprintMap(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(k => {
          if (copy[k] === sprintId) delete copy[k];
        });
        return copy;
      });
      showToast('Спринт удален', 'error');
    }
  };

  // Форма добавления задачи
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [reminder, setReminder] = useState(false);
  const [labelsInput, setLabelsInput] = useState('');
  const [taskSprintId, setTaskSprintId] = useState('');
  const [pendingSprintTaskTitle, setPendingSprintTaskTitle] = useState<string | null>(null);

  // Automatically map newly created tasks to the selected sprint
  useEffect(() => {
    if (pendingSprintTaskTitle && taskSprintId) {
      const added = tasks.find(t => t.title === pendingSprintTaskTitle && !taskSprintMap[t.id]);
      if (added) {
        setTaskSprintMap(prev => ({ ...prev, [added.id]: taskSprintId }));
        setPendingSprintTaskTitle(null);
        setTaskSprintId('');
      }
    }
  }, [tasks, pendingSprintTaskTitle, taskSprintId]);

  // Состояние календаря
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskSprintId) {
      setPendingSprintTaskTitle(title.trim());
    }

    addTask({
      title,
      description: desc || undefined,
      project_id: projectId || undefined,
      status,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      reminder,
      labels: labelsInput.split(',').map(l => l.trim()).filter(Boolean)
    });

    // Сброс формы
    setTitle('');
    setDesc('');
    setProjectId('');
    setStatus('todo');
    setPriority('medium');
    setDeadline('');
    setReminder(false);
    setLabelsInput('');
    setIsAddOpen(false);
    showToast('Задача создана', 'success');
  };

  const handleMoveStatus = (id: string, currentStatus: TaskStatus, direction: 'left' | 'right') => {
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
    const currentIndex = statuses.indexOf(currentStatus);
    let nextIndex = currentIndex + (direction === 'right' ? 1 : -1);
    
    if (nextIndex >= 0 && nextIndex < statuses.length) {
      updateTask(id, { status: statuses[nextIndex] });
      showToast('Статус задачи обновлен', 'success');
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      deleteTask(id);
      showToast('Задача удалена', 'error');
    }
  };

  // Фильтрация задач
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesProject = filterProject === 'all' || t.project_id === filterProject;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesProject && matchesPriority;
  });

  // Календарь: расчет дней месяца
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Заполнение предыдущего месяца до начала недели (ПН-ВС)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Вс
    
    for (let i = startDayOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    // Дни текущего месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const monthDays = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-400" /> Задачи
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Организация задач на интерактивной Kanban-доске и в календаре дедлайнов.</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                ${activeTab === 'kanban' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Kanban className="w-4 h-4" /> Доска
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                ${activeTab === 'calendar' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Calendar className="w-4 h-4" /> Календарь
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                ${activeTab === 'timeline' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <TrendingUp className="w-4 h-4" /> Дорожная карта
            </button>
            <button
              onClick={() => setActiveTab('sprints')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
                ${activeTab === 'sprints' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Milestone className="w-4 h-4" /> Спринты
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 text-xs font-semibold shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Создать задачу
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск по задачам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-200 text-xs placeholder:text-zinc-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          {/* Фильтр проекта */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Все проекты</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Фильтр приоритета */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Любой приоритет</option>
            <option value="urgent">Критический</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
      </div>

      {activeTab === 'kanban' && (
        /* Kanban Доска */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map((colStatus) => {
            const columnTasks = filteredTasks.filter(t => t.status === colStatus);
            const statusNames = {
              todo: 'Бэклог',
              in_progress: 'В процессе',
              review: 'На проверке',
              done: 'Готово'
            };

            const colColors = {
              todo: 'bg-zinc-700',
              in_progress: 'bg-amber-500',
              review: 'bg-indigo-500',
              done: 'bg-emerald-500'
            };

            return (
              <div key={colStatus} className="flex flex-col rounded-2xl bg-zinc-900/20 border border-zinc-850 p-4 min-h-[450px]">
                {/* Заголовок колонки */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colColors[colStatus]}`} />
                    <span className="text-xs font-bold text-zinc-200">{statusNames[colStatus]}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Список карточек */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                      <CheckSquare className="w-6 h-6 text-zinc-700 mx-auto mb-1" />
                      <p className="text-[10px] text-zinc-500 italic">Колонка пуста</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const proj = projects.find(p => p.id === task.project_id);
                      return (
                        <motion.div
                          key={task.id}
                          layoutId={`task-card-${task.id}`}
                          className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 group transition-all"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-relaxed">
                              {task.title}
                            </h3>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-zinc-600 hover:text-rose-400 p-1 rounded hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2 leading-normal">
                              {task.description}
                            </p>
                          )}

                          {/* Проект-связка */}
                          {proj && (
                            <span 
                              className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium inline-block mt-2"
                              style={{ backgroundColor: `${proj.color}15`, color: proj.color, border: `1px solid ${proj.color}25` }}
                            >
                              {proj.name}
                            </span>
                          )}

                          {/* Метки */}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.labels.map((l, i) => (
                                <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-0.5">
                                  <Tag className="w-2 h-2" /> {l}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Дедлайн и Приоритет */}
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-900">
                            <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                              {task.deadline ? (
                                <>
                                  <Clock className="w-3 h-3" /> 
                                  <span>{new Date(task.deadline).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}</span>
                                </>
                              ) : (
                                <span className="italic">без срока</span>
                              )}
                            </div>

                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border tracking-wider
                              ${task.priority === 'urgent' ? 'border-rose-500/20 text-rose-400 bg-rose-950/20' : 
                                task.priority === 'high' ? 'border-amber-500/20 text-amber-400 bg-amber-950/20' : 
                                'border-zinc-800 text-zinc-400'}`}
                            >
                              {task.priority === 'urgent' ? 'крит' : task.priority === 'high' ? 'высок' : 'норм'}
                            </span>
                          </div>

                          {/* Быстрые стрелочки переключения колонок на мобилках */}
                          <div className="flex justify-end gap-1.5 mt-2 pt-2 border-t border-zinc-900/50">
                            {colStatus !== 'todo' && (
                              <button 
                                onClick={() => handleMoveStatus(task.id, task.status, 'left')}
                                className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 cursor-pointer"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {colStatus !== 'done' && (
                              <button 
                                onClick={() => handleMoveStatus(task.id, task.status, 'right')}
                                className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 cursor-pointer"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'calendar' && (
        /* Календарь дедлайнов */
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-100 capitalize">{monthName}</h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-500 uppercase tracking-wider pb-1">
            <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();

              // Фильтр задач по дедлайну для этой ячейки
              const dayTasks = filteredTasks.filter(t => t.deadline && new Date(t.deadline).toDateString() === day.toDateString());

              return (
                <div 
                  key={idx}
                  className={`min-h-[80px] p-2 rounded-xl border flex flex-col justify-between transition-all
                    ${isToday ? 'border-indigo-500 bg-indigo-950/10' : 'border-zinc-900 bg-zinc-950/20'}
                    ${isCurrentMonth ? 'opacity-100' : 'opacity-25'}`}
                >
                  <span className={`text-[10px] font-mono font-bold block text-left ${isToday ? 'text-indigo-400' : 'text-zinc-400'}`}>
                    {day.getDate()}
                  </span>

                  <div className="space-y-1 mt-1.5">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => showToast(`Задача: ${task.title}`, 'info')}
                        className={`text-[8px] font-semibold px-1 py-0.5 rounded truncate cursor-pointer uppercase tracking-tight
                          ${task.status === 'done' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-950/20 text-amber-400 border border-amber-500/10'}`}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* activeTab === 'timeline' */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Project Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map(proj => {
              const projTasks = tasks.filter(t => t.project_id === proj.id);
              const doneTasks = projTasks.filter(t => t.status === 'done');
              const progress = projTasks.length > 0 ? Math.round((doneTasks.length / projTasks.length) * 100) : 0;
              
              return (
                <div key={proj.id} className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-zinc-200 text-xs">{proj.name}</h4>
                      <p className="text-[10px] text-zinc-500 line-clamp-1">{proj.description || 'Нет описания'}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full">
                      {progress}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Задач: {projTasks.length}</span>
                    <span>Готово: {doneTasks.length}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Chronological Timeline */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Compass className="w-4 h-4" /> Дорожная карта задач (по срокам)
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Сортировка по дедлайну</span>
            </div>

            <div className="relative border-l border-zinc-800 pl-6 ml-3 space-y-6 text-left">
              {filteredTasks
                .filter(t => t.deadline)
                .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                .map((task) => {
                  const date = new Date(task.deadline!);
                  const formattedDate = date.toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' });
                  const proj = projects.find(p => p.id === task.project_id);
                  const isDone = task.status === 'done';

                  return (
                    <div key={task.id} className="relative">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 
                        ${isDone ? 'bg-emerald-500 border-emerald-950' : 'bg-indigo-500 border-indigo-950'}
                      `} />

                      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-850 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formattedDate}
                            </span>
                            {proj && (
                              <span className="text-[9px] font-bold uppercase text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">
                                {proj.name}
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-bold ${isDone ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[10px] text-zinc-400 max-w-xl">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full
                            ${task.priority === 'urgent' ? 'bg-red-950/30 text-red-400 border border-red-500/20' :
                              task.priority === 'high' ? 'bg-amber-950/20 text-amber-400 border border-amber-500/10' :
                              'bg-zinc-900 text-zinc-500'}`}
                          >
                            {task.priority === 'urgent' ? 'крит' : task.priority === 'high' ? 'высок' : 'норм'}
                          </span>

                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full
                            ${task.status === 'done' ? 'bg-emerald-950 text-emerald-400' :
                              task.status === 'review' ? 'bg-indigo-950 text-indigo-400' :
                              task.status === 'in_progress' ? 'bg-amber-950 text-amber-400' :
                              'bg-zinc-900 text-zinc-400'}`}
                          >
                            {task.status === 'done' ? 'готово' :
                              task.status === 'review' ? 'ревью' :
                              task.status === 'in_progress' ? 'в работе' :
                              'бэклог'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {filteredTasks.filter(t => t.deadline).length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-xs italic">
                  Добавьте задачи с дедлайнами для построения интерактивной дорожной карты.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* activeTab === 'sprints' */}
      {activeTab === 'sprints' && (
        <div className="space-y-6">
          {/* Header & New Sprint Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
            <div>
              <h3 className="text-sm font-semibold text-white">Управление Спринтами (Scrum)</h3>
              <p className="text-xs text-zinc-500">Группируйте задачи в итерации, контролируйте темп команды и закрывайте вехи.</p>
            </div>
            <button
              onClick={() => setIsSprintModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Запланировать спринт
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sprint Columns / Cards */}
            <div className="lg:col-span-2 space-y-4 text-left">
              {sprints.map(sprint => {
                const sprintTasks = tasks.filter(t => taskSprintMap[t.id] === sprint.id);
                const doneTasks = sprintTasks.filter(t => t.status === 'done');
                const progress = sprintTasks.length > 0 ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0;

                return (
                  <div key={sprint.id} className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-850 transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full
                            ${sprint.status === 'active' ? 'bg-indigo-950 text-indigo-400' :
                              sprint.status === 'completed' ? 'bg-emerald-950 text-emerald-400' :
                              'bg-zinc-900 text-zinc-500'}`}
                          >
                            {sprint.status === 'active' ? 'Активен' : sprint.status === 'completed' ? 'Завершен' : 'Запланирован'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {sprint.startDate} — {sprint.endDate}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200">{sprint.name}</h4>
                        {sprint.description && (
                          <p className="text-[11px] text-zinc-400">{sprint.description}</p>
                        )}
                      </div>

                      {/* Control buttons for Sprint status */}
                      <div className="flex gap-2">
                        {sprint.status === 'planned' && (
                          <button
                            onClick={() => {
                              setSprints(prev => prev.map(s => s.id === sprint.id ? { ...s, status: 'active' } : s));
                              showToast(`Спринт "${sprint.name}" запущен!`, 'success');
                            }}
                            className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 text-[10px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                          >
                            Запустить
                          </button>
                        )}
                        {sprint.status === 'active' && (
                          <button
                            onClick={() => {
                              setSprints(prev => prev.map(s => s.id === sprint.id ? { ...s, status: 'completed' } : s));
                              showToast(`Спринт "${sprint.name}" завершен!`, 'success');
                            }}
                            className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 text-[10px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                          >
                            Завершить
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSprint(sprint.id)}
                          className="bg-red-950/20 hover:bg-red-900/40 text-red-400 text-[10px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    {/* Progress tracking bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Прогресс: {progress}%</span>
                        <span>Готово: {doneTasks.length} / {sprintTasks.length}</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Task list in this sprint */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Задачи спринта:</span>
                      <div className="space-y-1">
                        {sprintTasks.map(task => {
                          const isDone = task.status === 'done';
                          return (
                            <div key={task.id} className="flex justify-between items-center p-2 rounded-lg bg-[#040406]/55 border border-white/5">
                              <span className={`text-[11px] truncate max-w-[220px] ${isDone ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase
                                  ${task.status === 'done' ? 'bg-emerald-950/30 text-emerald-400' : 'bg-zinc-900 text-zinc-400'}`}
                                >
                                  {task.status}
                                </span>
                                <button
                                  onClick={() => {
                                    setTaskSprintMap(prev => {
                                      const copy = { ...prev };
                                      delete copy[task.id];
                                      return copy;
                                    });
                                    showToast('Задача отвязана от спринта', 'info');
                                  }}
                                  className="text-zinc-500 hover:text-zinc-300 text-[10px] px-1 cursor-pointer"
                                  title="Убрать из спринта"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {sprintTasks.length === 0 && (
                          <div className="text-center py-3 text-zinc-600 text-[11px] italic">
                            В этом спринте нет задач. Перетащите или назначьте задачи из бэклога справа.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sprints.length === 0 && (
                <div className="text-center py-12 bg-zinc-900/20 border border-zinc-900 rounded-2xl text-zinc-500 text-xs">
                  Спринты отсутствуют. Запланируйте первую итерацию сверху.
                </div>
              )}
            </div>

            {/* Backlog / Unassigned Tasks */}
            <div className="p-4 rounded-2xl bg-[#040406]/60 border border-zinc-900 space-y-4 max-h-[600px] overflow-y-auto text-left">
              <div className="border-b border-zinc-900 pb-2">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-500" /> Бэклог задач (вне спринтов)
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">Выберите спринт для назначения задачи.</p>
              </div>

              <div className="space-y-2">
                {tasks
                  .filter(t => !taskSprintMap[t.id])
                  .map(task => (
                    <div key={task.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-semibold text-zinc-300 line-clamp-2">{task.title}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase bg-zinc-900 text-zinc-500">{task.priority}</span>
                      </div>
                      
                      {sprints.length > 0 ? (
                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                          {sprints
                            .filter(s => s.status !== 'completed')
                            .map(s => (
                              <button
                                key={s.id}
                                onClick={() => {
                                  setTaskSprintMap(prev => ({ ...prev, [task.id]: s.id }));
                                  showToast(`Добавлено в ${s.name}`, 'success');
                                }}
                                className="bg-zinc-900 hover:bg-indigo-950 hover:text-indigo-300 text-[9px] text-zinc-400 font-mono px-1.5 py-0.5 rounded shrink-0 cursor-pointer transition-all"
                              >
                                + {s.name.split(':')[0]}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-600 block">Создайте спринт для планирования</span>
                      )}
                    </div>
                  ))}

                {tasks.filter(t => !taskSprintMap[t.id]).length === 0 && (
                  <div className="text-center py-8 text-zinc-600 text-xs italic">
                    Бэклог пуст. Все задачи распределены!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New Sprint Modal */}
          <AnimatePresence>
            {isSprintModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left"
                >
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <Milestone className="w-4 h-4 text-indigo-400" /> Планирование Спринта
                    </h3>
                    <button onClick={() => setIsSprintModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSprint} className="space-y-4 text-xs text-zinc-300">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-[9px] text-zinc-500">Название Спринта *</label>
                      <input
                        type="text"
                        required
                        placeholder="Спринт X: Добавление..."
                        value={newSprintName}
                        onChange={e => setNewSprintName(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-[9px] text-zinc-500">Описание Спринта</label>
                      <textarea
                        placeholder="Каковы цели этого спринта?"
                        value={newSprintDesc}
                        onChange={e => setNewSprintDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-[9px] text-zinc-500">Дата Начала</label>
                        <input
                          type="date"
                          value={newSprintStart}
                          onChange={e => setNewSprintStart(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-[9px] text-zinc-500">Дата Окончания</label>
                        <input
                          type="date"
                          value={newSprintEnd}
                          onChange={e => setNewSprintEnd(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-[9px] text-zinc-500">Статус Спринта</label>
                      <select
                        value={newSprintStatus}
                        onChange={e => setNewSprintStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                      >
                        <option value="planned">Запланирован</option>
                        <option value="active">Активен</option>
                        <option value="completed">Завершен</option>
                      </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsSprintModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold cursor-pointer transition-all"
                      >
                        Запланировать
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Модалка добавления задачи */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h2 className="text-base font-bold text-zinc-100">Создать задачу</h2>
                <button onClick={() => setIsAddOpen(false)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs text-zinc-300">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Заголовок задачи *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Что нужно сделать?"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Описание задачи</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Добавьте контекст, спецификацию или детали..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Связать с проектом</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    >
                      <option value="">Без привязки к проекту</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Назначить в спринт</label>
                    <select
                      value={taskSprintId}
                      onChange={(e) => setTaskSprintId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    >
                      <option value="">Вне спринта (Бэклог)</option>
                      {sprints.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Статус</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    >
                      <option value="todo">Бэклог (Todo)</option>
                      <option value="in_progress">В процессе</option>
                      <option value="review">На проверке</option>
                      <option value="done">Выполнена</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Приоритет</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Критический</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Срок выполнения (дедлайн)</label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Метки (через запятую)</label>
                    <input
                      type="text"
                      value={labelsInput}
                      onChange={(e) => setLabelsInput(e.target.value)}
                      placeholder="UI, Тесты, Фикс"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="reminder"
                    checked={reminder}
                    onChange={(e) => setReminder(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-zinc-900 border-zinc-800 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="reminder" className="text-[11px] font-medium text-zinc-400">
                    Напомнить на электронную почту перед дедлайном
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold cursor-pointer transition-all"
                  >
                    Добавить
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
