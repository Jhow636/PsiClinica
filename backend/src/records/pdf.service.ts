import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface SessionNote {
  id: string;
  content: string;
  tags: string[];
  createdAt: Date;
  appointment: { startTime: Date } | null;
}

interface PdfData {
  patientName: string;
  patientEmail?: string | null;
  patientPhone?: string | null;
  patientBirthDate?: Date | null;
  clinicName: string;
  psychologistName: string;
  anamnesis?: string | null;
  sessionNotes: SessionNote[];
  generatedAt: Date;
}

const MARGIN = 50;
const LINE_HEIGHT = 16;
const SECTION_GAP = 24;
const PAGE_W = 595;
const PAGE_H = 842;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BODY_FONT_SIZE = 10;
const SMALL_FONT_SIZE = 9;
const TITLE_FONT_SIZE = 16;
const H2_FONT_SIZE = 12;
const INDIGO = rgb(0.29, 0.29, 0.84);
const DARK = rgb(0.1, 0.1, 0.1);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.9, 0.9, 0.9);

@Injectable()
export class PdfService {
  async generateMedicalRecord(data: PdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;

    const newPage = () => {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    };

    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN) newPage();
    };

    const drawText = (
      text: string,
      x: number,
      yPos: number,
      size: number,
      font = fontRegular,
      color = DARK,
    ) => {
      page.drawText(text, { x, y: yPos, size, font, color });
    };

    const wrapText = (text: string, maxWidth: number, size: number, font = fontRegular): string[] => {
      const words = text.replace(/\r/g, '').split(' ');
      const lines: string[] = [];
      let current = '';
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
          if (current) lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const drawWrapped = (
      text: string,
      x: number,
      maxWidth: number,
      size: number,
      font = fontRegular,
      color = DARK,
    ): number => {
      const paragraphs = text.split('\n');
      let linesDrawn = 0;
      for (const para of paragraphs) {
        const lines = wrapText(para || ' ', maxWidth, size, font);
        for (const line of lines) {
          ensureSpace(LINE_HEIGHT);
          drawText(line, x, y, size, font, color);
          y -= LINE_HEIGHT;
          linesDrawn++;
        }
      }
      return linesDrawn;
    };

    // ── Header ────────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: PAGE_H - 72, width: PAGE_W, height: 72, color: INDIGO });
    drawText('PsiClínica', MARGIN, PAGE_H - 30, TITLE_FONT_SIZE, fontBold, rgb(1, 1, 1));
    drawText('Prontuário Eletrônico', MARGIN, PAGE_H - 52, BODY_FONT_SIZE, fontRegular, rgb(0.85, 0.85, 1));
    const dateStr = data.generatedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dateW = fontRegular.widthOfTextAtSize(dateStr, SMALL_FONT_SIZE);
    drawText(dateStr, PAGE_W - MARGIN - dateW, PAGE_H - 42, SMALL_FONT_SIZE, fontRegular, rgb(0.85, 0.85, 1));

    y = PAGE_H - 72 - SECTION_GAP;

    // ── Patient info ──────────────────────────────────────────────────────────
    drawText('DADOS DO PACIENTE', MARGIN, y, H2_FONT_SIZE, fontBold, INDIGO);
    y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: INDIGO });
    y -= LINE_HEIGHT;

    const infoRows: [string, string][] = [
      ['Nome', data.patientName],
      ...(data.patientEmail ? [['E-mail', data.patientEmail] as [string, string]] : []),
      ...(data.patientPhone ? [['Telefone', data.patientPhone] as [string, string]] : []),
      ...(data.patientBirthDate
        ? [['Data de nascimento', new Date(data.patientBirthDate).toLocaleDateString('pt-BR')] as [string, string]]
        : []),
      ['Psicanalista', data.psychologistName],
      ['Consultório', data.clinicName],
    ];

    for (const [label, value] of infoRows) {
      ensureSpace(LINE_HEIGHT);
      drawText(`${label}:`, MARGIN, y, BODY_FONT_SIZE, fontBold, GRAY);
      drawText(value, MARGIN + 130, y, BODY_FONT_SIZE, fontRegular, DARK);
      y -= LINE_HEIGHT;
    }

    y -= SECTION_GAP;

    // ── Anamnesis ─────────────────────────────────────────────────────────────
    ensureSpace(H2_FONT_SIZE + SECTION_GAP);
    drawText('ANAMNESE', MARGIN, y, H2_FONT_SIZE, fontBold, INDIGO);
    y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: INDIGO });
    y -= LINE_HEIGHT;

    if (data.anamnesis) {
      drawWrapped(data.anamnesis, MARGIN, CONTENT_W, BODY_FONT_SIZE);
    } else {
      drawText('Nenhuma anamnese registrada.', MARGIN, y, BODY_FONT_SIZE, fontRegular, GRAY);
      y -= LINE_HEIGHT;
    }

    y -= SECTION_GAP;

    // ── Session notes ─────────────────────────────────────────────────────────
    ensureSpace(H2_FONT_SIZE + SECTION_GAP);
    drawText(`EVOLUÇÕES CLÍNICAS (${data.sessionNotes.length})`, MARGIN, y, H2_FONT_SIZE, fontBold, INDIGO);
    y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: INDIGO });
    y -= LINE_HEIGHT;

    if (!data.sessionNotes.length) {
      drawText('Nenhuma evolução registrada.', MARGIN, y, BODY_FONT_SIZE, fontRegular, GRAY);
      y -= LINE_HEIGHT;
    }

    for (const [i, note] of data.sessionNotes.entries()) {
      ensureSpace(LINE_HEIGHT * 3 + SECTION_GAP);

      // Note header background
      const headerH = LINE_HEIGHT + 8;
      page.drawRectangle({ x: MARGIN, y: y - headerH + LINE_HEIGHT, width: CONTENT_W, height: headerH, color: LIGHT_GRAY });

      const sessionDate = note.appointment?.startTime
        ? new Date(note.appointment.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

      drawText(`Sessão ${i + 1} — ${sessionDate}`, MARGIN + 6, y, BODY_FONT_SIZE, fontBold, DARK);
      y -= headerH;

      if (note.tags.length) {
        drawText(`Tags: ${note.tags.join(', ')}`, MARGIN + 6, y, SMALL_FONT_SIZE, fontRegular, GRAY);
        y -= LINE_HEIGHT;
      }

      y -= 4;
      drawWrapped(note.content, MARGIN + 6, CONTENT_W - 12, BODY_FONT_SIZE);
      y -= SECTION_GAP * 0.6;
    }

    // ── Footer on each page ───────────────────────────────────────────────────
    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const p = pdfDoc.getPage(i);
      p.drawLine({ start: { x: MARGIN, y: MARGIN - 4 }, end: { x: PAGE_W - MARGIN, y: MARGIN - 4 }, thickness: 0.3, color: LIGHT_GRAY });
      p.drawText(`${data.clinicName} — Documento gerado em ${dateStr} — Página ${i + 1} de ${pageCount}`, {
        x: MARGIN, y: MARGIN - 18, size: 7, font: fontRegular, color: GRAY,
      });
    }

    return pdfDoc.save();
  }
}
