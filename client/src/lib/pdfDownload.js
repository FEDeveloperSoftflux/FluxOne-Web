import { jsPDF } from 'jspdf'

function safeFilename(value, fallback = 'download') {
  const base = String(value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)
  return base || fallback
}

async function blobUrlToDataUrl(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read barcode image'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Download product barcode as a one-page PDF (no printer required).
 */
export async function downloadBarcodePdf({ product, pngUrl }) {
  if (!pngUrl) throw new Error('Barcode image is missing')

  const dataUrl = await blobUrlToDataUrl(pngUrl)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 60],
  })

  const name = product?.name || 'Product'
  const code = product?.itemCode || ''
  const barcode = product?.barcode || ''

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(name.slice(0, 48), 50, 10, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text([code, barcode].filter(Boolean).join('  ·  '), 50, 16, { align: 'center' })

  const imgW = 70
  const imgH = 28
  doc.addImage(dataUrl, 'PNG', (100 - imgW) / 2, 22, imgW, imgH)

  const filename = `${safeFilename(barcode || code || name, 'barcode')}.pdf`
  doc.save(filename)
  return { filename }
}

/**
 * Download purchase order as PDF from structured order detail.
 */
export function downloadPurchaseOrderPdf(order) {
  if (!order) throw new Error('Order is missing')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(`Purchase Order ${order.orderNumber || ''}`, margin, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const meta = [
    `Company: ${order.companyName || '—'}`,
    `Representative: ${order.representativeName || '—'} (${order.representativePhone || '—'})`,
    `Status: ${order.status || '—'}`,
  ]
  if (order.explanation) meta.push(`Explanation: ${order.explanation}`)

  for (const line of meta) {
    const wrapped = doc.splitTextToSize(line, 180)
    doc.text(wrapped, margin, y)
    y += wrapped.length * 5 + 2
  }

  y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  const cols = [
    { label: 'Item', x: margin, w: 80 },
    { label: 'Scale', x: margin + 82, w: 22 },
    { label: 'Qty', x: margin + 106, w: 22 },
    { label: 'Unit cost', x: margin + 130, w: 30 },
  ]
  cols.forEach((col) => doc.text(col.label, col.x, y))
  y += 2
  doc.setDrawColor(180)
  doc.line(margin, y, 196, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  const lines = Array.isArray(order.lines) ? order.lines : []
  for (const line of lines) {
    if (y > 275) {
      doc.addPage()
      y = 18
    }
    const title = `${line.name || 'Item'}${line.itemCode ? ` (${line.itemCode})` : ''}`
    const titleLines = doc.splitTextToSize(title, 78)
    doc.text(titleLines, cols[0].x, y)
    doc.text(String(line.scale || '—'), cols[1].x, y)
    doc.text(String(line.quantity ?? '—'), cols[2].x, y)
    doc.text(String(line.unitCost ?? '—'), cols[3].x, y)
    y += Math.max(titleLines.length * 5, 7)
  }

  const filename = `${safeFilename(order.orderNumber || 'purchase-order')}.pdf`
  doc.save(filename)
  return { filename }
}
