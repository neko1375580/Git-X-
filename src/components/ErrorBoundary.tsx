import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    // Очищаем кэш/сервис-воркеры при жесткой ошибке, чтобы помочь восстановиться
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0e12] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#15171e] border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 to-pink-500 opacity-80" />
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
                Произошла ошибка приложения
              </h1>
              
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                К сожалению, в работе Git X возникла критическая неполадка. Попробуйте перезагрузить страницу, чтобы восстановить сессию.
              </p>

              {this.state.error && (
                <div className="w-full bg-black/30 rounded-lg p-3.5 mb-8 text-left border border-white/5 font-mono text-xs text-red-400 max-h-32 overflow-y-auto">
                  {this.state.error.message || 'Unknown Error'}
                </div>
              )}

              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
                <span>Перезагрузить</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
