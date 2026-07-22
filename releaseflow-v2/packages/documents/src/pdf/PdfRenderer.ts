/**
 * Deterministic PDF renderer using jsPDF.
 * Draws from canonical Document model — no HTML intermediate, no window.print().
 */

import { jsPDF } from 'jspdf';
import type { Document } from '../domain/Document';
import type { DocumentBlock, DocumentInline } from '../domain/DocumentSection';
import type { DocumentTheme } from '../domain/DocumentTheme';
import type { DocumentRenderer, RenderedDocument } from '../application/DocumentRenderer';
import {
  createRenderContext,
  type RenderContext,
} from '../application/RenderContext';
import { pageSizeMm, contentWidthMm } from './PdfLayout';
import { resolveJsPdfFont } from './PdfFonts';
import { RELEASEFLOW_PDF_THEME } from './PdfTheme';

const HEADER_BAND_MM = 10;
const FOOTER_BAND_MM = 10;
const COVER_ART_MM = 55;
const MIN_ORPHAN_HEADING_SPACE_MM = 18;

export class PdfRenderer implements DocumentRenderer {
  async render(document: Document, context?: RenderContext): Promise<RenderedDocument> {
    const ctx = context ?? createRenderContext({ theme: RELEASEFLOW_PDF_THEME });
    const theme = ctx.theme;
    const page = pageSizeMm(theme.pageSize, theme.orientation);
    const pdf = new jsPDF({
      orientation: theme.orientation,
      unit: 'mm',
      format: theme.pageSize,
      compress: true,
    });

    pdf.setProperties({
      title: document.metadata.title,
      author: document.metadata.author ?? 'ReleaseFlow',
      subject: document.metadata.subject ?? document.title,
      keywords: (document.metadata.keywords ?? []).join(', '),
      creator: document.metadata.creator ?? 'ReleaseFlow',
    });

    const margins = theme.marginsMm;
    const usableWidth = contentWidthMm(page, margins);
    let y = margins.top;
    let pageIndex = 1;

    const ensureSpace = (neededMm: number, opts?: { allowHeader?: boolean }) => {
      const limit = page.height - margins.bottom - FOOTER_BAND_MM;
      if (y + neededMm > limit) {
        addPage();
        if (opts?.allowHeader !== false && pageIndex > 1) {
          drawHeader();
          y = margins.top + HEADER_BAND_MM + 4;
        } else {
          y = margins.top;
        }
      }
    };

    const addPage = () => {
      pdf.addPage();
      pageIndex += 1;
    };

    const setFont = (
      key: keyof DocumentTheme['fonts'],
      overrideStyle?: 'normal' | 'bold' | 'italic',
    ) => {
      const spec = theme.fonts[key];
      const { fontName, fontStyle } = resolveJsPdfFont(
        spec.family,
        overrideStyle ?? spec.style,
      );
      pdf.setFont(fontName, fontStyle);
      pdf.setFontSize(spec.sizePt);
      pdf.setTextColor(theme.colors.text);
    };

    const drawHeader = () => {
      if (!document.header) return;
      setFont('footer');
      pdf.setTextColor(theme.colors.muted);
      const left = document.header.left;
      const right = document.header.right ?? '';
      pdf.text(left, margins.left, margins.top - 4);
      if (right) {
        const w = pdf.getTextWidth(right);
        pdf.text(right, page.width - margins.right - w, margins.top - 4);
      }
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);
      pdf.line(margins.left, margins.top - 1, page.width - margins.right, margins.top - 1);
      pdf.setTextColor(theme.colors.text);
    };

