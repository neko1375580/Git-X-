import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserFile, Folder } from '../types';
import { 
  Folder as FolderIcon, File as FileIcon, Trash2, Star, Upload, Plus, 
  Search, ArrowLeft, HardDrive, MoreVertical, Download, Edit2, Play, 
  FileText, Image, Video, Archive, ChevronRight, X, Eye, Code, FolderOpen,
  Check, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FilesViewProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openInVSCode?: (fileId: string) => void;
  setView?: (v: string) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({ showToast, openInVSCode, setView }) => {
  const { files, folders, addFile, updateFile, deleteFile, addFolder, updateFolder, deleteFolder } = useApp();
  
  // Navigation & View States
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'trash' | 'images' | 'documents' | 'code' | 'archives'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals & Temp States
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('txt');
  const [newFileContent, setNewFileContent] = useState('');
  
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameItemId, setRenameItemId] = useState<string | null>(null);
  const [renameItemType, setRenameItemType] = useState<'file' | 'folder' | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper: Get folder breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Корень' }];
    if (!currentFolderId) return crumbs;
    
    let current = folders.find(f => f.id === currentFolderId);
    const path: { id: string; name: string }[] = [];
    
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      current = current.parent_id ? folders.find(f => f.id === current.parent_id) : undefined;
    }
    
    return [...crumbs, ...path];
  };

  // Helper: File Type Icon and Label Resolver
  const getFileMeta = (fileName: string, type: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return { icon: Image, color: 'text-emerald-400', bg: 'bg-emerald-500/10', category: 'images' };
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return { icon: Video, color: 'text-rose-400', bg: 'bg-rose-500/10', category: 'videos' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: Archive, color: 'text-amber-400', bg: 'bg-amber-500/10', category: 'archives' };
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'html', 'css', 'json', 'yaml', 'md'].includes(ext)) {
      return { icon: Code, color: 'text-indigo-400', bg: 'bg-indigo-500/10', category: 'code' };
    }
    return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', category: 'documents' };
  };

  // Calculations
  const activeFolders = folders.filter(f => {
    if (selectedFilter === 'trash') return f.is_in_trash;
    if (f.is_in_trash) return false;
    return f.parent_id === currentFolderId;
  });

  const activeFiles = files.filter(f => {
    // 1. Search Query
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // 2. Trash Filter
    if (selectedFilter === 'trash') return f.is_in_trash;
    if (f.is_in_trash) return false;
    
    // 3. Category Filter
    if (selectedFilter === 'favorites') return f.is_favorite;
    
    const meta = getFileMeta(f.name, f.type);
    if (selectedFilter === 'images' && meta.category !== 'images') return false;
    if (selectedFilter === 'documents' && meta.category !== 'documents') return false;
    if (selectedFilter === 'code' && meta.category !== 'code') return false;
    if (selectedFilter === 'archives' && meta.category !== 'archives') return false;
    
    // 4. Folder Scope (only if not searching/filtering globally)
    if (!searchQuery && selectedFilter === 'all') {
      return f.folder_id === currentFolderId;
    }
    
    return true;
  });

  const totalUsedBytes = files.reduce((acc, f) => acc + f.size, 0);
  const quotaLimitBytes = 100 * 1024 * 1024; // 100MB free quota
  const usedPercentage = Math.min((totalUsedBytes / quotaLimitBytes) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Actions
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      showToast('Введите имя папки', 'error');
      return;
    }
    addFolder({
      name: newFolderName,
      parent_id: currentFolderId,
      is_in_trash: false
    });
    setNewFolderName('');
    setIsNewFolderOpen(false);
    showToast('Папка успешно создана', 'success');
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      showToast('Введите имя файла', 'error');
      return;
    }
    const fullName = newFileName.includes('.') ? newFileName : `${newFileName}.${newFileType}`;
    addFile({
      name: fullName,
      folder_id: currentFolderId,
      size: new Blob([newFileContent]).size || 1024,
      type: newFileType,
      is_favorite: false,
      is_in_trash: false,
      content: newFileContent
    });
    setNewFileName('');
    setNewFileContent('');
    setIsNewFileOpen(false);
    showToast('Файл успешно создан', 'success');
  };

  const handleRename = () => {
    if (!renameValue.trim()) return;
    if (renameItemType === 'folder' && renameItemId) {
      updateFolder(renameItemId, { name: renameValue });
      showToast('Папка переименована', 'success');
    } else if (renameItemType === 'file' && renameItemId) {
      updateFile(renameItemId, { name: renameValue });
      showToast('Файл переименован', 'success');
    }
    setIsRenameOpen(false);
    setRenameItemId(null);
    setRenameItemType(null);
    setRenameValue('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processNativeFiles = (uploadedFiles: FileList) => {
    Array.from(uploadedFiles).forEach(nativeFile => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = typeof event.target?.result === 'string' ? event.target.result : '';
        addFile({
          name: nativeFile.name,
          folder_id: currentFolderId,
          size: nativeFile.size,
          type: nativeFile.name.split('.').pop() || 'txt',
          is_favorite: false,
          is_in_trash: false,
          content: textContent || '[Бинарный файл или медиа контент]'
        });
      };
      if (nativeFile.size < 5 * 1024 * 1024 && (nativeFile.type.startsWith('text/') || nativeFile.name.endsWith('.js') || nativeFile.name.endsWith('.ts') || nativeFile.name.endsWith('.json') || nativeFile.name.endsWith('.md'))) {
        reader.readAsText(nativeFile);
      } else {
        // Mock non-text file saving
        addFile({
          name: nativeFile.name,
          folder_id: currentFolderId,
          size: nativeFile.size,
          type: nativeFile.name.split('.').pop() || 'bin',
          is_favorite: false,
          is_in_trash: false,
          content: '[Бинарные данные файла]'
        });
      }
    });
    showToast(`Загружено файлов: ${uploadedFiles.length}`, 'success');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNativeFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processNativeFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-indigo-400" />
            Файловый менеджер
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Управляйте проектами, исходным кодом, ассетами и документами. Поддерживается вложенность и drag-and-drop.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button 
            onClick={() => setIsNewFolderOpen(true)}
            className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
          >
            <FolderIcon className="w-4 h-4 text-amber-500" />
            <span>Новая папка</span>
          </button>
          
          <button 
            onClick={() => setIsNewFileOpen(true)}
            className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Новый файл</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/15 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Загрузить</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            className="hidden" 
          />
        </div>
      </div>

      {/* 2. FILE GRID / SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFTPANEL: CATEGORIES & QUOTA */}
        <div className="lg:col-span-1 space-y-5">
          {/* Filters */}
          <div className="glass-panel rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block px-3 mb-2">Категории</span>
            {[
              { id: 'all', label: 'Все файлы', count: files.filter(f => !f.is_in_trash).length, icon: HardDrive },
              { id: 'favorites', label: 'Избранные', count: files.filter(f => f.is_favorite && !f.is_in_trash).length, icon: Star, iconColor: 'text-amber-400' },
              { id: 'images', label: 'Изображения', count: files.filter(f => ['png','jpg','jpeg','gif','webp','svg'].includes(f.type) && !f.is_in_trash).length, icon: Image, iconColor: 'text-emerald-400' },
              { id: 'documents', label: 'Документы', count: files.filter(f => ['pdf','docx','xlsx','txt'].includes(f.type) && !f.is_in_trash).length, icon: FileText, iconColor: 'text-blue-400' },
              { id: 'code', label: 'Исходный код', count: files.filter(f => ['js','ts','jsx','tsx','html','css','json','py','rs'].includes(f.type) && !f.is_in_trash).length, icon: Code, iconColor: 'text-indigo-400' },
              { id: 'archives', label: 'Архивы', count: files.filter(f => ['zip','rar','7z'].includes(f.type) && !f.is_in_trash).length, icon: Archive, iconColor: 'text-amber-500' },
              { id: 'trash', label: 'Корзина', count: files.filter(f => f.is_in_trash).length + folders.filter(f => f.is_in_trash).length, icon: Trash2, iconColor: 'text-red-400' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedFilter(item.id as any);
                  if (item.id === 'trash') {
                    setCurrentFolderId(null);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left
                  ${selectedFilter === item.id ? 'bg-indigo-500/10 text-indigo-300 font-semibold' : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200'}`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${item.iconColor || 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-mono bg-white/[0.04] px-1.5 py-0.5 rounded-md text-zinc-500">{item.count}</span>
              </button>
            ))}
          </div>

          {/* Quota Usage */}
          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Размер хранилища</span>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">{formatBytes(totalUsedBytes)}</span>
                <span className="text-zinc-500">из {formatBytes(quotaLimitBytes)}</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all" 
                  style={{ width: `${usedPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Локальный кэш автоматически синхронизируется с облаком Supabase Storage при подключении.
            </p>
          </div>
        </div>

        {/* RIGHTPANEL: FILE AREA */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="glass-panel rounded-2xl p-3 flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск файлов по имени..."
                className="w-full bg-white/[0.02] border border-white/5 pl-10 pr-4 py-2 rounded-xl text-xs text-zinc-200"
              />
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300'}`}
              >
                <HardDrive className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${viewMode === 'list' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300'}`}
              >
                <MoreVertical className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>

          {/* BREADCRUMBS (only when not showing trash directly) */}
          {selectedFilter !== 'trash' && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono px-1">
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                  <button
                    onClick={() => {
                      setCurrentFolderId(crumb.id);
                      setSelectedFilter('all');
                    }}
                    className={`hover:text-zinc-200 transition-colors cursor-pointer ${idx === arr.length - 1 ? 'text-white font-medium' : ''}`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* DRAG AND DROP CONTAINER */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`min-h-[400px] rounded-2xl border-2 border-dashed transition-all p-4 relative flex flex-col
              ${isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 bg-white/[0.01]'}`}
          >
            {isDragging && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 z-10">
                <Upload className="w-10 h-10 text-indigo-400 animate-bounce" />
                <span className="text-sm font-semibold text-zinc-200">Отпустите файлы для мгновенной загрузки</span>
              </div>
            )}

            {/* EMPTY STATE */}
            {activeFolders.length === 0 && activeFiles.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="w-12 h-12 text-zinc-600 mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300">Папка пуста</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Перетащите файлы сюда или используйте кнопки сверху, чтобы создать папки и файлы для работы.
                </p>
              </div>
            )}

            {/* LISTINGS */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* Folders */}
                {activeFolders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => {
                      if (!folder.is_in_trash) setCurrentFolderId(folder.id);
                    }}
                    className="glass-panel glass-panel-hover rounded-xl p-3.5 flex flex-col justify-between h-28 cursor-pointer relative group"
                  >
                    <div className="flex justify-between items-start">
                      <FolderIcon className="w-9 h-9 text-amber-400 fill-amber-400/20" />
                      
                      {/* Folder Actions Menu */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                          }}
                          className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        
                        <AnimatePresence>
                          {activeMenuId === folder.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 mt-1 w-36 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl py-1 z-20 text-left"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameItemId(folder.id);
                                  setRenameItemType('folder');
                                  setRenameValue(folder.name);
                                  setIsRenameOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/5 hover:text-white"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Переименовать</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (folder.is_in_trash) {
                                    deleteFolder(folder.id);
                                    showToast('Папка навсегда удалена', 'success');
                                  } else {
                                    updateFolder(folder.id, { is_in_trash: true });
                                    showToast('Папка отправлена в корзину', 'info');
                                  }
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{folder.is_in_trash ? 'Удалить навсегда' : 'В корзину'}</span>
                              </button>

                              {folder.is_in_trash && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateFolder(folder.id, { is_in_trash: false });
                                    showToast('Папка восстановлена', 'success');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-emerald-400 hover:bg-emerald-500/10"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                  <span>Восстановить</span>
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200 truncate pr-4">{folder.name}</h4>
                      <span className="text-[9px] font-mono text-zinc-500 mt-0.5 block">Папка</span>
                    </div>
                  </div>
                ))}

                {/* Files */}
                {activeFiles.map(file => {
                  const meta = getFileMeta(file.name, file.type);
                  return (
                    <div
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className="glass-panel glass-panel-hover rounded-xl p-3.5 flex flex-col justify-between h-28 cursor-pointer relative group"
                    >
                      <div className="flex justify-between items-start">
                        <div className={`p-1.5 rounded-lg ${meta.bg}`}>
                          <meta.icon className={`w-6 h-6 ${meta.color}`} />
                        </div>
                        
                        <div className="flex items-center gap-0.5">
                          {!file.is_in_trash && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFile(file.id, { is_favorite: !file.is_favorite });
                              }}
                              className={`p-1 rounded-lg hover:bg-white/5 cursor-pointer transition-colors ${file.is_favorite ? 'text-amber-400' : 'text-zinc-500'}`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                          
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === file.id ? null : file.id);
                              }}
                              className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 cursor-pointer animate-none"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            
                            <AnimatePresence>
                              {activeMenuId === file.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 mt-1 w-36 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl py-1 z-20 text-left"
                                >
                                  {meta.category === 'code' && openInVSCode && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openInVSCode(file.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-indigo-300 hover:bg-white/5"
                                    >
                                      <Code className="w-3.5 h-3.5" />
                                      <span>Открыть в VS Code</span>
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRenameItemId(file.id);
                                      setRenameItemType('file');
                                      setRenameValue(file.name);
                                      setIsRenameOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/5"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Переименовать</span>
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (file.is_in_trash) {
                                        deleteFile(file.id);
                                        showToast('Файл навсегда удален', 'success');
                                      } else {
                                        updateFile(file.id, { is_in_trash: true });
                                        showToast('Файл перенесен в Корзину', 'info');
                                      }
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{file.is_in_trash ? 'Удалить навсегда' : 'В корзину'}</span>
                                  </button>

                                  {file.is_in_trash && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateFile(file.id, { is_in_trash: false });
                                        showToast('Файл успешно восстановлен', 'success');
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-emerald-400 hover:bg-emerald-500/10"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                      <span>Восстановить</span>
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200 truncate pr-4">{file.name}</h4>
                        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mt-0.5">
                          <span>{file.type.toUpperCase()}</span>
                          <span>{formatBytes(file.size)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5">
                {activeFolders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => {
                      if (!folder.is_in_trash) setCurrentFolderId(folder.id);
                    }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FolderIcon className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-semibold text-zinc-200">{folder.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Папка</span>
                  </div>
                ))}
                {activeFiles.map(file => {
                  const meta = getFileMeta(file.name, file.type);
                  return (
                    <div 
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <meta.icon className={`w-5 h-5 ${meta.color}`} />
                        <span className="text-xs font-semibold text-zinc-200">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-[10px] font-mono text-zinc-500">{formatBytes(file.size)}</span>
                        <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.02] px-1.5 py-0.5 rounded uppercase">{file.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: PREVIEW FILE */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-white truncate max-w-md">{previewFile.name}</span>
                </div>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto bg-[#040406] text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[60vh]">
                {previewFile.content || 'Нет доступного текстового контента для предпросмотра (бинарный файл).'}
              </div>
              
              <div className="flex justify-between items-center px-4 py-3 border-t border-white/5 bg-white/[0.01]">
                <span className="text-[10px] text-zinc-500 font-mono">{formatBytes(previewFile.size)}</span>
                
                <div className="flex gap-2">
                  {getFileMeta(previewFile.name, previewFile.type).category === 'code' && openInVSCode && (
                    <button
                      onClick={() => {
                        openInVSCode(previewFile.id);
                        setPreviewFile(null);
                      }}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Открыть в редакторе</span>
                    </button>
                  )}
                  
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(previewFile.content || '')}`}
                    download={previewFile.name}
                    className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW FOLDER */}
      <AnimatePresence>
        {isNewFolderOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-semibold text-white">Создать новую папку</h3>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Имя папки..."
                className="w-full bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl text-xs text-zinc-200"
              />
              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button onClick={() => setIsNewFolderOpen(false)} className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200">Отмена</button>
                <button onClick={handleCreateFolder} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Создать</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW FILE */}
      <AnimatePresence>
        {isNewFileOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-semibold text-white font-display">Создать новый файл кода</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] text-zinc-500 block mb-1">Имя файла (без расширения)</label>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                      placeholder="index, server, config..."
                      className="w-full bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl text-xs text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Тип файла</label>
                    <select
                      value={newFileType}
                      onChange={e => setNewFileType(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 px-3 py-2 rounded-xl text-xs text-zinc-200"
                    >
                      <option value="js">JavaScript (.js)</option>
                      <option value="ts">TypeScript (.ts)</option>
                      <option value="tsx">React (.tsx)</option>
                      <option value="html">HTML (.html)</option>
                      <option value="css">CSS (.css)</option>
                      <option value="md">Markdown (.md)</option>
                      <option value="json">JSON (.json)</option>
                      <option value="py">Python (.py)</option>
                      <option value="rs">Rust (.rs)</option>
                      <option value="txt">Текст (.txt)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Начальный код / Содержимое</label>
                  <textarea
                    value={newFileContent}
                    onChange={e => setNewFileContent(e.target.value)}
                    placeholder="Напишите или вставьте начальный код..."
                    rows={6}
                    className="w-full bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl text-xs font-mono text-zinc-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button onClick={() => setIsNewFileOpen(false)} className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200">Отмена</button>
                <button onClick={handleCreateFile} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Создать файл</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RENAME */}
      <AnimatePresence>
        {isRenameOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-semibold text-white">Переименовать элемент</h3>
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                placeholder="Новое имя..."
                className="w-full bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl text-xs text-zinc-200"
              />
              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button onClick={() => setIsRenameOpen(false)} className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200">Отмена</button>
                <button onClick={handleRename} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Сохранить</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
