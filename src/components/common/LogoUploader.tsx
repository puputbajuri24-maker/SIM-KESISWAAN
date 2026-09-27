import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Sparkles, Check, AlertCircle, RefreshCw, ZoomIn } from 'lucide-react';
import { compressImageToBase64 } from '../../utils/imageCompressor';

export interface LogoPreset {
  name: string;
  url: string;
  category?: string;
}

interface LogoUploaderProps {
  label: string;
  sublabel?: string;
  value?: string;
  onChange: (urlOrBase64: string) => void;
  presets?: LogoPreset[];
  position: 'left' | 'right';
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  label,
  sublabel,
  value,
  onChange,
  presets = [],
  position
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileSizeInfo, setFileSizeInfo] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showEnlargeModal, setShowEnlargeModal] = useState(false);

  // Sync internal state when value changes or resets
  useEffect(() => {
    setImageLoadError(false);
    if (value) {
      if (value.startsWith('data:')) {
        const approxBytes = Math.round((value.length * 3) / 4);
        const kb = (approxBytes / 1024).toFixed(1);
        setFileSizeInfo(`${kb} KB`);
      } else {
        setFileSizeInfo('URL Web');
      }
    } else {
      setFileSizeInfo(null);
    }
  }, [value]);

  // Compress & convert file
  const processFile = async (file: File) => {
    setErrorMessage(null);
    setImageLoadError(false);

    // 1. Validate file extension and MIME type
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidExt = validExtensions.includes(fileExtension);
    const isValidMime = file.type.startsWith('image/');

    if (!isValidMime && !isValidExt) {
      setErrorMessage('Format berkas tidak didukung. Mohon gunakan format JPG, JPEG, PNG, atau SVG.');
      return;
    }

    setIsProcessing(true);

    try {
      // Compress automatically so document size stays ultra-compact for Firestore (<80 KB)
      const compressed = await compressImageToBase64(file, {
        maxDimension: 340,
        quality: 0.90,
        maxSizeBytes: 80 * 1024
      });

      setFileSizeInfo(`${compressed.sizeKb} KB`);
      onChange(compressed.base64);
    } catch (err: any) {
      console.error('Error compressing logo:', err);
      setErrorMessage(err.message || 'Gagal memproses gambar logo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so user can pick same file again if desired
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApplyUrl = () => {
    setErrorMessage(null);
    const trimmed = inputUrl.trim();
    if (trimmed) {
      setImageLoadError(false);
      onChange(trimmed);
      setInputUrl('');
      setShowUrlInput(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setInputUrl('');
    setErrorMessage(null);
    setFileSizeInfo(null);
    setImageLoadError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePresetSelect = (presetUrl: string) => {
    setImageLoadError(false);
    setErrorMessage(null);
    onChange(presetUrl);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${value ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
            {label}
          </h4>
          {sublabel && (
            <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>
          )}
        </div>

        {value && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowEnlargeModal(true)}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Perbesar Tampilan Logo"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Lihat
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Upload Box / Dropzone */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* Preview Box - Designed with clean checkered pattern background for transparent PNG visibility */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 relative overflow-hidden group shadow-sm bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] dark:bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:16px_16px]">
          {value && !imageLoadError ? (
            <>
              <img
                src={value}
                alt={label}
                className="max-h-full max-w-full object-contain filter drop-shadow-xs transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={() => {
                  console.warn('Preview image load error for:', label);
                  setImageLoadError(true);
                }}
              />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow-md hover:bg-slate-100 flex items-center gap-1"
                  title="Ganti Gambar"
                >
                  <RefreshCw className="w-3 h-3" />
                  Ganti
                </button>
              </div>
            </>
          ) : imageLoadError ? (
            <div className="text-center p-1">
              <AlertCircle className="w-5 h-5 mx-auto text-amber-500 mb-0.5" />
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium leading-tight block">
                Gambar gagal dimuat
              </span>
              <button
                type="button"
                onClick={() => setImageLoadError(false)}
                className="text-[8px] text-indigo-600 underline mt-1 block mx-auto"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <ImageIcon className="w-7 h-7 mx-auto mb-1 opacity-60 text-emerald-600" />
              <span className="text-[9px] font-semibold block leading-tight text-slate-500">
                {position === 'left' ? 'Logo Kiri (Kemenag)' : 'Logo Kanan (Madrasah)'}
              </span>
            </div>
          )}
        </div>

        {/* Dropzone & Action Buttons */}
        <div className="flex-1 flex flex-col justify-between space-y-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center flex-1 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white/80 dark:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg, .jpeg, .png, .webp, .svg, image/jpeg, image/png, image/webp, image/svg+xml"
              className="hidden"
            />
            {isProcessing ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 py-1">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs font-bold">Mengompres & Menyesuaikan Resolusi...</span>
              </div>
            ) : (
              <>
                <Upload className={`w-4 h-4 mb-1 ${isDragging ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Klik atau Tarik Berkas Logo ke Sini
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Format: <span className="font-bold text-emerald-700 dark:text-emerald-400">JPG, JPEG, PNG</span> (Otomatis Kompres &lt; 80 KB)
                </p>
              </>
            )}
          </div>

          {/* Status & Size Info */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              {showUrlInput ? 'Tutup Input Link' : 'Atau input via Link URL'}
            </button>
            {value && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                <Check className="w-3 h-3 text-emerald-600" />
                Logo Terpasang {fileSizeInfo && `(${fileSizeInfo})`}
              </span>
            )}
          </div>

          {showUrlInput && (
            <div className="flex gap-2 items-center animate-in fade-in">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://domain.com/logo.png"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shrink-0 transition"
              >
                Terapkan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preset Icons Shortcuts */}
      {presets.length > 0 && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Pilihan Logo Standar / Default (1-Klik Pasang):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const isCurrent = value === preset.url;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset.url)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-4 h-4 object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Enlarge Preview */}
      {showEnlargeModal && value && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {label}
              </h5>
              <button
                type="button"
                onClick={() => setShowEnlargeModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-48 h-48 mx-auto flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <img
                src={value}
                alt={label}
                className="max-h-full max-w-full object-contain filter drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-[11px] text-slate-500">
              {fileSizeInfo && <span>Ukuran Data: <b>{fileSizeInfo}</b></span>}
            </div>
            <button
              type="button"
              onClick={() => setShowEnlargeModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
