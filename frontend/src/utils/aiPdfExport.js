/**
 * @file aiPdfExport.js
 * @description Exports AI-generated quizzes, summaries, study guides, and slide decks
 * into formatted downloadable `.pdf` files using jsPDF.
 */

import { jsPDF } from 'jspdf';

import { getAiContentMeta } from './aiContentMeta.js';
import { triggerFileDownload } from './fileTypes.js';

const BRAND_BLUE = [37, 99, 235];
const DARK_INK = [15, 23, 42];
const MUTED_INK = [71, 85, 105];
const LIGHT_SURFACE = [241, 245, 249];
const BORDER_GRAY = [203, 213, 225];
const CALLOUT_BG = [239, 246, 255];

/** Replaces characters outside WinAnsi so built-in PDF fonts render cleanly. */
function sanitizePdfText(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2248/g, '~')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u2260/g, '!=')
    .replace(/\u2022/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPdfFilename(material) {
  const meta = getAiContentMeta(material?.contentType);
  const rawTitle = sanitizePdfText(material?.title || meta.label || 'material-ia');
  const slug = rawTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

  return `${slug || 'material-ia'}.pdf`;
}

function formatDateLabel(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function createDocumentWriter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const bottomLimit = pageHeight - 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (needed = 12) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 18;
      return true;
    }
    return false;
  };

  const writeParagraph = (
    text,
    {
      fontSize = 10.5,
      fontStyle = 'normal',
      color = DARK_INK,
      indent = 0,
      lineHeight = 5.2,
      afterGap = 2.5,
      maxWidth = contentWidth - indent,
    } = {},
  ) => {
    const clean = sanitizePdfText(text);
    if (!clean) return;
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean, maxWidth);
    for (const line of lines) {
      ensureSpace(lineHeight + 1);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }
    y += afterGap;
  };

  const writeHeading = (text, { fontSize = 13, afterGap = 2.5 } = {}) => {
    ensureSpace(14);
    y += 1.5;
    writeParagraph(text, {
      fontSize,
      fontStyle: 'bold',
      color: BRAND_BLUE,
      lineHeight: 6,
      afterGap,
    });
  };

  const writeBullets = (items = [], { indent = 3, fontSize = 10 } = {}) => {
    for (const item of items) {
      const clean = sanitizePdfText(item);
      if (!clean) continue;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(...DARK_INK);
      const lines = doc.splitTextToSize(clean, contentWidth - indent - 4);
      ensureSpace(lines.length * 4.8 + 2);
      doc.setFillColor(...BRAND_BLUE);
      doc.circle(margin + indent + 1, y - 1.3, 0.75, 'F');
      for (let i = 0; i < lines.length; i += 1) {
        if (i > 0 && ensureSpace(5)) {
          // continued on next page cleanly
        }
        doc.text(lines[i], margin + indent + 4, y);
        y += 4.8;
      }
      y += 1.2;
    }
    y += 1.5;
  };

  const writeCallout = (title, body, { bgColor = CALLOUT_BG, accentColor = BRAND_BLUE } = {}) => {
    const cleanBody = sanitizePdfText(body);
    if (!cleanBody) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(cleanBody, contentWidth - 10);
    const boxHeight = (title ? 7 : 2) + lines.length * 4.8 + 5;
    ensureSpace(boxHeight + 3);

    doc.setFillColor(...bgColor);
    doc.roundedRect(margin, y - 3, contentWidth, boxHeight, 2, 2, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(margin, y - 3, 1.8, boxHeight, 'F');

    let innerY = y + 2.5;
    if (title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...accentColor);
      doc.text(sanitizePdfText(title), margin + 5, innerY);
      innerY += 5.2;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK_INK);
    for (const line of lines) {
      doc.text(line, margin + 5, innerY);
      innerY += 4.8;
    }

    y += boxHeight + 1.5;
  };

  const writeDocumentHeader = (material, typeLabel) => {
    doc.setFillColor(...BRAND_BLUE);
    doc.rect(0, 0, pageWidth, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(sanitizePdfText(`ALEJANDRIA  |  ${typeLabel.toUpperCase()} GENERADO CON IA`), margin, 13);

    y = 21;
    writeParagraph(material.title || typeLabel, {
      fontSize: 16,
      fontStyle: 'bold',
      color: DARK_INK,
      lineHeight: 7,
      afterGap: 1.5,
    });

    const metaParts = [
      material.subjectName,
      material.repositoryName ? `Repositorio: ${material.repositoryName}` : null,
      material.scopeLabel,
      formatDateLabel(material.createdAt),
    ].filter(Boolean);

    if (metaParts.length > 0) {
      writeParagraph(metaParts.join('  |  '), {
        fontSize: 9.5,
        color: MUTED_INK,
        lineHeight: 4.5,
        afterGap: 3,
      });
    }

    doc.setDrawColor(...BORDER_GRAY);
    doc.line(margin, y - 1, pageWidth - margin, y - 1);
    y += 4;
  };

  return {
    margin,
    contentWidth,
    getY: () => y,
    setY: (nextY) => {
      y = nextY;
    },
    ensureSpace,
    writeParagraph,
    writeHeading,
    writeBullets,
    writeCallout,
    writeDocumentHeader,
  };
}

