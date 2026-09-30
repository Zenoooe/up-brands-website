import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { BlogPost } from '../../types';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import {
  Upload,
  Bold,
  Italic,
  Heading2,
  Quote,
  Link2,
  List,
  ListOrdered,
  Code2,
  Minus,
  ImagePlus,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { uploadImageFile } from '../../utils/imageUpload';
import toast from 'react-hot-toast';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});
turndown.addRule('hr', { filter: 'hr', replacement: () => '\n\n---\n\n' });

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type ToolId = 'bold' | 'italic' | 'heading' | 'quote' | 'ul' | 'ol' | 'link' | 'code' | 'image' | 'hr';

type MarkdownFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function MarkdownField({ label, value, onChange, placeholder }: MarkdownFieldProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'split' | 'write' | 'preview'>('split');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeSurface, setActiveSurface] = useState<'source' | 'preview'>('source');
  const [previewFocused, setPreviewFocused] = useState(false);
  // While the preview is being edited we feed it a frozen markdown snapshot so
  // React never rewrites the DOM under the caret. The live value still flows out
  // through onChange, keeping the source pane in sync.
  const [previewSource, setPreviewSource] = useState(value);
  const [previewKey, setPreviewKey] = useState(0);
  const editingPreview = useRef(false);
  const previewDirty = useRef(false);

  useEffect(() => {
    if (!editingPreview.current) setPreviewSource(value);
  }, [value]);

  const previewActive = mode === 'preview' || (mode === 'split' && activeSurface === 'preview');

  const insertText = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const wrapSelection = (before: string, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const prefixLine = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const syncFromPreview = () => {
    const el = previewRef.current;
    if (!el) return;
    previewDirty.current = true;
    onChange(turndown.turndown(el.innerHTML));
  };

  const handleImageSelected = async (file: File) => {
    setUploadingImage(true);
    const toastId = toast.loading(t('admin.editor.uploading'));
    try {
      const url = await uploadImageFile(file, 'blog');
      const alt = file.name.replace(/\.[^.]+$/, '');
      if (previewActive) {
        const el = previewRef.current;
        if (el) {
          el.focus();
          document.execCommand('insertHTML', false, `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`);
          syncFromPreview();
        }
      } else {
        insertText(`\n\n![${alt}](${url})\n\n`);
      }
      toast.success(t('admin.editor.uploadSuccess'), { id: toastId });
    } catch (error) {
      console.error(error);
      const detail = error instanceof Error ? error.message : '';
      toast.error(detail ? `${t('admin.editor.uploadFailed')}: ${detail}` : t('admin.editor.uploadFailed'), { id: toastId });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePreviewInput = () => {
    syncFromPreview();
  };

  // Enter inserts a line break (not a new <div> block) so a single press maps to
  // a markdown line-break symbol and survives the round-trip through the preview.
  const handlePreviewKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return;
    // Shift+Enter already inserts a <br> in most browsers; plain Enter would
    // otherwise create a new block (<p>/<div>) that turndown turns into a
    // paragraph. Force a line break so a single press becomes a hard break.
    e.preventDefault();
    const ok = document.execCommand('insertLineBreak');
    if (!ok) document.execCommand('insertHTML', false, '<br>');
    syncFromPreview();
  };

  const handlePreviewFocus = () => {
    editingPreview.current = true;
    previewDirty.current = false;
    setPreviewFocused(true);
    setActiveSurface('preview');
  };

  const handlePreviewBlur = () => {
    editingPreview.current = false;
    setPreviewFocused(false);
    // Clicking in and out without editing should not rewrite the markdown.
    if (!previewDirty.current) return;
    previewDirty.current = false;
    const el = previewRef.current;
    const next = el ? turndown.turndown(el.innerHTML) : value;
    setPreviewSource(next);
    setPreviewKey((k) => k + 1);
    if (next !== value) onChange(next);
  };

  // Toolbar actions operate on whichever pane is active: the raw markdown
  // textarea, or the inline-editable preview (via execCommand).
  const applyTool = (id: ToolId) => {
    if (previewActive) {
      const el = previewRef.current;
      if (!el) return;
      el.focus();
      switch (id) {
        case 'bold': document.execCommand('bold'); break;
        case 'italic': document.execCommand('italic'); break;
        case 'heading': document.execCommand('formatBlock', false, 'H2'); break;
        case 'quote': document.execCommand('formatBlock', false, 'BLOCKQUOTE'); break;
        case 'ul': document.execCommand('insertUnorderedList'); break;
        case 'ol': document.execCommand('insertOrderedList'); break;
        case 'link': {
          const url = window.prompt('URL', 'https://');
          if (url) document.execCommand('createLink', false, url);
          break;
        }
        case 'code': {
          const selected = window.getSelection()?.toString() ?? '';
          document.execCommand('insertHTML', false, `<code>${escapeHtml(selected)}</code>`);
          break;
        }
        case 'image': fileInputRef.current?.click(); return;
        case 'hr': document.execCommand('insertHorizontalRule'); break;
      }
      syncFromPreview();
      return;
    }
    switch (id) {
      case 'bold': wrapSelection('**'); break;
      case 'italic': wrapSelection('*'); break;
      case 'heading': prefixLine('## '); break;
      case 'quote': prefixLine('> '); break;
      case 'ul': prefixLine('- '); break;
      case 'ol': prefixLine('1. '); break;
      case 'link': wrapSelection('[', '](https://)'); break;
      case 'code': wrapSelection('`'); break;
      case 'image': fileInputRef.current?.click(); break;
      case 'hr': onChange(`${value}\n\n---\n\n`); break;
    }
  };

  const tools: { id: ToolId; icon: typeof Bold; title: string }[] = [
    { id: 'bold', icon: Bold, title: 'Bold' },
    { id: 'italic', icon: Italic, title: 'Italic' },
    { id: 'heading', icon: Heading2, title: 'Heading' },
    { id: 'quote', icon: Quote, title: 'Quote' },
    { id: 'ul', icon: List, title: 'Bullet list' },
    { id: 'ol', icon: ListOrdered, title: 'Numbered list' },
    { id: 'link', icon: Link2, title: 'Link' },
    { id: 'code', icon: Code2, title: 'Inline code' },
    { id: 'image', icon: ImagePlus, title: t('admin.editor.insertImage') },
    { id: 'hr', icon: Minus, title: 'Divider' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageSelected(file);
        }}
      />
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-gray-200 bg-gray-50">
        {tools.map(({ id, icon: Icon, title }) => (
          <button
            key={id}
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyTool(id)}
            disabled={id === 'image' && uploadingImage}
            className="p-2 rounded text-gray-600 hover:bg-gray-200 hover:text-black disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Icon size={16} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 bg-white rounded-md border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${mode === 'write' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {t('admin.editor.write')}
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${mode === 'split' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {t('admin.editor.split')}
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${mode === 'preview' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {t('admin.editor.preview')}
          </button>
        </div>
      </div>

      <div className={`grid ${mode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {mode !== 'preview' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setActiveSurface('source')}
            placeholder={placeholder}
            data-lenis-prevent
            className="w-full h-[480px] p-4 font-mono text-sm leading-relaxed outline-none resize-none overflow-auto border-r border-gray-100"
          />
        )}
        {mode !== 'write' && (
          <div className="relative w-full h-[480px] bg-gray-50/50">
            {!value.trim() && !previewFocused && (
              <p className="pointer-events-none absolute left-0 top-0 p-4 text-sm text-gray-400">
                {t('admin.editor.previewEmpty')}
              </p>
            )}
            <div
              key={previewKey}
              ref={previewRef}
              contentEditable
              suppressContentEditableWarning
              data-lenis-prevent
              onFocus={handlePreviewFocus}
              onInput={handlePreviewInput}
              onKeyDown={handlePreviewKeyDown}
              onBlur={handlePreviewBlur}
              className="prose prose-sm max-w-none h-full overflow-auto p-4 outline-none transition-colors focus:bg-white prose-headings:font-bold prose-img:rounded-lg"
            >
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{previewSource}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-gray-100 bg-white text-xs text-gray-400 flex items-center justify-between">
        <span>{label}</span>
        <span>
          {value.length} {t('admin.editor.characters')}
        </span>
      </div>
    </div>
  );
}

export default function PostEditor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeLang, setActiveLang] = useState<'en' | 'zh'>('en');
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    slug: '',
    title_en: '',
    title_zh: '',
    excerpt_en: '',
    excerpt_zh: '',
    content_en: '',
    content_zh: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
    backup_image_url: '',
    author: 'Up-Brands Team',
    tags: [],
  });

  const [tagsString, setTagsString] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    const { data } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (data) {
      setFormData(data);
      setTagsString(data.tags?.join(', ') || '');
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    const toastId = toast.loading(t('admin.editor.uploading'));
    try {
      const url = await uploadImageFile(file, 'covers');
      setFormData((prev) => ({ ...prev, imageUrl: url, backup_image_url: url }));
      toast.success(t('admin.editor.uploadSuccess'), { id: toastId });
    } catch (error) {
      console.error(error);
      const detail = error instanceof Error ? error.message : '';
      toast.error(detail ? `${t('admin.editor.uploadFailed')}: ${detail}` : t('admin.editor.uploadFailed'), { id: toastId });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (isNew || !id) return;
    if (!confirm(t('admin.editor.deleteConfirm'))) return;
    try {
      await supabase.from('posts').delete().eq('id', id);
      toast.success(t('admin.editor.deleted'));
      navigate('/admin/posts');
    } catch (error) {
      toast.error(t('admin.editor.deleteFailed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: tagsString.split(',').map((t) => t.trim()).filter(Boolean),
      };

      if (isNew) {
        await supabase.from('posts').insert(payload);
      } else {
        await supabase.from('posts').update(payload).eq('id', id);
      }

      // Notify Bing IndexNow
      try {
        const postUrl = `https://www.up-brands.com/blog/${payload.slug}`;

        // Use our new backend API
        fetch(`/api/indexnow?url=${encodeURIComponent(postUrl)}`)
          .then((res) => res.json())
          .then((data) => console.log('IndexNow result:', data))
          .catch((err) => console.warn('IndexNow failed', err));

        // Notify Baidu (via proxy to avoid CORS)
        const baiduToken = 'a8dKMsRIVkl7JfbF';
        const baiduProxyUrl = `/api/baidu-push?site=https://www.up-brands.com&token=${baiduToken}&url=${encodeURIComponent(postUrl)}`;

        // Fire and forget
        fetch(baiduProxyUrl).catch((err) => console.warn('Baidu push failed', err));

        toast.success(t('admin.editor.saved'));
      } catch (err) {
        // Ignore SEO errors
      }

      navigate('/admin/posts');
    } catch (error) {
      console.error('Error saving post:', error);
      alert(t('admin.editor.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const setField = (key: keyof BlogPost, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <Helmet>
        <title>{isNew ? t('admin.editor.newTitle') : t('admin.editor.editTitle')} | Admin</title>
      </Helmet>

      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/admin/posts" className="text-sm text-gray-400 hover:text-black transition-colors">
            ← {t('admin.editor.back')}
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight mt-1">
            {isNew ? t('admin.editor.newTitle') : t('admin.editor.editTitle')}
          </h1>
        </div>
        {!isNew && formData.slug && (
          <a
            href={`/blog/${formData.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            <ExternalLink size={16} /> {t('admin.editor.viewLive')}
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Meta Info */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">{t('admin.editor.settings')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.slug')}</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setField('slug', e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.date')}</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setField('date', e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.cover')}</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCoverUpload(file);
                }}
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setField('imageUrl', e.target.value)}
                  className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Upload size={16} />
                  {uploadingCover ? t('admin.editor.uploading') : t('admin.editor.upload')}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('admin.editor.coverHint')}</p>
              {formData.imageUrl && (
                <div className="mt-3 w-full max-w-xs aspect-[16/9] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                  <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.author')}</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setField('author', e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.tags')}</label>
              <input
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                placeholder={t('admin.editor.tagsPlaceholder')}
              />
            </div>
          </div>
        </section>

        {/* Content Editor */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">{t('admin.editor.content')}</h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveLang('en')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeLang === 'en' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('zh')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeLang === 'zh' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                中文
              </button>
            </div>
          </div>

          {activeLang === 'en' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.titleEn')}</label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setField('title_en', e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.excerptEn')}</label>
                <textarea
                  value={formData.excerpt_en}
                  onChange={(e) => setField('excerpt_en', e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none h-24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.contentEn')}</label>
                <MarkdownField
                  label={t('admin.editor.mdHint', { lang: 'EN' })}
                  value={formData.content_en || ''}
                  onChange={(v) => setField('content_en', v)}
                  placeholder={'# Heading\n\nWrite your article in **Markdown**...'}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.titleZh')}</label>
                <input
                  type="text"
                  value={formData.title_zh}
                  onChange={(e) => setField('title_zh', e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.excerptZh')}</label>
                <textarea
                  value={formData.excerpt_zh}
                  onChange={(e) => setField('excerpt_zh', e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none h-24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.editor.contentZh')}</label>
                <MarkdownField
                  label={t('admin.editor.mdHint', { lang: '中文' })}
                  value={formData.content_zh || ''}
                  onChange={(v) => setField('content_zh', v)}
                  placeholder={'# 标题\n\n用 **Markdown** 撰写正文...'}
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.editor.zhHint')}</p>
              </div>
            </div>
          )}
        </section>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              {!isNew && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={16} /> {t('admin.editor.delete')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/posts')}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                {t('admin.editor.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 bg-black text-white rounded font-bold uppercase hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? t('admin.editor.saving') : t('admin.editor.save')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
