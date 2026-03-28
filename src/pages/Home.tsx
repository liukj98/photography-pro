import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Camera, TrendingUp, Users, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function Home() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: ImageIcon,
      title: '展示作品',
      description: '创建精美的个人作品集，向世界展示你的摄影才华',
    },
    {
      icon: TrendingUp,
      title: '数据分析',
      description: '追踪作品浏览量，了解受众喜好，优化创作方向',
    },
    {
      icon: Users,
      title: '发现交流',
      description: '探索优秀摄影师的作品，与志同道合的创作者交流',
    },
    {
      icon: Camera,
      title: '专业工具',
      description: 'EXIF 信息展示、智能标签、图片优化等专业功能',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Camera className="w-4 h-4" />
              <span>摄影爱好者社区</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 tracking-tight">
              发现摄影的
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                无限可能
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
              展示你的摄影作品，追踪访问数据，与全球摄影爱好者交流。
              无论你是专业摄影师还是摄影爱好者，这里都是你展示才华的舞台。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/upload">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Camera className="w-5 h-5 mr-2" />
                    上传作品
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto">
                      开始使用
                    </Button>
                  </Link>
                  <Link to="/explore">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      探索作品
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              为摄影创作者打造
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              我们提供专业的工具和功能，帮助你更好地展示作品、分析数据、与社区互动
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
            <div className="relative px-8 py-16 text-center">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                准备好展示你的作品了吗？
              </h2>
              <p className="text-text-secondary mb-8 max-w-xl mx-auto">
                加入 PhotoPro，与全球摄影爱好者一起分享你的视觉故事
              </p>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button size="lg">免费注册</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
