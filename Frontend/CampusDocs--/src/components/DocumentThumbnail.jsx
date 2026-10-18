import { useState, useEffect } from 'react'
import { getDocumentCoverThumbnail } from '../utils/thumbnailHelper'
import './DocumentThumbnail.css'

export default function DocumentThumbnail({ doc, className = '', onClick }) {
  const [thumbUrl, setThumbUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setHasError(false)

    getDocumentCoverThumbnail(doc)
      .then((url) => {
        if (active) {
          if (url) {
            setThumbUrl(url)
          } else {
            setHasError(true)
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.warn('Thumbnail generation failed for doc:', doc?.id, err)
          setHasError(true)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [doc?.id, doc?.mimeType])

  const isPdf = (doc?.mimeType || '').includes('pdf')
  const isImage = (doc?.mimeType || '').startsWith('image/')

  return (
    <div
      className={`cd-doc-thumb-box ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title="Click to preview document"
    >
      {loading ? (
        <div className="cd-thumb-loading">
          <div className="cd-thumb-shimmer" />
        </div>
      ) : thumbUrl && !hasError ? (
        <img
          src={thumbUrl}
          alt={doc?.title || 'Document cover'}
          className="cd-doc-thumb-img"
        />
      ) : (
        <div className={`cd-doc-cover-fallback ${isPdf ? 'fallback-pdf' : isImage ? 'fallback-img' : 'fallback-generic'}`}>
          <div className="cd-cover-badge">{isPdf ? 'PDF' : isImage ? 'IMG' : 'DOC'}</div>
          <div className="cd-cover-sketch">
            <span className="cd-sketch-line full" />
            <span className="cd-sketch-line mid" />
            <span className="cd-sketch-line short" />
          </div>
          <div className="cd-cover-stamp">DOC</div>
        </div>
      )}
    </div>
  )
}
