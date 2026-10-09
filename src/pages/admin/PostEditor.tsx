import { memo, useState, useEffect, useRef } from 'react';
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
  X,
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
// Keep image alt text verbatim: the default rule escapes underscores, turning a
// filename like "hf_2026..." into "hf\_2026...".
turndown.addRule('image', {
  filter: 'img',
  replacement: (_content, node) => {
    const el = node as HTMLImageElement;
    return `![${el.getAttribute('alt') ?? ''}](${el.getAttribute('src') ?? ''})`;
  },
});

// execCommand editing leaves artefacts that turndown would otherwise turn into
// malformed markdown: a stray <br> at the start of a heading ("##   \nTitle"),
// bold text inside a heading ("## **Title**"), or <strong> wrapping a line
// break ("**  \n1. Title**"). Normalise a copy of the DOM into shapes that map
// to clean markdown. The live editor DOM is never touched.
function normalizeHtmlForMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const body = doc.body;
  const headings = 'h1,h2,h3,h4,h5,h6';

  // Headings hold plain text only: drop inline markup and line breaks.
  body.querySelectorAll(headings).forEach((heading) => {
    heading.textContent = (heading.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
  // An empty heading is just noise.
  body.querySelectorAll(headings).forEach((heading) => {
    if (!(heading.textContent ?? '').trim()) heading.remove();
  });

  // Emphasis must not wrap a line break; split it so <br> sits between runs.
  body.querySelectorAll('strong,b,em,i').forEach((el) => {
    if (!el.querySelector('br')) return;
    const fragment = doc.createDocumentFragment();
    let run = doc.createElement(el.tagName.toLowerCase());
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'BR') {
        if (run.childNodes.length) fragment.appendChild(run);
        fragment.appendChild(node.cloneNode());
        run = doc.createElement(el.tagName.toLowerCase());
      } else {
        run.appendChild(node);
      }
    });
    if (run.childNodes.length) fragment.appendChild(run);
    el.replaceWith(fragment);
  });

  return body.innerHTML;
}

const htmlToMarkdown = (el: HTMLElement) => turndown.turndown(normalizeHtmlForMarkdown(el.innerHTML));

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Turn a base64 data: URL (Word / Google Docs embed pictures this way) into a
// File so it can go through the same CDN upload path as a real image file.
async function dataUrlToFile(dataUrl: string, index: number): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = (blob.type.split('/')[1] || 'png').replace('+xml', '');
  return new File([blob], `pasted-${index}.${ext}`, { type: blob.type || 'image/png' });
}

// Pasted rich text (Word, Google Docs, web pages) carries inline base64 pictures
// plus a lot of presentational junk. Keep only semantic tags and pull the base64
// pictures out, so they can be uploaded and no huge data URL reaches the DB.
function cleanPastedHtml(html: string): { html: string; dataUrls: string[] } {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const body = doc.body;
  const dataUrls: string[] = [];

  body
    .querySelectorAll('style,script,meta,link,title,noscript,iframe,svg,canvas,object,embed')
    .forEach((el) => el.remove());

  body.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (src.startsWith('data:image/')) dataUrls.push(src);
    img.remove();
  });

  const allowed = new Set([
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U',
    'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'CODE', 'PRE', 'HR',
  ]);
  Array.from(body.querySelectorAll('*')).forEach((el) => {
    if (!allowed.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes));
      return;
    }
    Array.from(el.attributes).forEach((attr) => {
      if (el.tagName === 'A' && attr.name === 'href') return;
      el.removeAttribute(attr.name);
    });
  });

  return { html: body.innerHTML, dataUrls };
}

type ToolId = 'bold' | 'italic' | 'heading' | 'quote' | 'ul' | 'ol' | 'link' | 'code' | 'image' | 'hr';

type PoolImage = { url: string; name: string };

type MarkdownFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  poolImages: PoolImage[];
  poolUploading: boolean;
  onUploadImages: (files: File[]) => Promise<PoolImage[]>;
  onRemoveImage: (url: string) => void;
};

