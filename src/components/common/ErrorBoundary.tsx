import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut, ChevronDown, ChevronUp, Copy, Check, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  showResetSession?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('SIM-KESISWAAN Runtime Error Boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetState = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleResetSession = (): void => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('simkesiswaan_active_tab');
      localStorage.removeItem('sim_admin_impersonator');
    } catch (e) {
      console.warn('Gagal membersihkan storage:', e);
    }
    window.location.href = window.location.pathname;
  };

  handleCopyError = (): void => {
    const errorText = `[SIM-KESISWAAN ERROR REPORT]\nError: ${this.state.error?.message || 'Unknown'}\nStack: ${this.state.error?.stack || 'N/A'}\nComponent Stack: ${this.state.errorInfo?.componentStack || 'N/A'}\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Terjadi Kendala Saat Menampilkan Konten',
        fallbackMessage = 'Sistem mendeteksi kendala pada modul antarmuka saat memuat data. Anda dapat mencoba memuat ulang modul atau mereset sesi tanpa kehilangan data madrasah.',
        showResetSession = true
      } = this.props;

      return (
        <div className="min-h-[420px] w-full flex items-center justify-center p-4 sm:p-6 select-none">
          <div className="w-full max-w-xl bg-white dark:bg-[#0e1626] border border-amber-300 dark:border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
            {/* Top decorative accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Proteksi Error Aktif</span>
            </div>

            {/* Title & Description */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {fallbackTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
              {fallbackMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
              <button
                type="button"
                onClick={this.handleResetState}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Pulihkan Modul</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1a2337] hover:bg-slate-200 dark:hover:bg-[#222f48] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Muat Ulang Halaman</span>
              </button>

              {showResetSession && (
                <button
                  type="button"
                  onClick={this.handleResetSession}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                  title="Bersihkan sesi login lokal dan kembali ke Halaman Masuk"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Bersihkan Sesi & Masuk Ulang</span>
                </button>
              )}
            </div>

            {/* Technical Detail Accordion */}
            {this.state.error && (
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Informasi Diagnostik Teknis</span>
                    <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                      ({this.state.error.name})
                    </span>
                  </span>
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 space-y-2">
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                      <div className="text-rose-400 font-bold mb-1">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-tight font-mono">
                          {this.state.error.stack.slice(0, 500)}...
                        </pre>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={this.handleCopyError}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {this.state.copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Berhasil Disalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Laporan Error</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
