import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { documentService } from '../services/api'

// Set worker source for Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
} catch (e) {
  console.warn('Could not set pdfjs worker:', e)
}

// In-memory thumbnail cache: docId -> blobUrl / dataUrl
const thumbnailCache = new Map()

/**
 * Generate or retrieve a cover / frontpage thumbnail for an uploaded document
 * @param {Object} doc - Document object with id, mimeType
 * @returns {Promise<string|null>} - Data URL or object URL of front page
 */
export async function getDocumentCoverThumbnail(doc) {
  if (!doc || !doc.id) return null

  if (thumbnailCache.has(doc.id)) {
    return thumbnailCache.get(doc.id)
  }

  const mimeType = (doc.mimeType || '').toLowerCase()

  // 1. If Image File: Fetch preview blob and return object URL
  if (mimeType.startsWith('image/')) {
    try {
      const { blob } = await documentService.getPreviewBlob(doc.id)
      const objectUrl = URL.createObjectURL(blob)
      thumbnailCache.set(doc.id, objectUrl)
      return objectUrl
    } catch (err) {
      console.error('Failed to load image thumbnail for', doc.id, err)
      return null
    }
  }

  // 2. If PDF File: Fetch blob, render page 1 to canvas, return data URL
  if (mimeType === 'application/pdf') {
    try {
      const { blob } = await documentService.getPreviewBlob(doc.id)
      const arrayBuffer = await blob.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      if (pdf.numPages >= 1) {
        const page = await pdf.getPage(1)
        // Target width ~180px for high-DPI thumbnail in a 68px box
        const unscaledViewport = page.getViewport({ scale: 1.0 })
        const scale = 200 / unscaledViewport.width
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        thumbnailCache.set(doc.id, dataUrl)
        return dataUrl
      }
    } catch (err) {
      console.error('Failed to render PDF cover thumbnail for', doc.id, err)
      return null
    }
  }

  return null
}