    const drawCover = async () => {
      y = margins.top + 10;
      const centerX = page.width / 2;

      if (document.cover?.imageUrl) {
        try {
          const dataUrl = await loadImageAsDataUrl(document.cover.imageUrl);
          if (dataUrl) {
            const imgW = COVER_ART_MM;
            const imgH = COVER_ART_MM;
            const imgX = centerX - imgW / 2;
            const format = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            pdf.addImage(dataUrl, format, imgX, y, imgW, imgH);
            y += imgH + 10;
          }
        } catch {
          /* artwork optional — continue without image */
        }
      }

      setFont('title');
      const titleLines = pdf.splitTextToSize(document.cover?.title ?? document.title, usableWidth);
      for (const line of titleLines as string[]) {
        const tw = pdf.getTextWidth(line);
        pdf.text(line, centerX - tw / 2, y);
        y += theme.fonts.title.sizePt * 0.45;
      }
      y += 4;

      if (document.cover?.subtitle) {
        setFont('subtitle');
        pdf.setTextColor(theme.colors.muted);
        const sub = pdf.splitTextToSize(document.cover.subtitle, usableWidth) as string[];
        for (const line of sub) {
          const tw = pdf.getTextWidth(line);
          pdf.text(line, centerX - tw / 2, y);
          y += theme.fonts.subtitle.sizePt * 0.45;
        }
        pdf.setTextColor(theme.colors.text);
        y += 3;
      }

      if (document.cover?.lines?.length) {
        setFont('meta');
        pdf.setTextColor(theme.colors.muted);
        for (const line of document.cover.lines) {
          const tw = pdf.getTextWidth(line);
          pdf.text(line, centerX - tw / 2, y);
          y += theme.fonts.meta.sizePt * 0.5;
        }
        pdf.setTextColor(theme.colors.text);
      }

      if (document.cover?.generatedBy) {
        y += 6;
        setFont('footer');
        pdf.setTextColor(theme.colors.muted);
        const g = document.cover.generatedBy;
        const tw = pdf.getTextWidth(g);
        pdf.text(g, centerX - tw / 2, y);
        pdf.setTextColor(theme.colors.text);
      }

      // Start body on next page when we have substantial cover content
      addPage();
      drawHeader();
      y = margins.top + HEADER_BAND_MM + 4;
    };

    const writeInlines = (
      inlines: DocumentInline[],
      maxWidth: number,
      baseFont: keyof DocumentTheme['fonts'],
    ): string[] => {
      // Flatten to styled runs then wrap as plain text for layout simplicity
      const plain = inlinesToPlain(inlines);
      setFont(baseFont);
      return pdf.splitTextToSize(plain, maxWidth) as string[];
    };

    const drawBlock = (block: DocumentBlock) => {
      if (block.type === 'heading') {
        const fontKey =
          block.level === 1 ? 'heading1' : block.level === 2 ? 'heading2' : 'heading3';
        const size = theme.fonts[fontKey].sizePt;
        const lineH = size * 0.45 * theme.lineHeight;
        const lines = writeInlines(block.inlines, usableWidth, fontKey);
        ensureSpace(Math.max(MIN_ORPHAN_HEADING_SPACE_MM, lines.length * lineH + 6));
        setFont(fontKey);
        for (const line of lines) {
          ensureSpace(lineH + 2);
          pdf.text(line, margins.left, y);
          y += lineH;
        }
        y += 3;
        return;
      }

      if (block.type === 'bulletList' || block.type === 'orderedList') {
        const lineH = theme.fonts.body.sizePt * 0.4 * theme.lineHeight;
        for (let i = 0; i < block.items.length; i++) {
          const prefix = block.type === 'orderedList' ? `${i + 1}. ` : '• ';
          const itemText = prefix + inlinesToPlain(block.items[i] ?? []);
          setFont('body');
          const lines = pdf.splitTextToSize(itemText, usableWidth - 4) as string[];
          ensureSpace(lines.length * lineH + 2);
          for (const line of lines) {
            ensureSpace(lineH + 1);
            pdf.text(line, margins.left + 2, y);
            y += lineH;
          }
          y += 1;
        }
        y += 2;
        return;
      }

      if (block.type === 'blockquote') {
        const lineH = theme.fonts.body.sizePt * 0.4 * theme.lineHeight;
        const lines = writeInlines(block.inlines, usableWidth - 6, 'body');
        ensureSpace(lines.length * lineH + 4);
        pdf.setDrawColor(theme.colors.accent);
        pdf.setLineWidth(0.6);
        const blockTop = y - 2;
        setFont('body', 'italic');
        pdf.setTextColor(theme.colors.muted);
        for (const line of lines) {
          ensureSpace(lineH + 1);
          pdf.text(line, margins.left + 4, y);
          y += lineH;
        }
        pdf.line(margins.left, blockTop, margins.left, y - lineH + 2);
        pdf.setTextColor(theme.colors.text);
        y += 3;
        return;
      }

      // paragraph
      const lineH = theme.fonts.body.sizePt * 0.4 * theme.lineHeight;
      const lines = writeInlines(block.inlines, usableWidth, 'body');
      if (lines.length === 0) {
        y += lineH * 0.5;
        return;
      }
      for (const line of lines) {
        ensureSpace(lineH + 1);
        setFont('body');
        // Draw with basic mark support for full-line bold/italic when uniform
        pdf.text(line, margins.left, y);
        y += lineH;
      }
      y += 2.5;
    };

