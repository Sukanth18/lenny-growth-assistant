import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for PDF parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;

/**
 * Extract clean plain text from uploaded files: PDF, DOCX, DOC, TXT, MD, Code, CSV, etc.
 */
export async function parseFileContent(file) {
  const name = file.name.toLowerCase();

  // 1. PDF files (.pdf)
  if (name.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        text += strings.join(' ') + '\n';
      }
      return text.trim() || '[Empty PDF file]';
    } catch (err) {
      console.error('PDF parsing error:', err);
      throw new Error(`Failed to extract text from PDF "${file.name}". File might be password-protected or scanned.`);
    }
  }

  // 2. Word documents (.docx)
  if (name.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim() || '[Empty Word document]';
    } catch (err) {
      console.error('DOCX parsing error:', err);
      throw new Error(`Failed to extract text from Word document "${file.name}".`);
    }
  }

  // 3. Legacy Word documents (.doc)
  if (name.endsWith('.doc')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer }).catch(() => null);
      if (result && result.value.trim()) return result.value.trim();

      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(arrayBuffer);
      const cleanText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      return cleanText || '[Legacy .doc file attached. For best text extraction, convert to .docx or .pdf]';
    } catch {
      return '[Legacy .doc file attached. Convert to .docx or .pdf for optimal reading.]';
    }
  }

  // 4. Standard text, markdown, code, and data files (.txt, .md, .py, .js, .csv, .json, etc.)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result || '');
    reader.onerror = () => reject(new Error(`Could not read text file "${file.name}".`));
    reader.readAsText(file);
  });
}