// The rich surface is user-owned while editing: React must never re-render the
// markdown tree underneath the caret, because that is exactly what reverted a
// freshly typed Enter / line break. memo with an always-equal comparator freezes
// the subtree until we deliberately remount it with a new key.
const FrozenMarkdown = memo(
  function FrozenMarkdown({ source }: { source: string }) {
    return <ReactMarkdown remarkPlugins={[remarkBreaks]}>{source}</ReactMarkdown>;
  },
  () => true
);

function MarkdownField({
  label,
  value,
  onChange,
  placeholder,
  poolImages,
  poolUploading,
  onUploadImages,
  onRemoveImage,
}: MarkdownFieldProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const poolFileRef = useRef<HTMLInputElement>(null);
  // Rich (WYSIWYG) editing is the primary surface; Markdown is an optional view
  // for people who prefer the raw source (or want to copy it out).
  const [mode, setMode] = useState<'rich' | 'split' | 'markdown'>('rich');
  const [activeSurface, setActiveSurface] = useState<'source' | 'preview'>('source');
  const [previewFocused, setPreviewFocused] = useState(false);
  // While the rich editor is in use we feed it a frozen markdown snapshot so React
  // never rewrites the DOM under the caret. Re-rendering it from the markdown is
  // exactly what made a fresh Enter / line break snap back to its original form.
  const [previewSource, setPreviewSource] = useState(value);
  // Bumping this remounts FrozenMarkdown, rebuilding the rich DOM from markdown
  // only when we intend to (external value change, or returning from Markdown view).
  const [previewKey, setPreviewKey] = useState(0);
  // The markdown we last emitted through onChange. When it comes back on the value
  // prop we skip re-rendering, because the DOM already reflects it.
  const lastEmittedRef = useRef<string | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const previewDirty = useRef(false);
  // Last known caret position (as a text offset) inside the rich editor. Kept up
  // to date via selectionchange so inserting from the image pool still lands at
  // the caret even though clicking a thumbnail / opening the file dialog steals
  // focus and clears the DOM selection.
  const savedCaretOffsetRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    setPreviewSource(value);
    setPreviewKey((k) => k + 1);
  }, [value]);

  // Rebuild the rich DOM from markdown when coming back from the Markdown view,
  // where the editable surface was unmounted and the snapshot may be stale.
  const prevModeRef = useRef(mode);
  useEffect(() => {
    const prev = prevModeRef.current;
    if (prev === mode) return;
    prevModeRef.current = mode;
    if (prev === 'markdown' && mode !== 'markdown') {
      setPreviewSource(valueRef.current);
      setPreviewKey((k) => k + 1);
    }
  }, [mode]);

  // Track the caret while the rich editor is in use.
  useEffect(() => {
    const onSelectionChange = () => {
      const el = previewRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!el.contains(range.startContainer)) return;
      const probe = range.cloneRange();
      probe.selectNodeContents(el);
      probe.setEnd(range.startContainer, range.startOffset);
      savedCaretOffsetRef.current = probe.toString().length;
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const previewActive = mode === 'rich' || (mode === 'split' && activeSurface === 'preview');

  const insertText = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + snippet);
      return;
    }
    // When the textarea isn't focused (e.g. inserting from the image pool) fall
    // back to appending at the end instead of dropping the snippet at position 0.
    const focused = document.activeElement === el;
    const start = focused ? el.selectionStart : value.length;
    const end = focused ? el.selectionEnd : value.length;
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
    const md = htmlToMarkdown(el);
    lastEmittedRef.current = md;
    onChange(md);
  };

  const restoreRichCaret = () => {
    const el = previewRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    const offset = savedCaretOffsetRef.current;
    let placed = false;
    if (offset != null) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let remaining = offset;
      let node = walker.nextNode();
      while (node) {
        if (remaining <= node.textContent!.length) {
          range.setStart(node, remaining);
          range.collapse(true);
          placed = true;
          break;
        }
        remaining -= node.textContent!.length;
        node = walker.nextNode();
      }
    }
    if (!placed) {
      range.selectNodeContents(el);
      range.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // Insert an image coming from the shared image pool at the current caret.
  const insertImageAtCaret = (url: string, alt: string) => {
    if (previewActive) {
      const el = previewRef.current;
      if (!el) return;
      if (document.activeElement === el) el.focus();
      else restoreRichCaret();
      document.execCommand('insertHTML', false, `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`);
      syncFromPreview();
    } else {
      insertText(`\n\n![${alt}](${url})\n\n`);
    }
  };

  const handlePreviewInput = () => {
    syncFromPreview();
  };

  // Rich-text paste: upload every picture to the CDN, drop it into the shared
  // image pool, and insert it at the caret. Base64 pictures are pulled out of
  // the pasted HTML so no huge data URL ever reaches the database.
  const handlePreviewPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboard = e.clipboardData;
    if (!clipboard) return;

    const files: File[] = [];
    const seen = new Set<string>();
    const addFile = (file: File | null) => {
      if (!file || !file.type.startsWith('image/')) return;
      const key = `${file.name}:${file.size}`;
      if (seen.has(key)) return;
      seen.add(key);
      files.push(file);
    };
    Array.from(clipboard.items).forEach((item) => {
      if (item.kind === 'file') addFile(item.getAsFile());
    });
    Array.from(clipboard.files).forEach(addFile);

    const rawHtml = clipboard.getData('text/html');
    const { html: cleanHtml, dataUrls } = rawHtml
      ? cleanPastedHtml(rawHtml)
      : { html: '', dataUrls: [] as string[] };
    const plainText = clipboard.getData('text/plain');

    // Nothing to upload: keep the browser's default paste.
    if (files.length === 0 && dataUrls.length === 0) return;
    e.preventDefault();

    // Insert the text part first, keeping the rich structure but without images.
    if (cleanHtml) document.execCommand('insertHTML', false, cleanHtml);
    else if (plainText) document.execCommand('insertText', false, plainText);

    // Remember the caret so the pictures land right after the pasted text, even
    // though the uploads finish later.
    const selection = window.getSelection();
    const caret = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

    const inlineFiles = await Promise.all(dataUrls.map((url, i) => dataUrlToFile(url, i)));
    const uploaded = await onUploadImages([...inlineFiles, ...files]);

    const el = previewRef.current;
    if (!el || uploaded.length === 0) return;
    el.focus();
    const sel = window.getSelection();
    if (sel && caret) {
      sel.removeAllRanges();
      sel.addRange(caret);
    }
    uploaded.forEach((img) => {
      document.execCommand('insertHTML', false, `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.name)}">`);
    });
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
    previewDirty.current = false;
    setPreviewFocused(true);
    setActiveSurface('preview');
  };

  const handlePreviewBlur = () => {
    setPreviewFocused(false);
    // Clicking in and out without editing should not rewrite the markdown.
    if (!previewDirty.current) return;
    previewDirty.current = false;
    const el = previewRef.current;
    const next = el ? htmlToMarkdown(el) : value;
    // Never feed the markdown back into the DOM here: re-rendering the rich
    // surface from markdown is what undid a freshly typed Enter / line break.
    // The DOM is left exactly as the user sees it; we only sync the value out.
    lastEmittedRef.current = next;
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
        case 'image':
          poolFileRef.current?.click();
          return;
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
      case 'image': poolFileRef.current?.click(); break;
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
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-gray-200 bg-gray-50">
        {tools.map(({ id, icon: Icon, title }) => (
          <button
            key={id}
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyTool(id)}
            disabled={id === 'image' && poolUploading}
            className="p-2 rounded text-gray-600 hover:bg-gray-200 hover:text-black disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Icon size={16} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 bg-white rounded-md border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setMode('rich')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${mode === 'rich' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {t('admin.editor.rich')}
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
            onClick={() => setMode('markdown')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${mode === 'markdown' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {t('admin.editor.markdown')}
          </button>
        </div>
      </div>

      {/* Attachment-style image pool, shared by EN & 中文. Click a thumbnail to
          drop it at the caret of the field you are editing. */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 bg-white overflow-x-auto" data-lenis-prevent>
        <span className="shrink-0 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-gray-400">
          <ImagePlus size={14} /> {t('admin.editor.imagePool')}
        </span>
        <input
          ref={poolFileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length) onUploadImages(Array.from(files));
            e.target.value = '';
          }}
        />
        {poolImages.length === 0 && (
          <span className="shrink-0 text-xs text-gray-400">{t('admin.editor.imagePoolHint')}</span>
        )}
        {poolImages.map((img) => (
          <div key={img.url} className="group relative shrink-0">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertImageAtCaret(img.url, img.name)}
              title={`${t('admin.editor.insertImage')}: ${img.name}`}
              className="block w-12 h-12 overflow-hidden rounded border border-gray-200 bg-white hover:border-black transition-colors"
            >
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveImage(img.url)}
              title={t('admin.editor.removeImage')}
              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-black text-white hover:bg-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => poolFileRef.current?.click()}
          disabled={poolUploading}
          className="ml-auto shrink-0 flex items-center gap-1.5 border border-gray-200 px-2.5 py-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          <Upload size={14} />
          {poolUploading ? t('admin.editor.uploading') : t('admin.editor.addImage')}
        </button>
      </div>

      <div className={`grid ${mode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {mode !== 'rich' && (
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
        {mode !== 'markdown' && (
          <div className="relative w-full h-[480px] bg-white">
            {!value.trim() && !previewFocused && (
              <p className="pointer-events-none absolute left-0 top-0 p-4 text-sm text-gray-400">
                {t('admin.editor.editorEmpty')}
              </p>
            )}
            <div
              ref={previewRef}
              contentEditable
              suppressContentEditableWarning
              data-lenis-prevent
              onFocus={handlePreviewFocus}
              onInput={handlePreviewInput}
              onPaste={handlePreviewPaste}
              onKeyDown={handlePreviewKeyDown}
              onBlur={handlePreviewBlur}
              className="prose prose-sm max-w-none h-full overflow-auto p-4 outline-none prose-headings:font-bold prose-img:rounded-lg"
            >
              <FrozenMarkdown key={previewKey} source={previewSource} />
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
  // Attachment-style image pool, shared between the EN and ZH content fields.
  const [poolImages, setPoolImages] = useState<PoolImage[]>([]);
  const [poolUploading, setPoolUploading] = useState(false);
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

  const handlePoolUpload = async (files: File[]): Promise<PoolImage[]> => {
    const list = files;
    if (list.length === 0) return [];
    setPoolUploading(true);
    const toastId = toast.loading(t('admin.editor.uploading'));
    try {
      const uploaded = await Promise.all(
        list.map(async (file) => ({
          url: await uploadImageFile(file, 'blog'),
          name: file.name.replace(/\.[^.]+$/, '') || 'image',
        }))
      );
      setPoolImages((prev) => [...prev, ...uploaded]);
      toast.success(t('admin.editor.uploadSuccess'), { id: toastId });
      return uploaded;
    } catch (error) {
      console.error(error);
      const detail = error instanceof Error ? error.message : '';
      toast.error(detail ? `${t('admin.editor.uploadFailed')}: ${detail}` : t('admin.editor.uploadFailed'), { id: toastId });
      return [];
    } finally {
      setPoolUploading(false);
    }
  };

  const removeFromPool = (url: string) =>
    setPoolImages((prev) => prev.filter((img) => img.url !== url));

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
        const { data, error } = await supabase.from('posts').insert(payload).select('id').single();
        if (error) throw error;
        // Swap /new for the real id but stay on the editor page so the author
        // can keep working without being bounced back to the post list.
        if (data?.id) navigate(`/admin/posts/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase.from('posts').update(payload).eq('id', id);
        if (error) throw error;
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
      } catch (err) {
        // Ignore SEO errors
      }

      toast.success(t('admin.editor.saved'));
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
                  label={t('admin.editor.bodyHint', { lang: 'EN' })}
                  value={formData.content_en || ''}
                  onChange={(v) => setField('content_en', v)}
                  placeholder={'# Heading\n\nWrite your article in **Markdown**...'}
                  poolImages={poolImages}
                  poolUploading={poolUploading}
                  onUploadImages={handlePoolUpload}
                  onRemoveImage={removeFromPool}
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
                  label={t('admin.editor.bodyHint', { lang: '中文' })}
                  value={formData.content_zh || ''}
                  onChange={(v) => setField('content_zh', v)}
                  placeholder={'# 标题\n\n用 **Markdown** 撰写正文...'}
                  poolImages={poolImages}
                  poolUploading={poolUploading}
                  onUploadImages={handlePoolUpload}
                  onRemoveImage={removeFromPool}
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
