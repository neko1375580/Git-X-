import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { useVault } from '../contexts/VaultContext';
import { AIService, AIServiceCategory } from '../types';
import { 
  Bot, Search, Star, ExternalLink, Plus, Edit3, Trash2, X, Send, 
  Sparkles, ShieldAlert, Cpu, ListFilter, HelpCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIServicesViewProps {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AIServicesView: React.FC<AIServicesViewProps> = ({ showToast }) => {
  const { aiServices, addAIService, updateAIService, deleteAIService, toggleFavoriteService, addActivityLog } = useApp();
  const { decryptedKeys, isUnlocked } = useVault();

  const [activeTab, setActiveTab] = useState<'directory' | 'chat'>('directory');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Чат-ассистент состояния
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Привет! Я ваш ИИ-помощник в Git X. Выберите модель и введите запрос.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Форма нового сервиса
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<AIServiceCategory>('chat');
  const [description, setDescription] = useState('');

  const categories: { value: AIServiceCategory; label: string }[] = [
    { value: 'chat', label: 'Чат-боты' },
    { value: 'coding', label: 'Кодинг' },
    { value: 'image', label: 'Генерация картинок' },
    { value: 'video', label: 'Видео' },
    { value: 'music', label: 'Аудио' },
    { value: 'search', label: 'Поисковые ИИ' },
    { value: 'agents', label: 'Агенты' },
    { value: 'productivity', label: 'Продуктивность' }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    addAIService({
      name,
      url,
      category,
      description
    });

    setName('');
    setUrl('');
    setCategory('chat');
    setDescription('');
    setIsOpen(false);
    showToast('ИИ Сервис успешно добавлен', 'success');
  };

  const handleDeleteService = (id: string, name: string) => {
    if (confirm(`Удалить сервис ${name}?`)) {
      deleteAIService(id);
      showToast('Сервис удален', 'error');
    }
  };

  // Метод отправки стриминг запроса к Gemini / OpenAI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const key = provider === 'gemini' ? decryptedKeys.geminiKey : decryptedKeys.openaiKey;

    if (!isUnlocked || !key) {
      showToast(`Сейф заблокирован или API-ключ для ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} отсутствует в сейфе.`, 'error');
      return;
    }

    const userMsg = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    // Добавляем пустой ассистент ответ, который будем наполнять стримом
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      if (provider === 'gemini') {
        // Вызов Google Gemini REST API с поддержкой потока (v1beta)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userMsg }] }]
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Ошибка API Gemini: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullContent = '';

        if (!reader) throw new Error('Не удалось запустить чтение потока ответов');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // Парсим чанк. Поток от Gemini возвращает JSON чанки в обрамлении квадратных скобок.
          // Чтобы избежать ошибок разбора незавершенного JSON, извлекаем регуляркой все "text" значения.
          const textMatches = [...chunk.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
          for (const match of textMatches) {
            // Разэскейпим бэкслеши в тексте
            let text = match[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            fullContent += text;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: fullContent };
              return updated;
            });
          }
        }
      } else {
        // OpenAI Chat Completion API со стримингом
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: userMsg }],
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`Ошибка API OpenAI: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullContent = '';

        if (!reader) throw new Error('Не удалось запустить чтение потока ответов');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.includes('[DONE]')) continue;
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.replace('data: ', ''));
                const content = parsed.choices[0]?.delta?.content || '';
                fullContent += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: fullContent };
                  return updated;
                });
              } catch (e) {
                // Игнорируем ошибки парсинга неполных чанков
              }
            }
          }
        }
      }
      
      addActivityLog('ai_chat', `Выполнен запрос к ИИ ассистенту (${provider.toUpperCase()})`);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: 'assistant', 
          content: `Ошибка: ${err.message || 'Не удалось получить ответ. Проверьте ваш API-ключ в сейфе настроек и подключение к интернету.'}` 
        };
        return updated;
      });
      showToast('Ошибка при отправке запроса', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Фильтрация каталога
  const filteredServices = aiServices.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-100 flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" /> ИИ Инструменты
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Каталог популярных ИИ систем и встроенные чаты с поддержкой API ключей.</p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
              ${activeTab === 'directory' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Каталог ИИ
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all
              ${activeTab === 'chat' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            ИИ Ассистент
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        /* ================= КАТАЛОГ СЕРВИСОВ ================= */
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск по ИИ сервисам..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-200 text-xs placeholder:text-zinc-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Все категории</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-zinc-100 text-xs font-semibold rounded-xl cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map(service => {
              const catObj = categories.find(c => c.value === service.category);
              return (
                <motion.div
                  key={service.id}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl glass-panel border border-zinc-850 p-5 flex flex-col justify-between hover:border-zinc-750 transition-all text-left"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-xs font-bold text-zinc-200">{service.name}</h2>
                        {service.is_favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleFavoriteService(service.id)}
                          className="p-1 rounded bg-zinc-900/50 text-zinc-500 hover:text-amber-400 cursor-pointer"
                        >
                          <Star className={`w-3 h-3 ${service.is_favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                        {service.is_custom && (
                          <button
                            onClick={() => handleDeleteService(service.id, service.name)}
                            className="p-1 rounded bg-zinc-900/50 text-zinc-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-normal line-clamp-2">{service.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-900">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-400">
                      {catObj?.label || service.category}
                    </span>

                    <a
                      href={service.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      Открыть <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= ВСТРОЕННЫЙ ИИ ЧАТ ================= */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-[calc(100vh-230px)]">
          {/* Левая панель настроек чата */}
          <div className="lg:col-span-1 p-5 rounded-2xl glass-panel space-y-5 text-left h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" /> ИИ провайдер
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setProvider('gemini')}
                className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all
                  ${provider === 'gemini' 
                    ? 'border-indigo-500/30 bg-indigo-950/15' 
                    : 'border-zinc-850 hover:border-zinc-750 bg-zinc-950/20'}`}
              >
                <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  Google Gemini
                  {decryptedKeys.geminiKey ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                </span>
                <span className="text-[10px] text-zinc-500">Ультрабыстрая модель Gemini 2.5 Flash</span>
              </button>

              <button
                onClick={() => setProvider('openai')}
                className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all
                  ${provider === 'openai' 
                    ? 'border-indigo-500/30 bg-indigo-950/15' 
                    : 'border-zinc-850 hover:border-zinc-750 bg-zinc-950/20'}`}
              >
                <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  OpenAI ChatGPT
                  {decryptedKeys.openaiKey ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                </span>
                <span className="text-[10px] text-zinc-500">Продвинутая модель GPT-4o Mini</span>
              </button>
            </div>

            {/* Проверка ключей */}
            {!isUnlocked ? (
              <div className="p-3.5 rounded-xl bg-rose-950/15 border border-rose-500/20 text-rose-400 text-xs flex gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="leading-relaxed">Сейф ключей заблокирован. Разблокируйте его в Настройках, чтобы использовать ваши API-ключи.</p>
              </div>
            ) : !(provider === 'gemini' ? decryptedKeys.geminiKey : decryptedKeys.openaiKey) ? (
              <div className="p-3.5 rounded-xl bg-amber-950/15 border border-amber-500/20 text-amber-400 text-xs flex gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="leading-relaxed">API-ключ для этой модели не добавлен в Сейф. Вы можете добавить его в Настройках.</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/10 border border-emerald-500/10 text-emerald-400 text-xs flex gap-2">
                <Sparkles className="w-5 h-5 shrink-0" />
                <p className="leading-relaxed">Ключ дешифрован и активен. Безопасное потоковое соединение готово.</p>
              </div>
            )}
          </div>

          {/* Правая панель самого чата */}
          <div className="lg:col-span-3 rounded-2xl glass-panel flex flex-col overflow-hidden h-full">
            {/* Окно сообщений */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl border text-left text-xs leading-relaxed
                      ${msg.role === 'user' 
                        ? 'bg-indigo-600/10 border-indigo-500/20 text-zinc-100 rounded-br-none' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-300 rounded-bl-none'}`}
                  >
                    <div className="font-bold text-[9px] uppercase tracking-wider text-zinc-500 mb-1">
                      {msg.role === 'user' ? 'Вы' : provider.toUpperCase()}
                    </div>
                    {msg.content === '' && isLoading ? (
                      <div className="flex items-center gap-1.5 text-zinc-500 font-mono py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> поток токенов...
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Ввод сообщения */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-850 bg-zinc-950/40 flex gap-2">
              <input
                type="text"
                disabled={isLoading || !isUnlocked || !(provider === 'gemini' ? decryptedKeys.geminiKey : decryptedKeys.openaiKey)}
                placeholder={isLoading ? 'Ожидание ответа модели...' : !isUnlocked ? 'Разблокируйте сейф для общения' : 'Введите запрос к ИИ-ассистенту...'}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim() || !isUnlocked || !(provider === 'gemini' ? decryptedKeys.geminiKey : decryptedKeys.openaiKey)}
                className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-100 font-bold flex items-center justify-center cursor-pointer transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модалка создания своего сервиса ИИ */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h2 className="text-base font-bold text-zinc-100">Добавить ИИ инструмент</h2>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4 text-xs text-zinc-300">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Название ИИ сервиса *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например, Midjourney"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">URL-адрес сайта *</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AIServiceCategory)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-300 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-[10px] text-zinc-500">Описание сервиса</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Пару слов о возможностях сервиса..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-700 focus:outline-none text-zinc-200"
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
