export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          image_url: string;
          thumbnail_url: string;
          category: string;
          tags: string[];
          exif_data: Json | null;
          views_count: number;
          likes_count: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          image_url: string;
          thumbnail_url: string;
          category?: string;
          tags?: string[];
          exif_data?: Json | null;
          views_count?: number;
          likes_count?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          image_url?: string;
          thumbnail_url?: string;
          category?: string;
          tags?: string[];
          exif_data?: Json | null;
          views_count?: number;
          likes_count?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      view_stats: {
        Row: {
          id: string;
          user_id: string;
          photo_id: string | null;
          view_type: string;
          viewer_ip: string | null;
          viewer_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_id?: string | null;
          view_type: string;
          viewer_ip?: string | null;
          viewer_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          photo_id?: string | null;
          view_type?: string;
          viewer_ip?: string | null;
          viewer_user_id?: string | null;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          photo_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          photo_id?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      photo_category: 'landscape' | 'portrait' | 'street' | 'nature' | 'architecture' | 'other';
    };
  };
}
