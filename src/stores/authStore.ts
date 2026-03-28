import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '../types';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ error: string | null }>;
  register: (credentials: RegisterCredentials) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// Mock user for development when Supabase is not configured
const mockUser: User = {
  id: 'mock-user-id',
  username: 'demo_user',
  email: 'demo@example.com',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  bio: '摄影爱好者',
  location: '北京',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true });
        
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
          // Demo mode - accept any credentials
          console.log('Demo mode: Simulating login');
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ 
            user: { ...mockUser, email: credentials.email }, 
            isAuthenticated: true,
            isLoading: false 
          });
          return { error: null };
        }
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            // Check if error is about email confirmation
            if (error.message.includes('Email not confirmed') || error.message.includes('not confirmed')) {
              // Try to resend confirmation or notify user
              set({ isLoading: false });
              return { 
                error: '邮箱未验证。请检查您的邮箱收件箱（包括垃圾邮件文件夹）中的验证邮件，或联系管理员。' 
              };
            }
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            await get().fetchUser();
          }

          set({ isLoading: false });
          return { error: null };
        } catch (err) {
          set({ isLoading: false });
          return { error: '登录失败，请稍后重试' };
        }
      },

      register: async (credentials) => {
        set({ isLoading: true });
        
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
          // Demo mode
          console.log('Demo mode: Simulating registration');
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ 
            user: { 
              ...mockUser, 
              username: credentials.username,
              email: credentials.email 
            }, 
            isAuthenticated: true,
            isLoading: false 
          });
          return { error: null };
        }
        
        try {
          // Check if username is taken
          const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', credentials.username)
            .single();

          if (existingUser) {
            set({ isLoading: false });
            return { error: '用户名已被使用' };
          }

          const { data, error } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: {
              data: {
                username: credentials.username,
              },
              emailRedirectTo: `${window.location.origin}/login`,
            },
          });

          // Auto-confirm in demo/development (skip email verification)
          // For production, remove this and enable email confirmation in Supabase Dashboard
          if (data.user && !data.session) {
            // Try to sign in immediately (works if email confirmation is disabled)
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            });
            if (!signInError) {
              await get().fetchUser();
              set({ isLoading: false });
              return { error: null };
            }
          }

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Create user profile - Note: This assumes the users table exists
            // In a real app, you might use Supabase Auth triggers instead
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: profileError } = await supabase.from('users').insert({
              id: data.user.id,
              username: credentials.username,
              email: credentials.email,
            } as any);

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }

            await get().fetchUser();
          }

          set({ isLoading: false });
          return { error: null };
        } catch (err) {
          set({ isLoading: false });
          return { error: '注册失败，请稍后重试' };
        }
      },

      logout: async () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl && supabaseUrl !== 'your_supabase_project_url') {
          await supabase.auth.signOut();
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      fetchUser: async () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
          // Don't fetch in demo mode
          set({ isLoading: false });
          return;
        }
        
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser) {
            const { data: user } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();

            if (user) {
              set({ user: user as User, isAuthenticated: true });
            }
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
