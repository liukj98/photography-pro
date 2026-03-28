import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: '产品',
      links: [
        { label: '探索', href: '/explore' },
        { label: '上传作品', href: '/upload' },
        { label: '数据统计', href: '/stats' },
      ],
    },
    {
      title: '支持',
      links: [
        { label: '帮助中心', href: '#' },
        { label: '使用条款', href: '#' },
        { label: '隐私政策', href: '#' },
      ],
    },
    {
      title: '关于',
      links: [
        { label: '关于我们', href: '#' },
        { label: '联系我们', href: '#' },
        { label: '加入我们', href: '#' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Camera, href: '#', label: 'Social' },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-text-primary">PhotoPro</span>
            </Link>
            <p className="text-sm text-text-secondary mb-4">
              为摄影爱好者打造的专业社区，发现、分享、成长。
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-xl bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-primary/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">
            © {currentYear} PhotoPro. All rights reserved.
          </p>
          <p className="text-sm text-text-muted">
            Made with ❤️ for photographers
          </p>
        </div>
      </div>
    </footer>
  );
}
