import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Note } from '../types';
import { 
  BookOpen, Search, Plus, Star, Folder, Tag, Download, Upload, Trash2, 
  Eye, Edit3, Save, Share2, Archive, X, FileText, ChevronRight
} from 'lucide-react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'motion/react';

interface NotesViewProps {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ showToast }) => {
  const { notes, addNote, updateNote, deleteNote } = useApp();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('split');

  // Создание новой заметки
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteFolder, setNewNoteFolder] = useState('Черновики');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Находим выбранную заметку
  const activeNote = notes.find(n => n.id === activeNoteId);

  // Извлечение уникальных папок
  const folders = Array.from(new Set(notes.map(n => n.folder).filter(Boolean))) as string[];

  // Фильтрация заметок
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.content.toLowerCase().includes(search.toLowerCase()) ||
                          n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFolder = activeFolder === 'all' || n.folder === activeFolder;
    return matchesSearch && matchesFolder;
  }).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Автосохранение при редактировании текста
  const handleContentChange = (content: string) => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, { content });
  };

  const handleTitleChange = (title: string) => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, { title });
  };

  const handleFolderChange = (folder: string) => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, { folder });
  };

  const handleTagsChange = (tagsStr: string) => {
    if (!activeNoteId) return;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    updateNote(activeNoteId, { tags });
  };

  const handleTogglePin = (note: Note) => {
    updateNote(note.id, { is_pinned: !note.is_pinned });
    showToast(!note.is_pinned ? 'Заметка закреплена' : 'Заметка откреплена', 'success');
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Удалить эту заметку?')) {
      deleteNote(id);
      if (activeNoteId === id) {
        setActiveNoteId(notes.find(n => n.id !== id)?.id || null);
      }
      showToast('Заметка перемещена в корзину', 'error');
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const folder = newNoteFolder.trim() || 'Черновики';
    addNote({
      title: newNoteTitle,
      content: `# ${newNoteTitle}\n\nНачните писать здесь...`,
      folder,
      is_pinned: false,
      tags: []
    });

    setNewNoteTitle('');
    setIsCreateOpen(false);
    showToast('Заметка создана', 'success');
  };

  // Экспорт заметки в .md
  const handleExportMD = (note: Note) => {
    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${note.title || 'untitled'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Файл скачан (.md)', 'success');
  };

  // Рендеринг HTML из Markdown с помощью marked
  const renderMarkdown = (text: string) => {
    try {
      const html = marked.parse(text);
      return { __html: typeof html === 'string' ? html : '' };
    } catch (err) {
      return { __html: '<p class="text-rose-400">Ошибка парсинга Markdown</p>' };
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-5">
      {/* Левая панель: Справочник папок и список заметок */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
        {/* Фильтр папок */}
        <div className="p-4 rounded-xl glass-panel space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-indigo-400" /> Разделы
            </h3>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              Новая <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 max-h-[140px] overflow-y-auto">
            <button
              onClick={() => setActiveFolder('all')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex justify-between items-center cursor-pointer transition-all
                ${activeFolder === 'all' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'}`}
            >
              <span>Все заметки</span>
              <span className="font-mono text-[9px] text-zinc-500">{notes.length}</span>
            </button>

            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex justify-between items-center cursor-pointer transition-all
                  ${activeFolder === folder ? 'bg-indigo-950/20 text-indigo-300 border border-indigo-900/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'}`}
              >
                <span className="truncate"># {folder}</span>
                <span className="font-mono text-[9px] text-zinc-500">
                  {notes.filter(n => n.folder === folder).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Список заметок */}
        <div className="flex-1 rounded-xl glass-panel p-4 flex flex-col gap-3 min-h-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск по заметкам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-850 focus:border-zinc-750 focus:outline-none rounded-xl text-xs text-zinc-200"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredNotes.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-6">Заметок не найдено</p>
            ) : (
              filteredNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-left flex flex-col gap-1.5
                    ${note.id === activeNoteId 
                      ? 'border-indigo-500/30 bg-indigo-950/15' 
                      : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-800'}`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <p className={`text-xs font-bold truncate ${note.id === activeNoteId ? 'text-indigo-300' : 'text-zinc-200'}`}>
                      {note.title || 'Без названия'}
                    </p>
                    {note.is_pinned && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {note.content.replace(/[#*`_-]/g, '').slice(0, 100)}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500">
                      {note.folder || 'Общее'}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600">
                      {new Date(note.updated_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Правая панель: Редактор и Превью */}
      <div className="flex-1 rounded-2xl glass-panel overflow-hidden flex flex-col">
        {activeNote ? (
          <>
            {/* Панель управления редактора */}
            <div className="p-4 border-b border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/40">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-transparent border-b border-transparent focus:border-zinc-700 text-sm font-bold text-zinc-100 focus:outline-none flex-1 py-1"
                />
                <input
                  type="text"
                  value={activeNote.folder || ''}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  placeholder="Папка"
                  className="bg-zinc-900 px-2.5 py-1 rounded-lg text-[10px] font-mono border border-zinc-800 text-zinc-400 focus:outline-none w-24"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Вкладки отображения */}
                <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('edit')} 
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer ${activeTab === 'edit' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400'}`}
                  >
                    Редактор
                  </button>
                  <button 
                    onClick={() => setActiveTab('preview')} 
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer ${activeTab === 'preview' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400'}`}
                  >
                    Превью
                  </button>
                  <button 
                    onClick={() => setActiveTab('split')} 
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer hidden md:block ${activeTab === 'split' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400'}`}
                  >
                    Экран 50/50
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleTogglePin(activeNote)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <Star className={`w-3.5 h-3.5 ${activeNote.is_pinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleExportMD(activeNote)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Метки в заголовке */}
            <div className="px-4 py-2 bg-zinc-900/10 border-b border-zinc-850 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Теги (через запятую)..."
                value={activeNote.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(e.target.value)}
                className="bg-transparent text-[10px] text-zinc-400 focus:outline-none flex-1 py-0.5 placeholder:text-zinc-600"
              />
            </div>

            {/* Тело редактора/превью */}
            <div className="flex-1 flex overflow-hidden">
              {/* Редактор */}
              {(activeTab === 'edit' || (activeTab === 'split')) && (
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className={`flex-1 p-5 bg-zinc-950 border-0 focus:outline-none resize-none font-mono text-xs text-zinc-300 leading-relaxed
                    ${activeTab === 'split' ? 'border-r border-zinc-850' : ''}`}
                  placeholder="Напишите что-нибудь потрясающее с помощью Markdown..."
                />
              )}

              {/* Превью */}
              {(activeTab === 'preview' || (activeTab === 'split')) && (
                <div className="flex-1 p-6 overflow-y-auto bg-zinc-900/5 text-left text-zinc-300">
                  <div 
                    className="markdown-body"
                    dangerouslySetInnerHTML={renderMarkdown(activeNote.content)} 
                  />
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-zinc-850 text-[10px] font-mono text-zinc-500 bg-zinc-950/40 text-right">
              Автосохранение активно • Символов: {activeNote.content.length}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-500">
            <BookOpen className="w-12 h-12 text-zinc-700 mb-2" />
            <p className="text-sm font-semibold">Заметка не выбрана</p>
            <p className="text-xs text-zinc-600 mt-1">Выберите заметку слева или создайте новую.</p>
          </div>
        )}
      </div>

      {/* Модалка создания папки/заметки */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h2 className="text-base font-bold text-zinc-100">Создать заметку</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNote} className="space-y-4 text-xs text-zinc-300">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Название заметки *</label>
                  <input
                    type="text"
                    required
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Название вашей заметки..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Папка / Раздел</label>
                  <input
                    type="text"
                    value={newNoteFolder}
                    onChange={(e) => setNewNoteFolder(e.target.value)}
                    placeholder="Например, Черновики, Идеи..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
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
