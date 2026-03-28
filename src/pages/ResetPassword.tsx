import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Camera, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToastStore } from '../stores/toastStore';
import { validatePassword } from '../lib/utils';
import { Eye, EyeOff, Check, X } from 'lucide-react';

// Step 1: Enter email
export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const isUpdateMode = !!searchParams.get('token') || window.location.hash.includes('type=recovery');
  return isUpdateMode ? <UpdatePassword /> : <RequestReset />;
}

function RequestReset() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSent(true);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '发送失败';
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-8 flex justify-center">
            <div className="p-3 rounded-2xl bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            邮件已发送
          </h2>
          <p className="text-text-secondary mb-8">
            我们已向 <span className="text-primary font-medium">{email}</span> 发送了密码重置邮件，
            请检查您的收件箱（包括垃圾邮件文件夹）。
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/login')} variant="secondary">
              返回登录
            </Button>
            <button
              onClick={() => setIsSent(false)}
              className="text-sm text-text-secondary hover:text-primary transition-colors"
            >
              重新发送
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Camera className="h-8 w-8 text-primary" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">
            重置密码
          </h2>
          <p className="mt-2 text-text-secondary">
            输入您的邮箱地址，我们将发送密码重置链接
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-[34px] w-5 h-5 text-text-muted" />
              <Input
                label="邮箱地址"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              发送重置链接
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdatePassword() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordChecks.isValid) {
      addToast('密码不符合要求', 'error');
      return;
    }

    if (password !== confirmPassword) {
      addToast('两次输入的密码不一致', 'error');
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addToast('密码已重置', 'success');
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      addToast('密码已重置，请重新登录', 'success');
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : '重置失败';
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Camera className="h-8 w-8 text-primary" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">
            设置新密码
          </h2>
          <p className="mt-2 text-text-secondary">
            输入您的新密码
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                label="新密码"
                type={showPassword ? 'text' : 'password'}
                placeholder="设置新密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] p-1 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <div className="space-y-2 text-sm">
                <p className="text-text-muted">密码要求：</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '至少8个字符', valid: password.length >= 8 },
                    { label: '包含大写字母', valid: /[A-Z]/.test(password) },
                    { label: '包含小写字母', valid: /[a-z]/.test(password) },
                    { label: '包含数字', valid: /[0-9]/.test(password) },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-1.5 ${item.valid ? 'text-green-400' : 'text-text-muted'}`}
                    >
                      {item.valid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Input
              label="确认新密码"
              type="password"
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && password !== confirmPassword ? '两次输入的密码不一致' : undefined}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              重置密码
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
