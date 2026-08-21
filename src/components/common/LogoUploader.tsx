import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Sparkles, Check } from 'lucide-react';

interface LogoPreset {
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
  const [inputUrl, setInputUrl] = useState(value?.startsWith('data:') ? '' : value || '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize and convert file to lightweight Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (.png, .jpg, .jpeg, .svg, .webp)');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessing(false);
        return;
      }

      // If SVG or small image, keep as is
      if (file.type.includes('svg') || file.size < 50 * 1024) {
        onChange(result);
        setIsProcessing(false);
        return;
      }

      // Optimize raster image with canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.9);
          onChange(compressed);
        } else {
          onChange(result);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(result);
        setIsProcessing(false);
      };
      img.src = result;
    };
    reader.onerror = () => setIsProcessing(false);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim()) {
      onChange(inputUrl.trim());
      setShowUrlInput(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setInputUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            {label}
          </h4>
          {sublabel && (
            <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>
          )}
        </div>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <X className="w-3.5 h-3.5" />
            Hapus Logo
          </button>
        )}
      </div>

      {/* Main Upload Box / Dropzone */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* Preview Box */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 relative overflow-hidden group shadow-sm">
          {value ? (
            <>
              <img
                src={value}
                alt={label}
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow-md hover:bg-slate-100"
                  title="Ganti Gambar"
                >
                  Ganti
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400">
              <ImageIcon className="w-7 h-7 mx-auto mb-1 opacity-50" />
              <span className="text-[9px] font-semibold block leading-tight">
                {position === 'left' ? 'Logo Kiri Kosong' : 'Logo Kanan Kosong'}
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
                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white/70 dark:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
              className="hidden"
            />
            <Upload className={`w-4 h-4 mb-1 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {isProcessing ? 'Memproses gambar...' : 'Klik atau Tarik Berkas Logo ke Sini'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PNG transparan, JPG, atau SVG (Maks. 3MB)</p>
          </div>

          {/* Alternative URL input toggle */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              {showUrlInput ? 'Tutup Input Link' : 'Gunakan Link URL Gambar'}
            </button>
            {value && (
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Logo Aktif
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
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shrink-0"
              >
                Pasang
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
            Pilihan Logo Standar / Cepat:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const isCurrent = value === preset.url;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-3.5 h-3.5 object-contain"
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
    </div>
  );
};
