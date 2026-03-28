import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Camera, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Camera className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-6xl font-bold text-text-primary mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          页面未找到
        </h2>
        
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          抱歉，你访问的页面不存在。它可能已被移动、删除，或者从未存在过。
        </p>
        
        <Link to="/">
          <Button size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
