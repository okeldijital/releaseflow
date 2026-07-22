import type { Document } from '../domain/Document';
import type { DocumentBlock, DocumentInline } from '../domain/DocumentSection';
import type { DocumentRenderer, RenderedDocument } from '../application/DocumentRenderer';
import {
  createRenderContext,
  type RenderContext,
} from '../application/RenderContext';

/**
 * HTML renderer for previews / future web surfaces.
 * Still uses the canonical Document model (not product entities).
 */
export class HtmlRenderer implements DocumentRenderer {
  async render(document: Document, context?: RenderContext): Promise<RenderedDocument> {
    createRenderContext(context);
    const body = document.sections
      .map((section) => {
        const heading = section.heading ? `<h2>${escape(section.heading)}</h2>` : '';
        const meta =
          section.metadataRows
            ?.map(
              (r) =>
                `<div class="meta-row"><strong>${escape(r.label)}:</strong> ${escape(r.value)}</div>`,
            )
            .join('') ?? '';
        const blocks = section.blocks.map(blockToHtml).join('');
        return `<section>${heading}${meta}${blocks}</section>`;
      })
      .join('\n');

    const cover = document.cover
      ? `<header class="cover">
          ${document.cover.imageUrl ? `<img src="${escape(document.cover.imageUrl)}" alt="" />` : ''}
          <h1>${escape(document.cover.title)}</h1>
          ${document.cover.subtitle ? `<p class="subtitle">${escape(document.cover.subtitle)}</p>` : ''}
          ${(document.cover.lines ?? []).map((l) => `<p class="line">${escape(l)}</p>`).join('')}
        </header>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escape(document.title)}</title>
  <style>
    body { font-family: Georgia, serif; color: #1a1a1a; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { font-size: 1.75rem; } h2 { font-size: 1.25rem; } h3 { font-size: 1.1rem; }
    .cover { text-align: center; margin-bottom: 2rem; }
    .cover img { width: 180px; height: 180px; object-fit: cover; border-radius: 4px; }
    blockquote { border-left: 3px solid #cc5500; padding-left: 0.75rem; color: #444; font-style: italic; }
    .meta-row { margin: 0.25rem 0; }
  </style>
</head>
<body>
${cover}
${body}
</body>
</html>`;

    return {
      mimeType: 'text/html;charset=utf-8',
      filename: (document.filename ?? `${document.title}.html`).replace(/\.pdf$/i, '.html'),
      data: html,
    };
  }
}

function blockToHtml(block: DocumentBlock): string {
  switch (block.type) {
    case 'heading':
      return `<h${block.level}>${inlinesToHtml(block.inlines)}</h${block.level}>`;
    case 'bulletList':
      return `<ul>${block.items.map((i) => `<li>${inlinesToHtml(i)}</li>`).join('')}</ul>`;
    case 'orderedList':
      return `<ol>${block.items.map((i) => `<li>${inlinesToHtml(i)}</li>`).join('')}</ol>`;
    case 'blockquote':
      return `<blockquote>${inlinesToHtml(block.inlines)}</blockquote>`;
    default:
      return `<p>${inlinesToHtml(block.inlines)}</p>`;
  }
}

function inlinesToHtml(inlines: DocumentInline[]): string {
  return inlines
    .map((n) => {
      if (n.type === 'break') return '<br/>';
      if (n.type === 'link') {
        return `<a href="${escape(n.href)}">${escape(n.text)} (${escape(n.href)})</a>`;
      }
      let t = escape(n.text);
      if (n.marks?.includes('bold')) t = `<strong>${t}</strong>`;
      if (n.marks?.includes('italic')) t = `<em>${t}</em>`;
      if (n.marks?.includes('underline')) t = `<u>${t}</u>`;
      return t;
    })
    .join('');
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
