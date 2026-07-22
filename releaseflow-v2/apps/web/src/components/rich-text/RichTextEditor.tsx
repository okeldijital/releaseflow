'use client';

/**
 * Canonical ReleaseFlow RichText editor (single shared implementation).
 * Stores structured document JSON; uses contenteditable for authoring.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { RichTextDocument } from '@/lib/rich-text';
import {
  emptyRichTextDocument,
  htmlToRichText,
  richTextToHtml,
} from '@/lib/rich-text';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  className = '',
  minHeightClass = 'min-h-[200px]',
}: {
  value: RichTextDocument | null;
  onChange: (doc: RichTextDocument) => void;
  placeholder?: string;
  className?: string;
  minHeightClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string>('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = richTextToHtml(value ?? emptyRichTextDocument());
    if (html !== lastHtml.current && document.activeElement !== el) {
      el.innerHTML = html || '<p><br></p>';
      lastHtml.current = html;
    }
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    lastHtml.current = html;
    onChange(htmlToRichText(html));
  }, [onChange]);

  function cmd(command: string, arg?: string) {
    ref.current?.focus();
    try {
      document.execCommand(command, false, arg);
    } catch {
      /* ignore unsupported commands */
    }
    emit();
  }

  function insertLink() {
    const href = window.prompt('Link URL');
    if (!href?.trim()) return;
    cmd('createLink', href.trim());
  }

  const tools: { label: string; title: string; action: () => void }[] = [
    { label: 'B', title: 'Bold', action: () => cmd('bold') },
    { label: 'I', title: 'Italic', action: () => cmd('italic') },
    { label: 'U', title: 'Underline', action: () => cmd('underline') },
    { label: 'H1', title: 'Heading 1', action: () => cmd('formatBlock', 'h1') },
    { label: 'H2', title: 'Heading 2', action: () => cmd('formatBlock', 'h2') },
    { label: 'H3', title: 'Heading 3', action: () => cmd('formatBlock', 'h3') },
    { label: 'P', title: 'Paragraph', action: () => cmd('formatBlock', 'p') },
    { label: '•', title: 'Bullet list', action: () => cmd('insertUnorderedList') },
    { label: '1.', title: 'Numbered list', action: () => cmd('insertOrderedList') },
    { label: '“', title: 'Quote', action: () => cmd('formatBlock', 'blockquote') },
    { label: 'Link', title: 'Hyperlink', action: insertLink },
  ];

  return (
    <div className={`rounded-xl border border-surface-700 bg-surface-900 overflow-hidden ${className}`}>
      <div className="flex flex-wrap gap-1 border-b border-surface-700 bg-surface-950 px-2 py-2">
        {tools.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            onMouseDown={(e) => {
              e.preventDefault();
              t.action();
            }}
            className="h-8 min-w-8 px-2 rounded-lg text-xs font-semibold text-text-300 hover:bg-surface-800 hover:text-surface-50 transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline
        aria-label={placeholder}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        className={[
          minHeightClass,
          'px-4 py-3 text-sm text-surface-100 outline-none prose-invert',
          '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mb-2',
          '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2',
          '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1',
          '[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-primary-500 [&_blockquote]:pl-3 [&_blockquote]:text-text-300',
          '[&_a]:text-primary-400 [&_a]:underline',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-text-500',
        ].join(' ')}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
