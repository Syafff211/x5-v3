'use client'

import * as XLSX from 'xlsx'

export function exportToExcel(rows: Record<string, unknown>[], filename: string, sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))

  // Auto column widths
  const cols = Object.keys(rows[0] ?? {}).map((k) => ({
    wch: Math.min(40, Math.max(k.length + 2, ...rows.map((r) => String(r[k] ?? '').length + 2))),
  }))
  ;(ws as any)['!cols'] = cols

  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function importFromExcel(file: File): Promise<Record<string, any>[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws)
}

export function exportToCsv(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function exportToJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `${filename}-${new Date().toISOString().slice(0, 10)}.json`)
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Print-to-PDF using a styled popup window (no extra dependency). */
export function exportToPdf(title: string, headers: string[], rows: (string | number)[][], subtitle?: string) {
  const win = window.open('', '_blank', 'width=1000,height=700')
  if (!win) return

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;margin:32px;color:#111827}
  header{border-bottom:3px solid #6366f1;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
  h1{margin:0 0 4px;font-size:20px}
  .sub{color:#6b7280;font-size:12px}
  .brand{font-weight:800;color:#6366f1;font-size:14px;text-align:right;line-height:1.4}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#eef2ff;color:#3730a3;text-align:left;padding:9px 10px;border:1px solid #e0e7ff;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.03em}
  td{padding:8px 10px;border:1px solid #e5e7eb}
  tbody tr:nth-child(even){background:#f9fafb}
  footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px;display:flex;justify-content:space-between}
  @media print{body{margin:16px}@page{size:A4;margin:14mm}}
</style></head>
<body>
  <header>
    <div><h1>${escapeHtml(title)}</h1><div class="sub">${escapeHtml(subtitle ?? '')}</div></div>
    <div class="brand">X-5 SMAN 1 PURBALINGGA<br /><span style="font-weight:400;color:#6b7280;font-size:11px">Platform Kelas Digital</span></div>
  </header>
  <table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(String(c ?? ''))}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <footer><span>Dicetak: ${new Date().toLocaleString('id-ID')}</span><span>${rows.length} baris data</span></footer>
  <script>window.onload=()=>{setTimeout(()=>window.print(),350)}<\/script>
</body></html>`

  win.document.write(html)
  win.document.close()
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
