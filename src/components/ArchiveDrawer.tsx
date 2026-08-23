import React, { useEffect, useState } from 'react';
import { NewsPost } from '../types';
import { 
  FolderArchive, 
  Save, 
  Trash2, 
  Clock, 
  Check, 
  Database, 
  Search, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers
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
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPosts(json.data);
      }
    } catch (err) {
      console.error('Error loading NeDB posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('آیا از حذف این خبر ذخیره شده از دیتابیس NeDB اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting post from NeDB:', err);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.kicker?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-6 text-neutral-100">
      {/* NeDB Status & Save Action */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <span>پایگاه داده ذخیره‌سازی محلی (NeDB)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-neutral-400">
              {posts.length} پست و استوری در دیتابیس ذخیره شده است
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await onSaveCurrent();
            await fetchPosts();
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
          onClick={fetchPosts}
          disabled={loading}
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
          title="بروزرسانی لیست"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
            <div>در حال خواندن از دیتابیس NeDB...</div>
          </div>
        ) : filteredPosts.length === 0 ? (
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
                    title="حذف از دیتابیس NeDB"
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
