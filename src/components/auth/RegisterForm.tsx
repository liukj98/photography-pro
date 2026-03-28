import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { validateEmail, validateUsername, validatePassword } from '../../lib/utils';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = validatePassword(formData.password);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和横线，长度3-20位';
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (!passwordChecks.isValid) {
      newErrors.password = '密码不符合要求';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '请同意服务条款';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
    setIsLoading(false);

    if (error) {
      addToast(error, 'error');
    } else {
      addToast('注册成功！欢迎加入 PhotoPro', 'success');
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="用户名"
        placeholder="设置你的用户名"
        data-testid="username-input"
        value={formData.username}
        onChange={(e) => {
          setFormData({ ...formData, username: e.target.value });
          if (errors.username) setErrors({ ...errors, username: '' });
        }}
        error={errors.username}
        helperText="3-20位，只能包含字母、数字、下划线和横线"
      />

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
          placeholder="设置密码"
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

      {/* Password Requirements */}
      {formData.password && (
        <div className="space-y-2 text-sm">
          <p className="text-text-muted">密码要求：</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '至少8个字符', valid: formData.password.length >= 8 },
              { label: '包含大写字母', valid: /[A-Z]/.test(formData.password) },
              { label: '包含小写字母', valid: /[a-z]/.test(formData.password) },
              { label: '包含数字', valid: /[0-9]/.test(formData.password) },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-1.5 ${
                  item.valid ? 'text-green-400' : 'text-text-muted'
                }`}
              >
                {item.valid ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Input
          label="确认密码"
          type={showPassword ? 'text' : 'password'}
          placeholder="再次输入密码"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
          }}
          error={errors.confirmPassword}
        />
      </div>

      <div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => {
              setFormData({ ...formData, agreeTerms: e.target.checked });
              if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: '' });
            }}
            className="mt-0.5 w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
          />
          <span className="text-sm text-text-secondary">
            我已阅读并同意{' '}
            <Link to="#" className="text-primary hover:text-primary-hover">
              服务条款
            </Link>{' '}
            和{' '}
            <Link to="#" className="text-primary hover:text-primary-hover">
              隐私政策
            </Link>
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="mt-1.5 text-sm text-error">{errors.agreeTerms}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isLoading}
      >
        注册
      </Button>

      <p className="text-center text-sm text-text-secondary">
        已有账号？{' '}
        <Link
          to="/login"
          className="text-primary hover:text-primary-hover font-medium transition-colors"
        >
          立即登录
        </Link>
      </p>
    </form>
  );
}
