import { LoginForm } from '../components/auth/LoginForm';
import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Login() {
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
            欢迎回来
          </h2>
          <p className="mt-2 text-text-secondary">
            登录你的 PhotoPro 账号
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-xl">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-text-muted">
          登录即表示你同意我们的{' '}
          <Link to="#" className="text-primary hover:text-primary-hover">
            服务条款
          </Link>{' '}
          和{' '}
          <Link to="#" className="text-primary hover:text-primary-hover">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
}
