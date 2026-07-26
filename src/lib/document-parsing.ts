/** Browser-only document text extraction for PDF, DOCX and plain text files. */

export const ACCEPTED_TYPES = [".pdf", ".docx", ".txt", ".md"];
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export type ParsedDocument = {
  text: string;
  pageCount: number | null;
};

export function fileExtension(name: string) {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index).toLowerCase();
}

export function isSupportedFile(file: File) {
  return ACCEPTED_TYPES.includes(fileExtension(file.name));
}

export async function parseDocument(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ParsedDocument> {
  const extension = fileExtension(file.name);

  if (extension === ".txt" || extension === ".md") {
    onProgress?.(100);
    return { text: await file.text(), pageCount: null };
  }

  if (extension === ".docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    onProgress?.(100);
    return { text: result.value, pageCount: null };
  }

  if (extension === ".pdf") {
    const pdfjs = await import("pdfjs-dist");
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const chunks: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      chunks.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " "),
      );
      onProgress?.(Math.round((pageNumber / pdf.numPages) * 100));
    }
    return { text: chunks.join("\n\n"), pageCount: pdf.numPages };
  }

  throw new Error("Unsupported file type");
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