function renderQuizPdf(doc, material) {
  const writer = createDocumentWriter(doc);
  writer.writeDocumentHeader(material, 'Cuestionario');

  const questions = material.questions || [];
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  questions.forEach((question, qIndex) => {
    writer.ensureSpace(24);
    writer.writeParagraph(`${qIndex + 1}. ${question.question}`, {
      fontSize: 11,
      fontStyle: 'bold',
      color: DARK_INK,
      lineHeight: 5.3,
      afterGap: 1.5,
    });

    (question.options || []).forEach((opt, optIndex) => {
      const prefix = optionLetters[optIndex] || String(optIndex + 1);
      writer.writeParagraph(`${prefix}) ${opt}`, {
        fontSize: 10,
        color: DARK_INK,
        indent: 5,
        lineHeight: 4.8,
        afterGap: 0.8,
      });
    });

    writer.setY(writer.getY() + 3);
  });

  if (questions.length > 0) {
    doc.addPage();
    writer.setY(18);
    writer.writeHeading('Clave de respuestas y justificaciones', { fontSize: 13.5, afterGap: 3 });

    questions.forEach((question, qIndex) => {
      const correctOption = question.options?.[question.correctIndex];
      const letter = optionLetters[question.correctIndex] || '';
      const answerLabel = correctOption
        ? `Respuesta ${qIndex + 1}: ${letter ? `${letter}) ` : ''}${correctOption}`
        : `Respuesta ${qIndex + 1}`;
      writer.writeCallout(answerLabel, question.explanation || '');
    });
  }
}

function renderSummaryPdf(doc, material) {
  const writer = createDocumentWriter(doc);
  writer.writeDocumentHeader(material, 'Resumen');

  if (material.overview) {
    const title = material.estimatedReadMinutes
      ? `Síntesis general (${material.estimatedReadMinutes} min de lectura)`
      : 'Síntesis general';
    writer.writeCallout(title, material.overview);
  }

  for (const section of material.sections || []) {
    writer.writeHeading(section.heading || 'Sección');
    if (section.body) {
      writer.writeParagraph(section.body, {
        fontSize: 10.5,
        color: DARK_INK,
        afterGap: 2,
      });
    }
    if (section.keyPoints?.length > 0) {
      writer.writeParagraph('Puntos clave:', {
        fontSize: 9.8,
        fontStyle: 'bold',
        color: MUTED_INK,
        afterGap: 1,
      });
      writer.writeBullets(section.keyPoints);
    }
  }

  if (material.keyConcepts?.length > 0) {
    writer.writeHeading('Glosario de conceptos clave');
    for (const concept of material.keyConcepts) {
      writer.writeCallout(concept.term, concept.definition, {
        bgColor: LIGHT_SURFACE,
        accentColor: BRAND_BLUE,
      });
    }
  }
}

function renderGuidePdf(doc, material) {
  const writer = createDocumentWriter(doc);
  writer.writeDocumentHeader(material, 'Guía de estudio');

  if (material.introduction) {
    writer.writeCallout('Propósito de la guía', material.introduction);
  }

  if (material.objectives?.length > 0) {
    writer.writeHeading('Objetivos de aprendizaje');
    writer.writeBullets(material.objectives);
  }

  for (const mod of material.modules || []) {
    writer.writeHeading(mod.title || 'Módulo');
    if (mod.summary) {
      writer.writeParagraph(mod.summary, {
        fontSize: 10.5,
        color: DARK_INK,
        afterGap: 2,
      });
    }
    if (mod.keyTakeaways?.length > 0) {
      writer.writeBullets(mod.keyTakeaways);
    }
    if (mod.practicePrompt) {
      writer.writeCallout('Actividad sugerida', mod.practicePrompt);
    }
  }

  if (material.checklist?.length > 0) {
    writer.writeHeading('Checklist de preparación');
    for (const item of material.checklist) {
      writer.writeParagraph(`[ ]  ${item}`, {
        fontSize: 10,
        indent: 3,
        afterGap: 1.5,
      });
    }
  }
}

