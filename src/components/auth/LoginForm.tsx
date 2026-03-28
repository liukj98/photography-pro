import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { validateEmail } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await login({
      email: formData.email,
      password: formData.password,
    });
    setIsLoading(false);

    if (error) {
      addToast(error, 'error');
    } else {
      addToast('登录成功！', 'success');
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="邮箱地址"
        type="email"
        placeholder="your@email.com"
        value={formData.email}
        onChange={(e) => {
          setFormData({ ...formData, email: e.target.value });
          if (errors.email) setErrors({ ...errors, email: '' });
        }}
        error={errors.email}
      />

      <div className="relative">
        <Input
          label="密码"
          type={showPassword ? 'text' : 'password'}
          placeholder="请输入密码"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          error={errors.password}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[34px] p-1 text-text-muted hover:text-text-secondary transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
          />
          <span className="text-sm text-text-secondary">记住我</span>
        </label>
        <Link
          to="/reset-password"
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          忘记密码？
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isLoading}
      >
        登录
      </Button>

      <p className="text-center text-sm text-text-secondary">
        还没有账号？{' '}
        <Link
          to="/register"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          立即注册
        </Link>
      </p>
    </form>
  );
}
