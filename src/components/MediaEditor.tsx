import React, { useRef, useState } from 'react';
import { SAMPLE_BACKGROUND_IMAGES } from '../data/presets';
import { NewsPost } from '../types';
import { 
  Upload, 
  Image as ImageIcon, 
  Sliders, 
  Trash2, 
  Eye, 
  Sparkles,
  Check,
  FolderOpen,
  Layers
} from 'lucide-react';

interface MediaEditorProps {
  post: NewsPost;
  onChange: (updatedFields: Partial<NewsPost>) => void;
}

export const MediaEditor: React.FC<MediaEditorProps> = ({ post, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری (JPG، PNG، WEBP) انتخاب کنید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange({ bgImage: e.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 pb-6 text-neutral-100">
      {/* Upload From User's Device / Phone */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          <span>بارگذاری تصویر از سیستم یا گالری گوشی شما:</span>
        </label>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-neutral-200">
              کلیک برای انتخاب عکس یا کشیدن و رها کردن فایل
            </div>
            <div className="text-[11px] text-neutral-500">
              پشتیبانی از PNG، JPG، WebP با بالاترین کیفیت
            </div>
          </div>
        </div>
      </div>

      {/* Current Image & Overlay Filters */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>تنظیمات لایه و افکت تصویر:</span>
          </span>
          {post.bgImage && (
            <button
              type="button"
              onClick={() => onChange({ bgImage: '' })}
              className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف تصویر</span>
            </button>
          )}
        </div>

        {/* Sliders: Opacity & Blur */}
        <div className="space-y-3">
          {/* Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">میزان تیرگی پس‌زمینه (خوانایی متن):</span>
              <span className="text-neutral-200 font-mono">{post.bgOverlayOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={post.bgOverlayOpacity}
              onChange={(e) => onChange({ bgOverlayOpacity: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Blur */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">میزان ماتی و بلر (Blur):</span>
              <span className="text-neutral-200 font-mono">{post.bgBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={post.bgBlur}
              onChange={(e) => onChange({ bgBlur: Number(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Preset Curated Images */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>یا انتخاب از تصاویر آماده خبری:</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {SAMPLE_BACKGROUND_IMAGES.map((img) => {
            const isSelected = post.bgImage === img.url;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onChange({ bgImage: img.url })}
                className={`group relative rounded-xl overflow-hidden aspect-video border text-right transition-all ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-[1.02]'
                    : 'border-neutral-800 hover:border-neutral-600 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-white leading-tight drop-shadow">
                    {img.title}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