function renderSlidesPdf(material) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const slides =
    material.slides?.length > 0
      ? material.slides
      : [{ slideNumber: 1, title: material.title || 'Diapositivas IA', bulletPoints: [] }];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  slides.forEach((slide, index) => {
    if (index > 0) doc.addPage();

    doc.setFillColor(...BRAND_BLUE);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Outer slide frame
    doc.setDrawColor(...BORDER_GRAY);
    doc.roundedRect(margin - 4, 12, contentWidth + 8, pageHeight - 24, 3, 3);

    // Top slide badge & subject label
    const slideNumber = slide.slideNumber ?? index + 1;
    doc.setFillColor(...BRAND_BLUE);
    doc.roundedRect(margin, 18, 34, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Lámina ${slideNumber} de ${slides.length}`, margin + 3.5, 22.8);

    if (material.subjectName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...MUTED_INK);
      doc.text(sanitizePdfText(material.subjectName), pageWidth - margin, 22.8, { align: 'right' });
    }

    let y = 37;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...DARK_INK);
    const titleLines = doc.splitTextToSize(sanitizePdfText(slide.title || material.title), contentWidth);
    for (const line of titleLines) {
      doc.text(line, margin, y);
      y += 8.5;
    }

    if (slide.subtitle) {
      y += 1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...BRAND_BLUE);
      const subtitleLines = doc.splitTextToSize(sanitizePdfText(slide.subtitle), contentWidth);
      for (const line of subtitleLines) {
        doc.text(line, margin, y);
        y += 6;
      }
    }

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...DARK_INK);

    for (const point of slide.bulletPoints || []) {
      const pointLines = doc.splitTextToSize(sanitizePdfText(point), contentWidth - 10);
      doc.setFillColor(...BRAND_BLUE);
      doc.circle(margin + 2.5, y - 1.5, 1.1, 'F');
      for (const line of pointLines) {
        doc.text(line, margin + 8, y);
        y += 6.2;
      }
      y += 2.5;
    }

    if (slide.takeaway) {
      const takeawayLines = doc.splitTextToSize(sanitizePdfText(slide.takeaway), contentWidth - 12);
      const boxHeight = 9 + takeawayLines.length * 5.5 + 3;
      const boxY = Math.max(y + 4, pageHeight - 52 - boxHeight);

      doc.setFillColor(...CALLOUT_BG);
      doc.roundedRect(margin, boxY, contentWidth, boxHeight, 2, 2, 'F');
      doc.setFillColor(...BRAND_BLUE);
      doc.rect(margin, boxY, 2, boxHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...BRAND_BLUE);
      doc.text('IDEA CLAVE', margin + 6, boxY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...DARK_INK);
      let tkY = boxY + 11.5;
      for (const line of takeawayLines) {
        doc.text(line, margin + 6, tkY);
        tkY += 5.5;
      }
    }

    if (slide.speakerNotes) {
      const notesY = pageHeight - 31;
      doc.setFillColor(...LIGHT_SURFACE);
      doc.roundedRect(margin, notesY, contentWidth, 16, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED_INK);
      doc.text('Notas de exposición:', margin + 4, notesY + 5.5);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(sanitizePdfText(slide.speakerNotes), contentWidth - 8).slice(0, 2);
      let ny = notesY + 10;
      for (const line of noteLines) {
        doc.text(line, margin + 4, ny);
        ny += 4.2;
      }
    }
  });

  return doc;
}

function addPageFooters(doc) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED_INK);
    doc.text('Generado con IA en Alejandría · Verifica conceptos críticos con tus apuntes.', margin, pageHeight - 7);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }
}

/**
 * Generates and triggers download of a formatted PDF for an AI quiz or study material.
 * @param {object} material
 * @returns {string} Generated file name.
 */
export function exportAiMaterialToPdf(material) {
  if (!material) {
    throw new Error('No hay contenido para exportar a PDF.');
  }

  const contentType = material.contentType || 'quiz';
  let doc;

  if (contentType === 'slides') {
    doc = renderSlidesPdf(material);
  } else {
    doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    if (contentType === 'summary') renderSummaryPdf(doc, material);
    else if (contentType === 'guide') renderGuidePdf(doc, material);
    else renderQuizPdf(doc, material);
  }

  addPageFooters(doc);

  const filename = buildPdfFilename(material);
  const blobUrl = URL.createObjectURL(doc.output('blob'));
  triggerFileDownload(blobUrl, filename);
  return filename;
}