    // Cover
    if (document.cover) {
      await drawCover();
    } else {
      y = margins.top;
    }

    // Sections
    for (const section of document.sections) {
      if (section.heading) {
        const lineH = theme.fonts.heading1.sizePt * 0.45 * theme.lineHeight;
        ensureSpace(MIN_ORPHAN_HEADING_SPACE_MM);
        setFont('heading1');
        pdf.text(section.heading, margins.left, y);
        y += lineH + 3;
      }

      if (section.metadataRows?.length) {
        const lineH = theme.fonts.meta.sizePt * 0.45 * theme.lineHeight;
        for (const row of section.metadataRows) {
          ensureSpace(lineH + 2);
          setFont('meta', 'bold');
          pdf.text(`${row.label}: `, margins.left, y);
          const labelW = pdf.getTextWidth(`${row.label}: `);
          setFont('meta', 'normal');
          const valueLines = pdf.splitTextToSize(row.value, usableWidth - labelW) as string[];
          pdf.text(valueLines[0] ?? '', margins.left + labelW, y);
          y += lineH;
          for (let i = 1; i < valueLines.length; i++) {
            ensureSpace(lineH + 1);
            pdf.text(valueLines[i]!, margins.left + labelW, y);
            y += lineH;
          }
        }
        y += 4;
      }

      for (const block of section.blocks) {
        drawBlock(block);
      }
      y += 4;
    }

    // Footers on all pages
    const totalPages = pdf.getNumberOfPages();
    const generated = formatGenerated(ctx.generatedAt);
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      setFont('footer');
      pdf.setTextColor(theme.colors.muted);
      const footerY = page.height - margins.bottom + 6;
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);
      pdf.line(
        margins.left,
        page.height - margins.bottom + 1,
        page.width - margins.right,
        page.height - margins.bottom + 1,
      );
      const left = document.footer?.left ?? 'Generated from ReleaseFlow';
      pdf.text(left, margins.left, footerY);
      const mid = `Generated ${generated}`;
      const midW = pdf.getTextWidth(mid);
      pdf.text(mid, page.width / 2 - midW / 2, footerY);
      const right = `Page ${p} of ${totalPages}`;
      const rightW = pdf.getTextWidth(right);
      pdf.text(right, page.width - margins.right - rightW, footerY);
      pdf.setTextColor(theme.colors.text);

      // Header on body pages (skip pure cover-only first page if only cover content — still draw if header set)
      if (p > 1 && document.header) {
        setFont('footer');
        pdf.setTextColor(theme.colors.muted);
        pdf.text(document.header.left, margins.left, margins.top - 4);
        if (document.header.right) {
          const w = pdf.getTextWidth(document.header.right);
          pdf.text(document.header.right, page.width - margins.right - w, margins.top - 4);
        }
        pdf.setDrawColor(200);
        pdf.line(margins.left, margins.top - 1, page.width - margins.right, margins.top - 1);
        pdf.setTextColor(theme.colors.text);
      }
    }

    const arrayBuffer = pdf.output('arraybuffer') as ArrayBuffer;
    const data = new Uint8Array(arrayBuffer);
    const filename = document.filename ?? `${sanitize(document.title)}.pdf`;
    const blob = new Blob([data], { type: 'application/pdf' });

    return {
      mimeType: 'application/pdf',
      filename,
      data,
      blob,
    };
  }
}

function inlinesToPlain(inlines: DocumentInline[]): string {
  return inlines
    .map((n) => {
      if (n.type === 'break') return ' ';
      if (n.type === 'link') return `${n.text} (${n.href})`;
      return n.text;
    })
    .join('');
}

function formatGenerated(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sanitize(s: string): string {
  return s.replace(/[<>:"/\\|?*]/g, '').trim() || 'document';
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
