import mammoth from 'mammoth';
import type { RequirementDocument } from '../types';

/**
 * Parse DOCX file and extract text content
 */
export async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`Error parsing DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse PDF file and extract text content
 * NOTE: pdf-parse requires Node.js and cannot run in browser.
 * For now, we'll disable PDF support or use a browser-compatible library like pdfjs-dist
 */
export async function parsePdf(file: File): Promise<string> {
  // TODO: Implement browser-compatible PDF parsing using pdfjs-dist
  throw new Error(
    'PDF parsing is temporarily disabled. Please use DOCX, MD, or TXT files. ' +
    'PDF support will be added with a browser-compatible library soon.'
  );
}

/**
 * Parse Markdown or plain text file
 */
export async function parseMarkdown(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    throw new Error(`Error parsing Markdown/Text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse document based on file type
 */
export async function parseDocument(file: File): Promise<RequirementDocument> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  let content: string;

  // Validate file type (PDF temporarily disabled)
  if (!fileExtension || !['docx', 'md', 'txt'].includes(fileExtension)) {
    throw new Error('Unsupported file type. Supported types: .docx, .md, .txt (PDF support coming soon)');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum limit of 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Parse based on file type
  switch (fileExtension) {
    case 'docx':
      content = await parseDocx(file);
      break;
    case 'md':
    case 'txt':
      content = await parseMarkdown(file);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }

  // Create RequirementDocument object
  const document: RequirementDocument = {
    id: generateDocumentId(),
    fileName: file.name,
    fileType: fileExtension as 'docx' | 'pdf' | 'md' | 'txt',
    uploadedAt: new Date().toISOString(),
    content: content.trim(),
    size: file.size,
  };

  return document;
}

/**
 * Generate unique document ID
 */
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Preprocess text content before sending to AI
 * - Remove extra whitespace
 * - Normalize line breaks
 * - Remove special characters if needed
 */
export function preprocessText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .trim();
}

