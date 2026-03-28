// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  photos_count: number;
  total_views: number;
}

// Photo Types
export type PhotoCategory = 'landscape' | 'portrait' | 'street' | 'nature' | 'architecture' | 'other';

export interface Photo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url: string;
  category: PhotoCategory;
  tags: string[];
  exif_data?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: number;
    focal_length?: string;
  };
  views_count: number;
  likes_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Auth Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Stats Types
export interface ViewStats {
  id: string;
  user_id: string;
  photo_id?: string;
  view_type: 'profile' | 'photo';
  viewer_ip?: string;
  viewer_user_id?: string;
  created_at: string;
}

export interface UserStats {
  total_views: number;
  total_photos: number;
  views_by_day: { date: string; count: number }[];
  popular_photos: { photo_id: string; title: string; views: number }[];
}

// UI Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  requireAuth?: boolean;
}
