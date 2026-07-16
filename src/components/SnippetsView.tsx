import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Snippet } from '../types';
import { 
  Code, Search, Plus, Star, Copy, Check, Trash2, Edit3, X, Eye, 
  Terminal, Tag, FileCode, CheckCheck, FolderCode
} from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { motion, AnimatePresence } from 'motion/react';

interface SnippetsViewProps {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const SnippetsView: React.FC<{ showToast: (text: string, type: 'success' | 'error' | 'info') => void }> = ({ showToast }) => {
  const { snippets, addSnippet, updateSnippet, deleteSnippet } = useApp();

  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Форма добавления/редактирования
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const languages = ['typescript', 'javascript', 'python', 'go', 'rust', 'sql', 'html', 'css', 'bash'];

  const handleOpenCreate = () => {
    setEditId(null);
    setTitle('');
    setLanguage('typescript');
    setDescription('');
    setCode('');
    setTagsInput('');
    setIsOpen(true);
  };

  const handleOpenEdit = (snip: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(snip.id);
    setTitle(snip.title);
    setLanguage(snip.language);
    setDescription(snip.description || '');
    setCode(snip.code);
    setTagsInput(snip.tags.join(', '));
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    if (editId) {
      updateSnippet(editId, { title, language, description, code, tags });
      showToast('Сниппет обновлен', 'success');
    } else {
      addSnippet({
        title,
        language,
        description: description || undefined,
        code,
        tags,
        is_favorite: false
      });
      showToast('Сниппет успешно добавлен', 'success');
    }

    setIsOpen(false);
  };

  const handleToggleFavorite = (snip: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSnippet(snip.id, { is_favorite: !snip.is_favorite });
    showToast(!snip.is_favorite ? 'Сниппет добавлен в избранное' : 'Сниппет убран из избранного', 'info');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить этот сниппет кода?')) {
      deleteSnippet(id);
      showToast('Сниппет кода удален', 'error');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Код скопирован в буфер обмена', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Фильтрация сниппетов
  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
                          s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesLang = filterLang === 'all' || s.language === filterLang;
    return matchesSearch && matchesLang;
  });

  // Внутренний компонент подсветки
  const HighlightedCode: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const [highlightedHtml, setHighlightedHtml] = useState('');

    useEffect(() => {
      try {
        const highlighted = hljs.highlight(code, { language }).value;
        setHighlightedHtml(highlighted);
      } catch (e) {
        const auto = hljs.highlightAuto(code).value;
        setHighlightedHtml(auto);
      }
    }, [code, language]);

    return (
      <pre className="p-4 bg-zinc-950 rounded-xl overflow-x-auto text-xs font-mono border border-zinc-900 leading-relaxed text-zinc-100">
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-100 flex items-center gap-2">
            <Code className="w-6 h-6 text-pink-400" /> Сниппеты
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Персональная база переиспользуемых фрагментов кода с подсветкой синтаксиса.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-zinc-100 text-xs font-semibold shadow-lg shadow-indigo-600/10 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Добавить сниппет
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск по названию, тегам или описанию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-200 text-xs placeholder:text-zinc-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Все языки</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Список сниппетов */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSnippets.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <FileCode className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-400">Сниппеты не найдены</p>
            <p className="text-xs text-zinc-500 mt-1">Добавьте важный фрагмент кода для быстрого доступа.</p>
          </div>
        ) : (
          filteredSnippets.map((snip) => (
            <div 
              key={snip.id}
              className="rounded-2xl glass-panel border border-zinc-850 p-5 sm:p-6 space-y-4 hover:border-zinc-750 transition-all text-left"
            >
              {/* Заголовок сниппета */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-zinc-200">{snip.title}</h2>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-pink-400 font-bold uppercase tracking-wide">
                      {snip.language}
                    </span>
                  </div>
                  {snip.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed">{snip.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(snip.id, snip.code)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 cursor-pointer transition-all flex items-center gap-1 text-[10px]"
                  >
                    {copiedId === snip.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 hidden sm:inline">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Копировать</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => handleToggleFavorite(snip, e)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-zinc-700 cursor-pointer transition-all"
                  >
                    <Star className={`w-3.5 h-3.5 ${snip.is_favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleOpenEdit(snip, e)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-indigo-400 hover:border-zinc-700 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(snip.id, e)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-zinc-700 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Теги */}
              {snip.tags && snip.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {snip.tags.map((t, idx) => (
                    <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-850 flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" /> {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Отображение подсвеченного кода */}
              <HighlightedCode code={snip.code} language={snip.language} />
            </div>
          ))
        )}
      </div>

      {/* Модалка создания/редактирования */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h2 className="text-base font-bold text-zinc-100">
                  {editId ? 'Редактировать сниппет' : 'Создать сниппет кода'}
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs text-zinc-300">
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="space-y-1 col-span-2">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Заголовок *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Например, Сортировка пузырьком"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px] text-zinc-500">Язык *</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300 cursor-pointer"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Описание</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Что делает данный фрагмент кода?"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Теги (через запятую)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Алгоритм, React, Безопасность"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Код сниппета *</label>
                  <textarea
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Вставьте ваш исходный код здесь..."
                    rows={10}
                    className="w-full p-4 bg-zinc-950 border border-zinc-850 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200 font-mono text-xs leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all"
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
