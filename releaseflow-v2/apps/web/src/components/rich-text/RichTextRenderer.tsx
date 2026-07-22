'use client';

import type { ReactNode } from 'react';
import type { InlineNode, RichTextBlock, RichTextDocument } from '@/lib/rich-text';
import { isRichTextEmpty } from '@/lib/rich-text';

function InlineView({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === 'hardBreak') return <br key={i} />;
        if (n.type === 'link') {
          return (
            <a
              key={i}
              href={n.href}
              className="text-primary-500 underline hover:text-primary-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InlineView nodes={n.content} />
            </a>
          );
        }
        let el: ReactNode = n.text;
        if (n.marks?.includes('bold')) el = <strong>{el}</strong>;
        if (n.marks?.includes('italic')) el = <em>{el}</em>;
        if (n.marks?.includes('underline')) el = <u>{el}</u>;
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

function BlockView({ block }: { block: RichTextBlock }) {
  switch (block.type) {
    case 'heading': {
      const className =
        block.level === 1
          ? 'text-xl font-semibold text-content-primary mb-2'
          : block.level === 2
            ? 'text-lg font-semibold text-content-primary mb-2'
            : 'text-base font-semibold text-content-primary mb-1';
      if (block.level === 1) return <h2 className={className}><InlineView nodes={block.content} /></h2>;
      if (block.level === 2) return <h3 className={className}><InlineView nodes={block.content} /></h3>;
      return <h4 className={className}><InlineView nodes={block.content} /></h4>;
    }
    case 'bulletList':
      return (
        <ul className="list-disc pl-5 mb-3 space-y-1 text-content-primary text-sm">
          {block.items.map((item, i) => (
            <li key={i}><InlineView nodes={item} /></li>
          ))}
        </ul>
      );
    case 'orderedList':
      return (
        <ol className="list-decimal pl-5 mb-3 space-y-1 text-content-primary text-sm">
          {block.items.map((item, i) => (
            <li key={i}><InlineView nodes={item} /></li>
          ))}
        </ol>
      );
    case 'blockquote':
      return (
        <blockquote className="border-l-2 border-primary-500 pl-3 mb-3 text-sm text-content-secondary italic">
          <InlineView nodes={block.content} />
        </blockquote>
      );
    case 'paragraph':
    default:
      return (
        <p className="mb-3 text-sm text-content-primary leading-relaxed">
          <InlineView nodes={block.content} />
        </p>
      );
  }
}

export function RichTextRenderer({
  value,
  emptyLabel = 'No liner notes yet.',
  className = '',
}: {
  value: RichTextDocument | null | undefined;
  emptyLabel?: string;
  className?: string;
}) {
  if (!value || isRichTextEmpty(value)) {
    return <p className={`text-sm text-content-label ${className}`}>{emptyLabel}</p>;
  }
  return (
    <div className={className}>
      {value.content.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
