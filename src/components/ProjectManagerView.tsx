import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, ProjectStatus, ProjectPriority } from '../types';
import { 
  FolderGit, Search, SlidersHorizontal, Plus, Calendar, Star, Trash2, Edit3, 
  CheckCircle, Globe, Github, Info, ChevronRight, ChevronDown, Check, X, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectManagerViewProps {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export const ProjectManagerView: React.FC<ProjectManagerViewProps> = ({ showToast, selectedProjectId, setSelectedProjectId }) => {
  const { projects, addProject, updateProject, deleteProject, tasks } = useApp();
  
  // Состояния фильтрации и поиска
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created');

  // Форма добавления проекта
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [tagsInput, setTagsInput] = useState('');
  const [techsInput, setTechsInput] = useState('');

  // Состояние детального просмотра
  const [expandedId, setExpandedId] = useState<string | null>(selectedProjectId);

  // Стейт нового чекбокса внутри расширенного проекта
  const [newChecklistText, setNewChecklistText] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      name,
      description: desc,
      repository_url: repoUrl,
      website_url: webUrl,
      status,
      priority,
      progress,
      start_date: startDate || undefined,
      finish_date: endDate || undefined,
      color,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      technologies: techsInput.split(',').map(t => t.trim()).filter(Boolean),
      todo_checklist: [],
      is_pinned: false
    });

    // Очистка формы
    setName('');
    setDesc('');
    setRepoUrl('');
    setWebUrl('');
    setStatus('active');
    setPriority('medium');
    setProgress(0);
    setStartDate('');
    setEndDate('');
    setColor('#6366F1');
    setTagsInput('');
    setTechsInput('');
    setIsAddOpen(false);
    showToast('Проект успешно создан', 'success');
  };

  const handleTogglePin = (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateProject(id, { is_pinned: !current });
    showToast(!current ? 'Проект закреплен на панели' : 'Проект откреплен', 'info');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Вы действительно хотите удалить проект и все связанные задачи?')) {
      deleteProject(id);
      if (expandedId === id) setExpandedId(null);
      setSelectedProjectId(null);
      showToast('Проект удален', 'error');
    }
  };

  const handleAddChecklistItem = (projectId: string, project: Project) => {
    if (!newChecklistText.trim()) return;
    const updatedChecklist = [...(project.todo_checklist || []), { text: newChecklistText.trim(), done: false }];
    updateProject(projectId, { todo_checklist: updatedChecklist });
    setNewChecklistText('');
    showToast('Пункт чек-листа добавлен', 'success');
  };

  const handleToggleChecklistItem = (projectId: string, project: Project, index: number) => {
    const updatedChecklist = [...(project.todo_checklist || [])];
    updatedChecklist[index].done = !updatedChecklist[index].done;
    
    // Пересчет авто-прогресса на основе чек-листа, если чек-лист полон
    const completed = updatedChecklist.filter(item => item.done).length;
    const calculatedProgress = updatedChecklist.length > 0 
      ? Math.round((completed / updatedChecklist.length) * 100) 
      : project.progress;

    updateProject(projectId, { 
      todo_checklist: updatedChecklist,
      progress: calculatedProgress
    });
  };

  // Фильтрация и сортировка
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                          p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || p.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    // Закрепленные всегда сверху
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'progress') return b.progress - a.progress;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Шапка менеджера */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-100 flex items-center gap-2">
            <FolderGit className="w-6 h-6 text-indigo-400" /> Проекты
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Создание, планирование и мониторинг ваших репозиториев и задач.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 text-xs font-semibold shadow-lg shadow-indigo-600/10 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Новый проект
        </button>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск по названию, описанию или тегам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-200 text-xs placeholder:text-zinc-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Статус */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="planned">В планах</option>
            <option value="completed">Завершенные</option>
            <option value="archived">В архиве</option>
          </select>

          {/* Приоритет */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Любой приоритет</option>
            <option value="urgent">Критический</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>

          {/* Сортировка */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="created">По дате создания</option>
            <option value="name">По алфавиту</option>
            <option value="progress">По прогрессу</option>
          </select>
        </div>
      </div>

      {/* Список проектов */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <FolderGit className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-400">Проекты не найдены</p>
            <p className="text-xs text-zinc-500 mt-1">Измените условия фильтра или создайте первый проект.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = expandedId === project.id;
            const projectTasks = tasks.filter(t => t.project_id === project.id);
            const doneTasks = projectTasks.filter(t => t.status === 'done');
            
            return (
              <motion.div
                key={project.id}
                layoutId={`project-card-${project.id}`}
                className="rounded-2xl glass-panel border border-zinc-800/80 hover:border-zinc-700 overflow-hidden transition-all duration-200"
              >
                {/* Заголовок проекта (сворачиваемый) */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex gap-4 items-start min-w-0">
                    {/* Цветовая плашка */}
                    <div 
                      className="w-3.5 h-12 rounded-full shrink-0" 
                      style={{ backgroundColor: project.color }} 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-zinc-100 truncate">{project.name}</h2>
                        {project.is_pinned && (
                          <Bookmark className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                        )}
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-mono font-bold border tracking-wider
                          ${project.status === 'active' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-950/25' : 
                            project.status === 'completed' ? 'border-indigo-500/20 text-indigo-400 bg-indigo-950/25' : 
                            'border-zinc-700 text-zinc-400'}`}
                        >
                          {project.status === 'active' ? 'В работе' : project.status === 'completed' ? 'Готов' : project.status === 'planned' ? 'В планах' : 'Архив'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{project.description || 'Описания нет'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                    {/* Прогресс */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-zinc-200">{project.progress}%</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Задачи: {doneTasks.length}/{projectTasks.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={(e) => handleTogglePin(project.id, project.is_pinned, e)}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-zinc-700 cursor-pointer transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 ${project.is_pinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-zinc-700 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </div>
                </div>

                {/* Раскрытый детальный вид */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-800 bg-zinc-900/10 p-5 sm:p-6 space-y-6"
                    >
                      {/* Описание проекта целиком */}
                      {project.description && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Описание</h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">{project.description}</p>
                        </div>
                      )}

                      {/* Даты, репозитории, сайт */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">Сроки</span>
                          <p className="text-xs text-zinc-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            {project.start_date ? new Date(project.start_date).toLocaleDateString('ru-RU') : 'не задан'} 
                            {' — '} 
                            {project.finish_date ? new Date(project.finish_date).toLocaleDateString('ru-RU') : 'не задан'}
                          </p>
                        </div>

                        {project.repository_url && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Репозиторий</span>
                            <a 
                              href={project.repository_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs text-indigo-400 hover:underline flex items-center gap-1.5 truncate"
                            >
                              <Github className="w-3.5 h-3.5" /> {project.repository_url.replace('https://github.com/', '')}
                            </a>
                          </div>
                        )}

                        {project.website_url && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Сайт</span>
                            <a 
                              href={project.website_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 truncate"
                            >
                              <Globe className="w-3.5 h-3.5" /> {project.website_url.replace('https://', '')}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Технологии и теги */}
                      <div className="flex flex-wrap gap-4">
                        {project.technologies.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Стек технологий</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {project.technologies.map((t, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded font-mono">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {project.tags.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Метки</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {project.tags.map((t, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-indigo-950/20 border border-indigo-900/30 text-indigo-300 rounded-full">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Заметка о последней работе */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Последний рабочий отчет</h4>
                        <textarea
                          placeholder="Какая задача была решена последней? Обновите отчет..."
                          value={project.last_work_note || ''}
                          onChange={(e) => updateProject(project.id, { last_work_note: e.target.value })}
                          className="w-full p-3 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none text-zinc-300 text-xs rounded-xl"
                          rows={2}
                        />
                      </div>

                      {/* Чек-лист TODO */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">План действий (Checklist)</h4>
                        
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {project.todo_checklist?.map((item, index) => (
                            <div key={index} className="flex items-center gap-2.5">
                              <button
                                onClick={() => handleToggleChecklistItem(project.id, project, index)}
                                className={`w-4.5 h-4.5 rounded border border-zinc-700 flex items-center justify-center cursor-pointer text-zinc-100 transition-all shrink-0
                                  ${item.done ? 'bg-indigo-600 border-indigo-600 text-white' : 'hover:border-zinc-500'}`}
                              >
                                {item.done && <Check className="w-3 h-3" />}
                              </button>
                              <span className={`text-xs ${item.done ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Добавление пункта чек-листа */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Добавить новый шаг планирования..."
                            value={newChecklistText}
                            onChange={(e) => setNewChecklistText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddChecklistItem(project.id, project);
                            }}
                            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddChecklistItem(project.id, project)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-zinc-100 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Модалка создания проекта */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h2 className="text-base font-bold text-zinc-100">Создать новый проект</h2>
                <button onClick={() => setIsAddOpen(false)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs text-zinc-300">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Название проекта *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например, Git X Core API"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Описание</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Краткое резюме целей и задач..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Репозиторий GitHub</label>
                    <input
                      type="url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Адрес сайта</label>
                    <input
                      type="url"
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Статус</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    >
                      <option value="active">В работе</option>
                      <option value="planned">Запланирован</option>
                      <option value="completed">Завершен</option>
                      <option value="archived">Архивирован</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Приоритет</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as ProjectPriority)}
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
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Дата начала</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Дата сдачи</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="space-y-1 col-span-2">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Цветовой маркер</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-8 bg-transparent border-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Старт прогресс</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Теги (через запятую)</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="Web, Mobile, Core"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Стек технологий (запятая)</label>
                    <input
                      type="text"
                      value={techsInput}
                      onChange={(e) => setTechsInput(e.target.value)}
                      placeholder="React, Rust, AWS"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 cursor-pointer transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold cursor-pointer transition-all"
                  >
                    Подтвердить
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
