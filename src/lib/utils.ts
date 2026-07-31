import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AttendanceStatus, GradeType } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: 'Hadir',
  late: 'Terlambat',
  permission: 'Izin',
  sick: 'Sakit',
  absent: 'Alpa',
}

export const ATTENDANCE_CLASS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  late: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  permission: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  sick: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  absent: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
}

export const GRADE_TYPE_LABEL: Record<GradeType, string> = {
  daily: 'Harian',
  midterm: 'UTS',
  final: 'UAS',
}

/** Color-code grades: green >= 85, yellow >= 70, red < 70 */
export function gradeColor(score: number) {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

export function gradeBadge(score: number) {
  if (score >= 85) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  if (score >= 70) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
  return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function formatDate(input: string | Date, withDay = false) {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return '-'
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  return withDay ? `${DAYS[d.getDay()]}, ${base}` : base
}

export function formatDateTime(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return '-'
  return `${formatDate(d)} · ${d.getHours().toString().padStart(2, '0')}.${d.getMinutes().toString().padStart(2, '0')}`
}

export function formatTime(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  return `${d.getHours().toString().padStart(2, '0')}.${d.getMinutes().toString().padStart(2, '0')}`
}

export function relativeTime(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const dy = Math.floor(hr / 24)
  if (dy < 7) return `${dy} hari lalu`
  return formatDate(d)
}

export function deadlineInfo(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (diff < 0) return { label: 'Lewat deadline', tone: 'overdue' as const, days }
  if (days <= 1) return { label: 'Deadline hari ini', tone: 'urgent' as const, days }
  if (days <= 3) return { label: `${days} hari lagi`, tone: 'soon' as const, days }
  return { label: `${days} hari lagi`, tone: 'normal' as const, days }
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function average(nums: number[]) {
  if (!nums.length) return 0
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

/** Basic input sanitisation for user generated text rendered as plain text. */
export function sanitizeText(input: string, max = 5000) {
  return input.replace(/<\/?[^>]+(>|$)/g, '').slice(0, max).trim()
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/zip',
]

export function validateFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) return 'Ukuran file maksimal 10 MB.'
  if (ALLOWED_UPLOAD_TYPES.length && !ALLOWED_UPLOAD_TYPES.includes(file.type) && file.type !== '')
    return 'Tipe file tidak didukung (PDF, DOC, PPT, XLS, gambar, ZIP).'
  return null
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
