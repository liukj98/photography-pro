import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { isDemoMode, createMockUser, simulateNetworkDelay } from '../lib/demo-mode';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '../types';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ error: string | null }>;
  register: (credentials: RegisterCredentials) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true });
        
        if (isDemoMode()) {
          console.log('Demo mode: Simulating login');
          await simulateNetworkDelay(500);
          set({ 
            user: createMockUser(credentials.email), 
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
              // Try to resend confirmation email
              const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: credentials.email,
                options: {
                  emailRedirectTo: `${window.location.origin}/login`,
                },
              });
              
              set({ isLoading: false });
              
              if (resendError) {
                return { 
                  error: '邮箱未验证。请检查您的邮箱收件箱（包括垃圾邮件文件夹）中的验证邮件，或联系管理员。' 
                };
              }
              
              return { 
                error: '邮箱未验证。我们已重新发送验证邮件，请检查您的邮箱（包括垃圾邮件文件夹）。' 
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
        } catch {
          set({ isLoading: false });
          return { error: '登录失败，请稍后重试' };
        }
      },

      register: async (credentials) => {
        set({ isLoading: true });
        
        if (isDemoMode()) {
          console.log('Demo mode: Simulating registration');
          await simulateNetworkDelay(500);
          set({ 
            user: createMockUser(credentials.email, credentials.username), 
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
            // Supabase 类型定义不完整，需要类型断言
            const { error: profileError } = await supabase.from('users').insert({
              id: data.user.id,
              username: credentials.username,
              email: credentials.email,
            } as Record<string, unknown>);

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }

            await get().fetchUser();
          }

          set({ isLoading: false });
          return { error: null };
        } catch {
          set({ isLoading: false });
          return { error: '注册失败，请稍后重试' };
        }
      },

      logout: async () => {
        if (!isDemoMode()) {
          await supabase.auth.signOut();
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      fetchUser: async () => {
        if (isDemoMode()) {
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
        } catch {
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
