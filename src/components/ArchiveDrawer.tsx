import React, { useEffect, useState, useRef } from 'react';
import { NewsPost } from '../types';
import { 
  getStoredPosts, 
  deletePostFromStorage,
  exportAllDataAsJson,
  importDataFromJson
} from '../utils/storage';
import { 
  FolderArchive, 
  Save, 
  Trash2, 
  Check, 
  Search, 
  RefreshCw, 
  Download,
  Upload,
  CheckCircle2,
  HardDrive,
  FileJson
} from 'lucide-react';

interface ArchiveDrawerProps {
  currentPost: NewsPost;
  onLoadPost: (post: NewsPost) => void;
  onSaveCurrent: () => Promise<void>;
  saving: boolean;
}

export const ArchiveDrawer: React.FC<ArchiveDrawerProps> = ({
  currentPost,
  onLoadPost,
  onSaveCurrent,
  saving,
}) => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = () => {
    const list = getStoredPosts();
    setPosts(list);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('آیا از حذف این خبر از آرشیو حافظه مرورگر اطمینان دارید؟')) return;

    deletePostFromStorage(id);
    loadPosts();
    setMessage('خبر با موفقیت از آرشیو حذف شد.');
    setTimeout(() => setMessage(null), 2500);
  };

  const handleExportBackup = () => {
    try {
      const json = exportAllDataAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Smart_Journalist_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('فایل بک‌آپ کامل (آرشیو، لوگوها و تنظیمات هوش مصنوعی) دانلود شد.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('خطا در تهیه فایل پشتیبان.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importDataFromJson(content);
        if (result.success) {
          loadPosts();
          setMessage(result.message);
          setTimeout(() => setMessage(null), 3500);
        } else {
          alert(result.message);
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.kicker?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-6 text-neutral-100">
      {/* Toast Notification */}
      {message && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* LocalStorage Status & Save Action */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <span>آرشیو محلی مرورگر (LocalStorage)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-neutral-400">
              {posts.length} خبر و استوری ذخیره شده است
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await onSaveCurrent();
            loadPosts();
          }}
          disabled={saving}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>ذخیره خبر فعلی</span>
        </button>
      </div>

      {/* Backup Import / Export Toolbar */}
      <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 flex items-center justify-between">
        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
          <FileJson className="w-4 h-4 text-amber-400" />
          <span>پشتیبان‌گیری از کل داده‌ها (JSON):</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="دانلود بک‌آپ کامل"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>خروجی بک‌آپ</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="بازیابی فایل بک‌آپ"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>بازیابی بک‌آپ</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportBackup}
          />
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در اخبار ذخیره شده..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={loadPosts}
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
          title="بروزرسانی لیست"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-2.5">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800/60 text-xs text-neutral-500 space-y-2">
            <FolderArchive className="w-8 h-8 mx-auto text-neutral-600" />
            <div>هیچ خبری در آرشیو پیدا نشد. برای ذخیره دکمه «ذخیره خبر فعلی» را بزنید.</div>
          </div>
        ) : (
          filteredPosts.map((p) => {
            const isCurrent = currentPost.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onLoadPost(p)}
                className={`p-3.5 rounded-2xl border text-right cursor-pointer transition-all flex items-center justify-between group ${
                  isCurrent
                    ? 'bg-neutral-800 border-emerald-500/70 ring-1 ring-emerald-500/30'
                    : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-1 flex-1 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-neutral-300">
                      {p.category || 'خبر'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {p.aspectRatio}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        در حال ویرایش
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-white">
                    {p.title}
                  </h4>
                  <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                    <span>{p.date}</span>
                    <span>•</span>
                    <span>منبع: {p.source}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(p.id, e)}
                    className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="حذف از آرشیو محلی"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
