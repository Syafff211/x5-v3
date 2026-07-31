export type Role = 'student' | 'admin' | 'super_admin'
export type AttendanceStatus = 'present' | 'late' | 'permission' | 'sick' | 'absent'
export type GradeType = 'daily' | 'midterm' | 'final'
export type MediaType = 'image' | 'video'

export interface Profile {
  id: string
  user_id: string | null
  email: string
  full_name: string
  nisn: string | null
  phone: string | null
  address: string | null
  parent_name: string | null
  avatar_url: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  status: AttendanceStatus
  note: string | null
  created_at: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'nisn' | 'avatar_url'> | null
}

export interface Assignment {
  id: string
  title: string
  subject: string
  description: string | null
  deadline: string
  file_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  description: string | null
  submitted_at: string
  score: number | null
  feedback: string | null
  profiles?: Pick<Profile, 'id' | 'full_name' | 'nisn' | 'avatar_url'> | null
  assignments?: Pick<Assignment, 'id' | 'title' | 'subject' | 'deadline'> | null
}

export interface Grade {
  id: string
  student_id: string
  subject: string
  type: GradeType
  score: number
  date: string
  created_at: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'nisn'> | null
}

export interface Material {
  id: string
  title: string
  subject: string
  description: string | null
  file_url: string | null
  file_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: string
  title: string
  category: string
  media_url: string
  media_type: MediaType
  uploaded_by: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Schedule {
  id: string
  day: string
  time: string
  subject: string
  room: string
  teacher: string
}

export interface OrganizationMember {
  id: string
  position: string
  student_id: string | null
  order: number
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'nisn'> | null
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  color: string
  description: string | null
}

export interface LandingContent {
  hero_title: string
  hero_subtitle: string
  hero_badge: string
  cta_primary: string
  cta_secondary: string
  stats: { label: string; value: number; suffix: string }[]
  features: { icon: string; title: string; description: string }[]
  footer_text: string
}

export interface ThemeConfig {
  primary: string
  secondary: string
  radius: string
  custom_css: string
}
