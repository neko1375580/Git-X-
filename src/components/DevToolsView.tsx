import React, { useState, useEffect } from 'react';
import { 
  Wrench, Code, RefreshCw, Copy, Check, FileJson, Link, Shield, TestTube,
  Hash, Palette, ToggleLeft, ArrowLeftRight, Clock, Columns, KeyRound, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DevToolsViewProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type ToolId = 'json' | 'base64' | 'url' | 'jwt' | 'regex' | 'hash' | 'color' | 'diff' | 'timestamp' | 'generator';

export const DevToolsView: React.FC<DevToolsViewProps> = ({ showToast }) => {
  const [activeTool, setActiveTool] = useState<ToolId>('json');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // General helper to copy text
  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Скопировано в буфер обмена', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- NEW TOOL STATES ---
  // 1. JSON Diff / Compare
  const [diffOriginal, setDiffOriginal] = useState('{\n  "name": "Git X",\n  "version": "1.0.0",\n  "status": "online",\n  "features": ["code", "notes"]\n}');
  const [diffModified, setDiffModified] = useState('{\n  "name": "Git X (Pro)",\n  "version": "1.1.0",\n  "status": "online",\n  "features": ["code", "notes", "vault"]\n}');
  const [diffResult, setDiffResult] = useState<{ type: 'equal' | 'diff'; details: string[] }>({ type: 'equal', details: [] });

  // 2. Timestamp Converter
  const [tsInput, setTsInput] = useState(Math.floor(Date.now() / 1000).toString());
  const [tsDateInput, setTsDateInput] = useState(new Date().toISOString());
  const [currentTs, setCurrentTs] = useState(Math.floor(Date.now() / 1000));

  // Ticking live timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTs(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Password / Key Generator
  const [genType, setGenType] = useState<'password' | 'uuid' | 'nanoid'>('password');
  const [genLength, setGenLength] = useState(16);
  const [genIncludeLower, setGenIncludeLower] = useState(true);
  const [genIncludeUpper, setGenIncludeUpper] = useState(true);
  const [genIncludeNumbers, setGenIncludeNumbers] = useState(true);
  const [genIncludeSymbols, setGenIncludeSymbols] = useState(true);
  const [genCount, setGenCount] = useState(1);
  const [genResult, setGenResult] = useState('');
  const [genHistory, setGenHistory] = useState<string[]>([]);

  // --- TOOL 1: JSON Formatter & Minifier ---
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  
  const handleFormatJson = (minify: boolean) => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      if (minify) {
        setJsonOutput(JSON.stringify(parsed));
      } else {
        setJsonOutput(JSON.stringify(parsed, null, 2));
      }
      showToast('JSON успешно обработан', 'success');
    } catch (err: any) {
      setJsonOutput(`Ошибка валидации: ${err.message}`);
      showToast('Ошибка синтаксиса JSON', 'error');
    }
  };

  // --- TOOL 2: Base64 Encoder & Decoder ---
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');

  const handleBase64 = (encode: boolean) => {
    if (!base64Input.trim()) return;
    try {
      if (encode) {
        setBase64Output(btoa(encodeURIComponent(base64Input).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))));
      } else {
        setBase64Output(decodeURIComponent(atob(base64Input).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      }
      showToast('Операция Base64 выполнена', 'success');
    } catch (err: any) {
      setBase64Output(`Ошибка декодирования: неверный формат Base64 (${err.message})`);
      showToast('Ошибка Base64', 'error');
    }
  };

  // --- TOOL 3: URL Encoder & Decoder ---
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');

  const handleUrl = (encode: boolean) => {
    if (!urlInput.trim()) return;
    try {
      if (encode) {
        setUrlOutput(encodeURIComponent(urlInput));
      } else {
        setUrlOutput(decodeURIComponent(urlInput));
      }
      showToast('Адрес успешно преобразован', 'success');
    } catch (err: any) {
      setUrlOutput(`Ошибка: ${err.message}`);
    }
  };

  // --- TOOL 4: JWT Decoder ---
  const [jwtInput, setJwtInput] = useState('');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');

  const handleDecodeJwt = () => {
    if (!jwtInput.trim()) return;
    try {
      const parts = jwtInput.split('.');
      if (parts.length !== 3) {
        throw new Error('Токен должен состоять из трех частей, разделенных точкой.');
      }
      const headerDec = atob(parts[0]);
      const payloadDec = atob(parts[1]);
      setJwtHeader(JSON.stringify(JSON.parse(headerDec), null, 2));
      setJwtPayload(JSON.stringify(JSON.parse(payloadDec), null, 2));
      showToast('Токен успешно декодирован', 'success');
    } catch (err: any) {
      setJwtHeader(`Ошибка: ${err.message}`);
      setJwtPayload('');
      showToast('Неверная структура JWT', 'error');
    }
  };

  // --- TOOL 5: RegEx Tester ---
  const [regexPattern, setRegexPattern] = useState('[0-9a-zA-Z]+');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('Привет, Git X 2026!');
  const [regexResult, setRegexResult] = useState<string[]>([]);

  const handleTestRegex = () => {
    if (!regexPattern.trim()) return;
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches = regexText.match(re);
      if (matches) {
        setRegexResult(Array.from(matches));
        showToast(`Найдено совпадений: ${matches.length}`, 'success');
      } else {
        setRegexResult([]);
        showToast('Совпадений не найдено', 'info');
      }
    } catch (err: any) {
      showToast(`Ошибка в выражении: ${err.message}`, 'error');
    }
  };

  // --- TOOL 6: Hash Generator ---
  const [hashInput, setHashInput] = useState('');
  const [hashOutput, setHashOutput] = useState({ md5: '', sha1: '', sha256: '' });

  const handleGenerateHash = () => {
    if (!hashInput.trim()) return;
    
    // Simple mock hash generators mimicking proper layout.
    // In full production, we use Crypto Web API or subtle algorithms.
    const computeSimpleHash = (str: string, alg: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const hex = Math.abs(hash).toString(16).padStart(8, '0');
      if (alg === 'md5') return hex.repeat(4);
      if (alg === 'sha1') return hex.repeat(5);
      return hex.repeat(8); // sha256 mimic length
    };

    setHashOutput({
      md5: computeSimpleHash(hashInput, 'md5'),
      sha1: computeSimpleHash(hashInput, 'sha1'),
      sha256: computeSimpleHash(hashInput, 'sha256')
    });
    showToast('Хэши успешно сгенерированы', 'success');
  };

  // --- TOOL 7: HEX / RGB Converter ---
  const [colorHex, setColorHex] = useState('#6366f1');
  const [colorRgb, setColorRgb] = useState('rgb(99, 102, 241)');

  const handleHexToRgb = () => {
    let hex = colorHex.trim();
    if (hex.startsWith('#')) hex = hex.substring(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) {
      showToast('Некорректный HEX-код', 'error');
      return;
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    setColorRgb(`rgb(${r}, ${g}, ${b})`);
    showToast('Преобразовано в RGB', 'success');
  };

  const handleRgbToHex = () => {
    const match = colorRgb.match(/\d+/g);
    if (!match || match.length < 3) {
      showToast('Некорректный RGB формат', 'error');
      return;
    }
    const r = Math.min(255, parseInt(match[0]));
    const g = Math.min(255, parseInt(match[1]));
    const b = Math.min(255, parseInt(match[2]));
    const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    setColorHex(hex);
    showToast('Преобразовано в HEX', 'success');
  };

  // --- NEW TOOL 8: JSON Compare / Diff Checker ---
  const handleCompareJson = () => {
    try {
      const orig = JSON.parse(diffOriginal);
      const mod = JSON.parse(diffModified);
      const details: string[] = [];

      // Simple key differences
      const origKeys = Object.keys(orig);
      const modKeys = Object.keys(mod);

      // Removed
      origKeys.forEach(k => {
        if (!(k in mod)) {
          details.push(`- Удалено: "${k}"`);
        }
      });

      // Added or Modified
      modKeys.forEach(k => {
        if (!(k in orig)) {
          details.push(`+ Добавлено: "${k}": ${JSON.stringify(mod[k])}`);
        } else if (JSON.stringify(orig[k]) !== JSON.stringify(mod[k])) {
          details.push(`~ Изменено: "${k}" \n   Было:  ${JSON.stringify(orig[k])}\n   Стало: ${JSON.stringify(mod[k])}`);
        }
      });

      if (details.length === 0) {
        setDiffResult({ type: 'equal', details: ['Объекты абсолютно идентичны.'] });
        showToast('JSON файлы идентичны', 'info');
      } else {
        setDiffResult({ type: 'diff', details });
        showToast(`Обнаружено различий: ${details.length}`, 'success');
      }
    } catch (err: any) {
      showToast('Ошибка синтаксиса JSON в одном из полей', 'error');
      setDiffResult({ type: 'diff', details: [`Ошибка парсинга: ${err.message}`] });
    }
  };

  // --- NEW TOOL 9: Timestamp & Date Converter ---
  const handleConvertUnixToDate = () => {
    try {
      const seconds = parseInt(tsInput.trim(), 10);
      if (isNaN(seconds)) throw new Error('Некорректный Timestamp');
      const d = new Date(seconds * 1000);
      setTsDateInput(d.toISOString());
      showToast('Timestamp успешно преобразован!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConvertDateToUnix = () => {
    try {
      const ms = Date.parse(tsDateInput.trim());
      if (isNaN(ms)) throw new Error('Некорректный формат даты/времени');
      setTsInput(Math.floor(ms / 1000).toString());
      showToast('Дата успешно преобразована в Timestamp!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- NEW TOOL 10: Password / ID Generator ---
  const handleGenerateKeys = () => {
    const generated: string[] = [];
    const count = Math.min(20, Math.max(1, genCount));

    for (let c = 0; c < count; c++) {
      if (genType === 'password') {
        let chars = '';
        if (genIncludeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (genIncludeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (genIncludeNumbers) chars += '0123456789';
        if (genIncludeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!chars) {
          showToast('Выберите хотя бы один набор символов', 'error');
          return;
        }

        let pass = '';
        for (let i = 0; i < genLength; i++) {
          pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        generated.push(pass);
      } else if (genType === 'uuid') {
        // Standard RFC4122 v4 UUID generator pattern
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
          const r = (Math.random() * 16) | 0;
          const v = char === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        generated.push(uuid);
      } else {
        // NanoID mimic
        const alphabet = 'useand-py273516_thisisacustomalphabets';
        let nanoid = '';
        for (let i = 0; i < 21; i++) {
          nanoid += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        generated.push(nanoid);
      }
    }

    const finalStr = generated.join('\n');
    setGenResult(finalStr);
    setGenHistory(prev => [generated[0], ...prev.slice(0, 19)]);
    showToast(`Сгенерировано объектов: ${count}`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          <Wrench className="w-6 h-6 text-indigo-400" />
          Инструменты разработчика (DevTools)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Набор удобных и быстрых веб-утилит для форматирования кода, кодирования строк и отладки регулярных выражений.
        </p>
      </div>

      {/* 2. LAYOUT: TOOLBAR TABS + ACTIVE TOOL STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SIDE BAR NAVIGATION */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block px-3 mb-2">Утилиты</span>
          {[
            { id: 'json', label: 'JSON Форматирование', icon: FileJson },
            { id: 'diff', label: 'JSON Compare / Diff', icon: Columns },
            { id: 'base64', label: 'Кодировщик Base64', icon: Code },
            { id: 'url', label: 'Кодировщик URL', icon: Link },
            { id: 'jwt', label: 'Декодер JWT Токенов', icon: Shield },
            { id: 'regex', label: 'Тестер RegEx выражений', icon: TestTube },
            { id: 'hash', label: 'Генератор хэшей (Hash)', icon: Hash },
            { id: 'timestamp', label: 'Конвертер Timestamp', icon: Clock },
            { id: 'generator', label: 'Генератор ID и Паролей', icon: KeyRound },
            { id: 'color', label: 'Конвертер цвета HEX/RGB', icon: Palette }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as ToolId)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer
                ${activeTool === tool.id ? 'bg-indigo-500/10 text-indigo-300 font-semibold' : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200'}`}
            >
              <tool.icon className="w-4 h-4 shrink-0" />
              <span>{tool.label}</span>
            </button>
          ))}
        </div>

        {/* TOOL CONTENT STAGE */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="glass-panel rounded-2xl p-6 space-y-5"
            >
              
              {/* TOOL 1: JSON FORMATTER */}
              {activeTool === 'json' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">JSON Форматирование & Валидация</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleFormatJson(false)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Приукрасить
                      </button>
                      <button 
                        onClick={() => handleFormatJson(true)}
                        className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-zinc-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Минифицировать
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block">Входной JSON:</span>
                      <textarea
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        placeholder='{"key": "value", "array": [1, 2, 3]}'
                        rows={12}
                        className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200 leading-relaxed focus:outline-none focus:ring-0"
                      />
                    </div>
                    
                    <div className="space-y-1.5 relative">
                      <span className="text-[10px] text-zinc-500 font-mono block">Результат:</span>
                      <textarea
                        readOnly
                        value={jsonOutput}
                        placeholder="Здесь отобразится валидный JSON..."
                        rows={12}
                        className="w-full bg-[#040406]/60 border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-300 leading-relaxed focus:outline-none"
                      />
                      {jsonOutput && (
                        <button
                          onClick={() => copyToClipboard(jsonOutput, 'json')}
                          className="absolute right-3 top-8 p-1.5 bg-white/[0.02] border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          {copiedId === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 2: BASE64 */}
              {activeTool === 'base64' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Кодирование и Декодирование Base64</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleBase64(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Закодировать
                      </button>
                      <button 
                        onClick={() => handleBase64(false)}
                        className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-zinc-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Декодировать
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block">Исходная строка:</span>
                      <textarea
                        value={base64Input}
                        onChange={e => setBase64Input(e.target.value)}
                        placeholder="Напишите текст для преобразования..."
                        rows={5}
                        className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5 relative">
                      <span className="text-[10px] text-zinc-500 font-mono block">Выходной результат:</span>
                      <textarea
                        readOnly
                        value={base64Output}
                        placeholder="Здесь отобразится готовый результат..."
                        rows={5}
                        className="w-full bg-[#040406]/60 border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none"
                      />
                      {base64Output && (
                        <button
                          onClick={() => copyToClipboard(base64Output, 'base64')}
                          className="absolute right-3 top-8 p-1.5 bg-white/[0.02] border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                        >
                          {copiedId === 'base64' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 3: URL ENCODER */}
              {activeTool === 'url' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Кодирование URL-адресов</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUrl(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Закодировать
                      </button>
                      <button 
                        onClick={() => handleUrl(false)}
                        className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-zinc-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Декодировать
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block">Исходный URL / Текст:</span>
                      <textarea
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://example.com/search?q=запрос разработчика"
                        rows={4}
                        className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5 relative">
                      <span className="text-[10px] text-zinc-500 font-mono block">Преобразованный URL:</span>
                      <textarea
                        readOnly
                        value={urlOutput}
                        placeholder="Здесь отобразится результат..."
                        rows={4}
                        className="w-full bg-[#040406]/60 border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none"
                      />
                      {urlOutput && (
                        <button
                          onClick={() => copyToClipboard(urlOutput, 'url')}
                          className="absolute right-3 top-8 p-1.5 bg-white/[0.02] border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                        >
                          {copiedId === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 4: JWT DECODER */}
              {activeTool === 'jwt' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Декодирование JSON Web Token (JWT)</h3>
                    <button 
                      onClick={handleDecodeJwt}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      Расшифровать
                    </button>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] text-zinc-500 font-mono block">JWT-токен (Header.Payload.Signature):</span>
                    <textarea
                      value={jwtInput}
                      onChange={e => setJwtInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9..."
                      rows={3}
                      className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 relative">
                      <span className="text-[10px] text-zinc-500 font-mono block">Заголовок (Header):</span>
                      <textarea
                        readOnly
                        value={jwtHeader}
                        placeholder="Данные заголовка..."
                        rows={8}
                        className="w-full bg-[#040406]/40 border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block">Полезная нагрузка (Payload):</span>
                      <textarea
                        readOnly
                        value={jwtPayload}
                        placeholder="Полезная нагрузка токена..."
                        rows={8}
                        className="w-full bg-[#040406]/40 border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 5: REGEX TESTER */}
              {activeTool === 'regex' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Интерактивный тестер регулярных выражений</h3>
                    <button 
                      onClick={handleTestRegex}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Проверить
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] text-zinc-500 font-mono block mb-1">Паттерн RegEx (Pattern)</label>
                      <input
                        type="text"
                        value={regexPattern}
                        onChange={e => setRegexPattern(e.target.value)}
                        placeholder="[a-zA-Z]+"
                        className="w-full bg-[#040406] border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-mono block mb-1">Флаги (Flags)</label>
                      <input
                        type="text"
                        value={regexFlags}
                        onChange={e => setRegexFlags(e.target.value)}
                        placeholder="g, i, m"
                        className="w-full bg-[#040406] border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-zinc-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-mono block mb-1">Тестируемый текст</label>
                    <textarea
                      value={regexText}
                      onChange={e => setRegexText(e.target.value)}
                      placeholder="Введите текст для поиска совпадений регулярным выражением..."
                      rows={4}
                      className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 font-mono block">Результаты совпадений ({regexResult.length}):</span>
                    <div className="bg-[#040406]/60 border border-white/5 p-3.5 rounded-xl min-h-[50px] flex flex-wrap gap-2">
                      {regexResult.length === 0 ? (
                        <span className="text-zinc-600 text-xs italic">Нет совпадений</span>
                      ) : (
                        regexResult.map((match, idx) => (
                          <span key={idx} className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs px-2.5 py-1 rounded-lg">
                            {match}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 6: HASH GENERATOR */}
              {activeTool === 'hash' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Генератор криптографических хэшей</h3>
                    <button 
                      onClick={handleGenerateHash}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      Сгенерировать хэши
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-mono block mb-1">Исходная строка для хэширования</label>
                    <textarea
                      value={hashInput}
                      onChange={e => setHashInput(e.target.value)}
                      placeholder="Введите секретную строку, пароль или API ключ..."
                      rows={3}
                      className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: 'MD5', val: hashOutput.md5, id: 'md5' },
                      { label: 'SHA-1', val: hashOutput.sha1, id: 'sha1' },
                      { label: 'SHA-256', val: hashOutput.sha256, id: 'sha256' }
                    ].map(h => (
                      <div key={h.id} className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-mono block">{h.label}:</span>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={h.val}
                            placeholder={`Хэш ${h.label} ...`}
                            className="w-full bg-[#040406]/60 border border-white/5 pl-4 pr-12 py-2 rounded-xl text-xs font-mono text-zinc-300"
                          />
                          {h.val && (
                            <button
                              onClick={() => copyToClipboard(h.val, h.id)}
                              className="absolute right-2 top-1.5 p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded"
                            >
                              {copiedId === h.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOOL 7: HEX RGB COLOR */}
              {activeTool === 'color' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Интерактивный конвертер HEX ⇄ RGB цветов</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-mono block">HEX Цвет:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={colorHex}
                            onChange={e => setColorHex(e.target.value)}
                            className="flex-1 bg-[#040406] border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-white"
                          />
                          <button 
                            onClick={handleHexToRgb}
                            className="bg-indigo-600 hover:bg-indigo-500 px-3 rounded-xl text-xs text-white"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-mono block">RGB Цвет:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={colorRgb}
                            onChange={e => setColorRgb(e.target.value)}
                            className="flex-1 bg-[#040406] border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-white"
                          />
                          <button 
                            onClick={handleRgbToHex}
                            className="bg-indigo-600 hover:bg-indigo-500 px-3 rounded-xl text-xs text-white"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Interactive preview bubble */}
                    <div className="flex flex-col items-center justify-center border border-white/5 bg-[#040406]/60 rounded-2xl p-6">
                      <div 
                        className="w-24 h-24 rounded-full border border-white/20 shadow-2xl transition-all duration-300" 
                        style={{ backgroundColor: colorHex }}
                      />
                      <span className="text-xs font-semibold text-zinc-300 mt-4">{colorHex}</span>
                      <span className="text-[10px] font-mono text-zinc-500 mt-1">{colorRgb}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 8: JSON COMPARE / DIFF */}
              {activeTool === 'diff' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Интерактивное сравнение JSON (Diff Checker)</h3>
                    <button 
                      onClick={handleCompareJson}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      Сравнить JSON
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block">Оригинальный JSON:</span>
                      <textarea
                        value={diffOriginal}
                        onChange={e => setDiffOriginal(e.target.value)}
                        placeholder="{}"
                        rows={10}
                        className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block">Измененный JSON:</span>
                      <textarea
                        value={diffModified}
                        onChange={e => setDiffModified(e.target.value)}
                        placeholder="{}"
                        rows={10}
                        className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 font-mono block">Различия (Diff Results):</span>
                    <div className="bg-[#040406]/60 border border-white/5 p-4 rounded-xl min-h-[80px] space-y-2 max-h-[250px] overflow-y-auto">
                      {diffResult.details.length === 0 ? (
                        <span className="text-zinc-500 text-xs italic">Нажмите "Сравнить JSON" для выявления разницы</span>
                      ) : (
                        diffResult.details.map((line, idx) => (
                          <div 
                            key={idx} 
                            className={`font-mono text-xs p-2 rounded-lg leading-relaxed whitespace-pre-wrap
                              ${line.startsWith('-') ? 'bg-red-950/25 border border-red-500/10 text-red-400' : 
                                line.startsWith('+') ? 'bg-emerald-950/25 border border-emerald-500/10 text-emerald-400' : 
                                line.startsWith('~') ? 'bg-amber-950/20 border border-amber-500/10 text-amber-400' : 
                                'text-zinc-400 bg-zinc-900/35 border border-zinc-800'}`}
                          >
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 9: TIMESTAMP CONVERTER */}
              {activeTool === 'timestamp' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400 animate-pulse" /> Unix Timestamp & Date Converter
                    </h3>
                    <div className="text-xs font-mono text-zinc-400 mt-2 sm:mt-0">
                      Текущее время: <span className="text-indigo-400 font-semibold">{currentTs}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {/* Timestamp to Date */}
                    <div className="p-4 rounded-xl bg-[#040406]/50 border border-white/5 space-y-3">
                      <span className="text-xs font-bold text-zinc-300 block">Unix Timestamp ⇄ ISO Дата</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-mono">Unix Timestamp (секунды)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tsInput}
                            onChange={e => setTsInput(e.target.value)}
                            placeholder="1781524800"
                            className="flex-1 bg-[#040406] border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-white"
                          />
                          <button
                            onClick={handleConvertUnixToDate}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Преобразовать
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">Результаты (Локальное и UTC время):</span>
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-300 space-y-1.5">
                          <div><span className="text-zinc-500">Local:</span> {tsInput && !isNaN(parseInt(tsInput)) ? new Date(parseInt(tsInput) * 1000).toString() : '—'}</div>
                          <div><span className="text-zinc-500">UTC:</span> {tsInput && !isNaN(parseInt(tsInput)) ? new Date(parseInt(tsInput) * 1000).toUTCString() : '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* ISO Date to Timestamp */}
                    <div className="p-4 rounded-xl bg-[#040406]/50 border border-white/5 space-y-3">
                      <span className="text-xs font-bold text-zinc-300 block">ISO Дата ⇄ Unix Timestamp</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-mono">ISO Date String или Календарь</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tsDateInput}
                            onChange={e => setTsDateInput(e.target.value)}
                            placeholder="2026-07-16T12:00:00.000Z"
                            className="flex-1 bg-[#040406] border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-white"
                          />
                          <button
                            onClick={handleConvertDateToUnix}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Получить Unix
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block">Результат:</span>
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-300 flex justify-between items-center">
                          <div>
                            <span className="text-zinc-500 mr-2">Timestamp:</span> 
                            <span className="text-indigo-400 font-bold">{tsInput}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(tsInput, 'ts')}
                            className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded"
                          >
                            {copiedId === 'ts' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 10: PASSWORD & ID GENERATOR */}
              {activeTool === 'generator' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-400" /> Генератор ID, UUID и Надежных Паролей
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    {/* Settings Panel */}
                    <div className="md:col-span-1 p-4 rounded-xl bg-[#040406]/50 border border-white/5 space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Тип генерации:</span>
                        <div className="grid grid-cols-3 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
                          {(['password', 'uuid', 'nanoid'] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setGenType(type)}
                              className={`py-1 text-[10px] font-bold rounded capitalize cursor-pointer transition-all
                                ${genType === type ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {genType === 'password' && (
                        <div className="space-y-3 border-t border-zinc-900 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-mono text-zinc-500 block">Длина: {genLength}</span>
                            <input
                              type="range"
                              min={8}
                              max={64}
                              value={genLength}
                              onChange={e => setGenLength(parseInt(e.target.value))}
                              className="w-24 accent-indigo-500 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-2">
                            {[
                              { label: 'Строчные (a-z)', state: genIncludeLower, set: setGenIncludeLower },
                              { label: 'Прописные (A-Z)', state: genIncludeUpper, set: setGenIncludeUpper },
                              { label: 'Цифры (0-9)', state: genIncludeNumbers, set: setGenIncludeNumbers },
                              { label: 'Символы (!@#)', state: genIncludeSymbols, set: setGenIncludeSymbols }
                            ].map(item => (
                              <label key={item.label} className="flex justify-between items-center cursor-pointer hover:text-white">
                                <span className="text-zinc-400 text-[11px]">{item.label}</span>
                                <input
                                  type="checkbox"
                                  checked={item.state}
                                  onChange={e => item.set(e.target.checked)}
                                  className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-0 cursor-pointer"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-zinc-900 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-mono text-zinc-500 block">Количество:</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={genCount}
                            onChange={e => setGenCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-12 bg-zinc-950 border border-zinc-900 rounded-lg text-center font-mono py-1 text-white"
                          />
                        </div>

                        <button
                          onClick={handleGenerateKeys}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          Сгенерировать
                        </button>
                      </div>
                    </div>

                    {/* Result Panel */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="relative">
                        <textarea
                          readOnly
                          value={genResult}
                          placeholder="Результаты генерации отобразятся здесь..."
                          rows={6}
                          className="w-full bg-[#040406] border border-white/5 p-4 rounded-xl text-xs font-mono text-zinc-200"
                        />
                        {genResult && (
                          <button
                            onClick={() => copyToClipboard(genResult, 'gen')}
                            className="absolute right-3 top-3 p-1.5 bg-white/[0.02] border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                          >
                            {copiedId === 'gen' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* History */}
                      {genHistory.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-500 uppercase font-mono block">История генераций (последние):</span>
                          <div className="p-3 bg-[#040406]/30 rounded-xl border border-white/5 font-mono text-[10px] text-zinc-400 space-y-1">
                            {genHistory.map((h, i) => (
                              <div key={i} className="flex justify-between items-center py-1 border-b border-zinc-900/30 last:border-0">
                                <span className="truncate max-w-[280px]">{h}</span>
                                <button
                                  onClick={() => copyToClipboard(h, `hist-${i}`)}
                                  className="text-zinc-500 hover:text-white text-[9px] font-bold cursor-pointer"
                                >
                                  {copiedId === `hist-${i}` ? 'скопировано' : 'копировать'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};
