export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          key: string
          organization_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          key: string
          organization_id: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          key?: string
          organization_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          attendance_taken_at: string | null
          attendance_taken_by: string | null
          class_id: string
          created_at: string
          deleted_at: string | null
          ends_at: string | null
          id: string
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          teacher_id: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          attendance_taken_at?: string | null
          attendance_taken_by?: string | null
          class_id: string
          created_at?: string
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          teacher_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          attendance_taken_at?: string | null
          attendance_taken_by?: string | null
          class_id?: string
          created_at?: string
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          teacher_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_attendance_taken_by_fkey"
            columns: ["attendance_taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          class_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_primary: boolean
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          code: string
          course_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          max_students: number
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          code: string
          course_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          code?: string
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          course_type: Database["public"]["Enums"]["course_type"]
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          code: string
          course_type: Database["public"]["Enums"]["course_type"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          course_type?: Database["public"]["Enums"]["course_type"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_requests: {
        Row: {
          admin_notes: string | null
          approved_fixed_amount: number | null
          approved_percentage: number | null
          created_at: string
          deleted_at: string | null
          discount_id: string
          document_urls: Json | null
          id: string
          notes: string | null
          reason: string | null
          requested_by_id: string
          requested_fixed_amount: number | null
          requested_percentage: number | null
          reviewed_at: string | null
          reviewed_by_id: string | null
          status: Database["public"]["Enums"]["discount_status"]
          student_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_fixed_amount?: number | null
          approved_percentage?: number | null
          created_at?: string
          deleted_at?: string | null
          discount_id: string
          document_urls?: Json | null
          id?: string
          notes?: string | null
          reason?: string | null
          requested_by_id: string
          requested_fixed_amount?: number | null
          requested_percentage?: number | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          status?: Database["public"]["Enums"]["discount_status"]
          student_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_fixed_amount?: number | null
          approved_percentage?: number | null
          created_at?: string
          deleted_at?: string | null
          discount_id?: string
          document_urls?: Json | null
          id?: string
          notes?: string | null
          reason?: string | null
          requested_by_id?: string
          requested_fixed_amount?: number | null
          requested_percentage?: number | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          status?: Database["public"]["Enums"]["discount_status"]
          student_id?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_requests_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_requests_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_requests_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          percentage: number | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          percentage?: number | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          percentage?: number | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string
          deleted_at: string | null
          ended_at: string | null
          enrolled_at: string | null
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          enrolled_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          enrolled_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_scores: {
        Row: {
          corrected_at: string
          corrector_id: string
          created_at: string
          essay_id: string
          feedback: string | null
          id: string
          rubric: Json | null
          score: number
          updated_at: string
        }
        Insert: {
          corrected_at?: string
          corrector_id: string
          created_at?: string
          essay_id: string
          feedback?: string | null
          id?: string
          rubric?: Json | null
          score: number
          updated_at?: string
        }
        Update: {
          corrected_at?: string
          corrector_id?: string
          created_at?: string
          essay_id?: string
          feedback?: string | null
          id?: string
          rubric?: Json | null
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_scores_corrector_id_fkey"
            columns: ["corrector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_scores_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_themes: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean
          max_score: number
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean
          max_score?: number
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean
          max_score?: number
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_themes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_themes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_themes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      essays: {
        Row: {
          content_url: string | null
          created_at: string
          deleted_at: string | null
          id: string
          status: Database["public"]["Enums"]["essay_status"]
          student_id: string
          submitted_at: string | null
          theme_id: string
          updated_at: string
        }
        Insert: {
          content_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["essay_status"]
          student_id: string
          submitted_at?: string | null
          theme_id: string
          updated_at?: string
        }
        Update: {
          content_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["essay_status"]
          student_id?: string
          submitted_at?: string | null
          theme_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "essays_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essays_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "essay_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          balance: number
          created_at: string
          deleted_at: string | null
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["account_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["account_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["account_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_charges: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["charge_status"]
          type: Database["public"]["Enums"]["charge_type"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
          type: Database["public"]["Enums"]["charge_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
          type?: Database["public"]["Enums"]["charge_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_charges_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          deleted_at: string | null
          document: string | null
          id: string
          organization_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          id?: string
          organization_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          id?: string
          organization_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_links: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          id: string
          material_id: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          material_id: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_links_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_links_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          mime_type: string | null
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          mime_type?: string | null
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          mime_type?: string | null
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_recipients: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          notice_id: string
          profile_id: string | null
          read_at: string | null
          student_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          notice_id: string
          profile_id?: string | null
          read_at?: string | null
          student_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          notice_id?: string
          profile_id?: string | null
          read_at?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notice_recipients_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_recipients_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_recipients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_recipients_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          organization_id: string
          published_at: string | null
          target_type: Database["public"]["Enums"]["notice_target_type"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id: string
          published_at?: string | null
          target_type: Database["public"]["Enums"]["notice_target_type"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string
          published_at?: string | null
          target_type?: Database["public"]["Enums"]["notice_target_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string
          profile_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          profile_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          profile_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          profile_id: string
          read_at: string | null
          sent_at: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          profile_id: string
          read_at?: string | null
          sent_at?: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          profile_id?: string
          read_at?: string | null
          sent_at?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_change_events: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_change_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_change_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          charge_id: string
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string
          recorded_by: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          charge_id: string
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          charge_id?: string
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "financial_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedagogical_observations: {
        Row: {
          class_id: string
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          organization_id: string
          student_id: string
          teacher_id: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["pedagogical_observation_visibility"]
        }
        Insert: {
          class_id: string
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          organization_id: string
          student_id: string
          teacher_id: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["pedagogical_observation_visibility"]
        }
        Update: {
          class_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          organization_id?: string
          student_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["pedagogical_observation_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "pedagogical_observations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_observations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_observations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_observations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          resource: string
          updated_at: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          resource: string
          updated_at?: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          resource?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string
          phone: string | null
          primary_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean
          organization_id: string
          phone?: string | null
          primary_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          phone?: string | null
          primary_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          file_url: string
          id: string
          issued_at: string
          payment_id: string
          receipt_number: string | null
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          issued_at?: string
          payment_id: string
          receipt_number?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          issued_at?: string
          payment_id?: string
          receipt_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reenrollment_requests: {
        Row: {
          admin_decision: string | null
          course_id: string | null
          created_at: string
          current_class_id: string | null
          deleted_at: string | null
          financial_status_snapshot: string | null
          id: string
          notes: string | null
          organization_id: string
          rematricula_fee_discount_percent: number | null
          requested_by_id: string | null
          reviewed_at: string | null
          reviewed_by_id: string | null
          status: Database["public"]["Enums"]["reenrollment_status"]
          student_id: string
          target_class_id: string | null
          target_class_ids: string[]
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          admin_decision?: string | null
          course_id?: string | null
          created_at?: string
          current_class_id?: string | null
          deleted_at?: string | null
          financial_status_snapshot?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          rematricula_fee_discount_percent?: number | null
          requested_by_id?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          status?: Database["public"]["Enums"]["reenrollment_status"]
          student_id: string
          target_class_id?: string | null
          target_class_ids?: string[]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_decision?: string | null
          course_id?: string | null
          created_at?: string
          current_class_id?: string | null
          deleted_at?: string | null
          financial_status_snapshot?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          rematricula_fee_discount_percent?: number | null
          requested_by_id?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          status?: Database["public"]["Enums"]["reenrollment_status"]
          student_id?: string
          target_class_id?: string | null
          target_class_ids?: string[]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reenrollment_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reenrollment_requests_current_class_id_fkey"
            columns: ["current_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reenrollment_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reenrollment_requests_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reenrollment_requests_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reenrollment_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reenrollment_requests_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: Database["public"]["Enums"]["user_role"]
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          code: Database["public"]["Enums"]["user_role"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          code?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_discount_benefits: {
        Row: {
          created_at: string
          discount_request_id: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          fixed_amount: number | null
          id: string
          is_active: boolean
          organization_id: string
          percentage: number | null
          student_id: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          discount_request_id: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          organization_id: string
          percentage?: number | null
          student_id: string
          updated_at?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          created_at?: string
          discount_request_id?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          organization_id?: string
          percentage?: number | null
          student_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_discount_benefits_discount_request_id_fkey"
            columns: ["discount_request_id"]
            isOneToOne: true
            referencedRelation: "discount_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discount_benefits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discount_benefits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          deleted_at: string | null
          guardian_id: string
          id: string
          is_financial_responsible: boolean
          is_primary: boolean
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          guardian_id: string
          id?: string
          is_financial_responsible?: boolean
          is_primary?: boolean
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          guardian_id?: string
          id?: string
          is_financial_responsible?: boolean
          is_primary?: boolean
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_performance_snapshots: {
        Row: {
          created_at: string
          id: string
          metrics: Json
          period_label: string
          snapshot_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrics: Json
          period_label: string
          snapshot_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
          period_label?: string
          snapshot_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_performance_snapshots_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string | null
          created_at: string
          deleted_at: string | null
          enrollment_code: string | null
          id: string
          organization_id: string
          profile_id: string
          school_origin: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          enrollment_code?: string | null
          id?: string
          organization_id: string
          profile_id: string
          school_origin?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          enrollment_code?: string | null
          id?: string
          organization_id?: string
          profile_id?: string
          school_origin?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          deleted_at: string | null
          hire_date: string | null
          id: string
          organization_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          hire_date?: string | null
          id?: string
          organization_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          hire_date?: string | null
          id?: string
          organization_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_health_check: {
        Args: never
        Returns: {
          ok: boolean
          organization_name: string
        }[]
      }
      count_active_enrollments: {
        Args: { p_class_id: string }
        Returns: number
      }
      current_guardian_id: { Args: never; Returns: string }
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_student_id: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_guardian_of_student: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      is_teacher_of_class: { Args: { p_class_id: string }; Returns: boolean }
      is_teacher_of_student: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      student_in_my_class: { Args: { p_student_id: string }; Returns: boolean }
    }
    Enums: {
      account_status: "ATIVA" | "SUSPENSA" | "ENCERRADA"
      attendance_status:
        | "PRESENTE"
        | "FALTA"
        | "FALTA_JUSTIFICADA"
        | "REPOSICAO"
        | "ATRASO"
      charge_status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO" | "ISENTO"
      charge_type:
        | "MATRICULA"
        | "MENSALIDADE"
        | "MODULO"
        | "MATERIAL"
        | "TAXA_EXTRA"
        | "REMATRICULA"
      course_type: "REDACAO" | "EXATAS" | "MATEMATICA"
      discount_status:
        | "SOLICITADO"
        | "EM_ANALISE"
        | "APROVADO"
        | "NEGADO"
        | "EXPIRADO"
      discount_type: "BOLSA" | "IRMAO"
      enrollment_status:
        | "ATIVA"
        | "PENDENTE"
        | "CANCELADA"
        | "CONCLUIDA"
        | "TRANCADA"
      essay_status: "PENDENTE" | "ENTREGUE" | "CORRIGIDA"
      guardian_relationship: "PAI" | "MAE" | "AVO" | "TUTOR" | "OUTRO"
      notice_target_type:
        | "TODOS"
        | "TURMA"
        | "ALUNO"
        | "RESPONSAVEL"
        | "PROFESSOR"
      notification_type:
        | "AVISO"
        | "PRESENCA"
        | "FALTA"
        | "PROXIMA_AULA"
        | "ALTERACAO_AULA"
        | "FINANCEIRO"
        | "REDACAO"
        | "REMATRICULA"
        | "DESCONTO"
      payment_method: "PIX" | "BOLETO" | "CARTAO" | "DINHEIRO" | "TRANSFERENCIA"
      pedagogical_observation_visibility:
        | "ADMIN"
        | "PROFESSOR"
        | "ADMIN_PROFESSOR"
      reenrollment_status:
        | "SOLICITADA"
        | "EM_ANALISE"
        | "APROVADA"
        | "NEGADA"
        | "CANCELADA"
      session_status: "AGENDADA" | "REALIZADA" | "CANCELADA" | "REAGENDADA"
      student_status:
        | "ATIVO"
        | "INATIVO"
        | "TRANCADO"
        | "INADIMPLENTE"
        | "BOLSISTA"
        | "CONCLUIDO"
      user_role: "ADMIN" | "PROFESSOR" | "ALUNO" | "RESPONSAVEL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["ATIVA", "SUSPENSA", "ENCERRADA"],
      attendance_status: [
        "PRESENTE",
        "FALTA",
        "FALTA_JUSTIFICADA",
        "REPOSICAO",
        "ATRASO",
      ],
      charge_status: ["PENDENTE", "PAGO", "ATRASADO", "CANCELADO", "ISENTO"],
      charge_type: [
        "MATRICULA",
        "MENSALIDADE",
        "MODULO",
        "MATERIAL",
        "TAXA_EXTRA",
        "REMATRICULA",
      ],
      course_type: ["REDACAO", "EXATAS", "MATEMATICA"],
      discount_status: [
        "SOLICITADO",
        "EM_ANALISE",
        "APROVADO",
        "NEGADO",
        "EXPIRADO",
      ],
      discount_type: ["BOLSA", "IRMAO"],
      enrollment_status: [
        "ATIVA",
        "PENDENTE",
        "CANCELADA",
        "CONCLUIDA",
        "TRANCADA",
      ],
      essay_status: ["PENDENTE", "ENTREGUE", "CORRIGIDA"],
      guardian_relationship: ["PAI", "MAE", "AVO", "TUTOR", "OUTRO"],
      notice_target_type: [
        "TODOS",
        "TURMA",
        "ALUNO",
        "RESPONSAVEL",
        "PROFESSOR",
      ],
      notification_type: [
        "AVISO",
        "PRESENCA",
        "FALTA",
        "PROXIMA_AULA",
        "ALTERACAO_AULA",
        "FINANCEIRO",
        "REDACAO",
        "REMATRICULA",
        "DESCONTO",
      ],
      payment_method: ["PIX", "BOLETO", "CARTAO", "DINHEIRO", "TRANSFERENCIA"],
      pedagogical_observation_visibility: [
        "ADMIN",
        "PROFESSOR",
        "ADMIN_PROFESSOR",
      ],
      reenrollment_status: [
        "SOLICITADA",
        "EM_ANALISE",
        "APROVADA",
        "NEGADA",
        "CANCELADA",
      ],
      session_status: ["AGENDADA", "REALIZADA", "CANCELADA", "REAGENDADA"],
      student_status: [
        "ATIVO",
        "INATIVO",
        "TRANCADO",
        "INADIMPLENTE",
        "BOLSISTA",
        "CONCLUIDO",
      ],
      user_role: ["ADMIN", "PROFESSOR", "ALUNO", "RESPONSAVEL"],
    },
  },
} as const
