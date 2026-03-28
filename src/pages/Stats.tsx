import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Eye, Image as ImageIcon, TrendingUp, Users, Loader2, Heart, Star, BarChart3, Download } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { useStats } from '../hooks/useStats';

const CATEGORY_COLORS: Record<string, string> = {
  landscape: 'bg-blue-500',
  portrait: 'bg-pink-500',
  street: 'bg-amber-500',
  nature: 'bg-green-500',
  architecture: 'bg-purple-500',
  other: 'bg-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  landscape: '风光',
  portrait: '人像',
  street: '街头',
  nature: '自然',
  architecture: '建筑',
  other: '其他',
};

export function Stats() {
  const { stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:text-primary-hover"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <p className="text-text-muted">暂无数据</p>
      </div>
    );
  }

  const maxViews = Math.max(...stats.views_by_day.map((d) => d.count), 1);
  const todayViews = stats.views_by_day[stats.views_by_day.length - 1]?.count || 0;
  const yesterdayViews = stats.views_by_day[stats.views_by_day.length - 2]?.count || 0;
  const todayGrowth = yesterdayViews > 0 ? ((todayViews - yesterdayViews) / yesterdayViews * 100).toFixed(1) : '0';

  // Compute category distribution from popular photos if available
  const categoryMap: Record<string, number> = {};
  stats.popular_photos.forEach((p) => {
    const cat = p.category || 'other';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const totalCategoryItems = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              数据统计
            </h1>
            <p className="text-text-secondary">
              追踪你的作品表现和受众增长
            </p>
          </div>
          <button
            onClick={() => {
              const data = JSON.stringify(stats, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `stats-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="总浏览量"
            value={formatNumber(stats.total_views)}
            icon={Eye}
            color="bg-primary/10"
            iconColor="text-primary"
          />
          <StatCard
            label="作品数量"
            value={stats.total_photos}
            icon={ImageIcon}
            color="bg-green-500/10"
            iconColor="text-green-500"
          />
          <StatCard
            label="今日浏览"
            value={formatNumber(todayViews)}
            icon={Users}
            color="bg-purple-500/10"
            iconColor="text-purple-500"
            badge={todayGrowth !== '0' ? `${Number(todayGrowth) > 0 ? '+' : ''}${todayGrowth}%` : undefined}
            badgePositive={Number(todayGrowth) >= 0}
          />
          <StatCard
            label="本周浏览"
            value={formatNumber(stats.views_by_day.reduce((a, b) => a + b.count, 0))}
            icon={TrendingUp}
            color="bg-amber-500/10"
            iconColor="text-amber-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Views Chart - 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">
                  浏览趋势（最近7天）
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-3">
                {stats.views_by_day.map((day, index) => {
                  const heightPercent = (day.count / maxViews) * 100;
                  const isToday = index === stats.views_by_day.length - 1;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex items-end" style={{ height: '100%' }}>
                        <div
                          className={`w-full rounded-t-lg relative group cursor-pointer transition-all duration-300 ${
                            isToday
                              ? 'bg-primary shadow-lg shadow-primary/20'
                              : 'bg-primary/20 hover:bg-primary/40'
                          }`}
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            <div className="font-bold text-text-primary">{day.count} 浏览</div>
                            {index > 0 && (
                              <div className={`text-text-muted ${day.count > stats.views_by_day[index - 1].count ? 'text-green-400' : 'text-red-400'}`}>
                                {day.count > stats.views_by_day[index - 1].count ? '+' : ''}
                                {day.count - stats.views_by_day[index - 1].count}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs ${isToday ? 'text-primary font-medium' : 'text-text-muted'}`}>
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-text-primary">
                  分类分布
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(categoryMap).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(categoryMap)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => {
                      const percent = ((count / totalCategoryItems) * 100).toFixed(0);
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-text-secondary">
                              {CATEGORY_LABELS[category] || category}
                            </span>
                            <span className="text-sm font-medium text-text-primary">
                              {count} <span className="text-text-muted font-normal">({percent}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[category] || 'bg-gray-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-muted">暂无分类数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Popular Photos */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-text-primary">
                  热门作品 TOP 5
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {stats.popular_photos.length > 0 ? (
                <div className="space-y-3">
                  {stats.popular_photos.slice(0, 5).map((photo, index) => (
                    <div
                      key={photo.photo_id}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-amber-500/10 text-amber-500' :
                        index === 1 ? 'bg-gray-400/10 text-gray-400' :
                        index === 2 ? 'bg-orange-500/10 text-orange-500' :
                        'bg-surface text-text-muted'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">
                          {photo.title}
                        </h3>
                        {photo.category && (
                          <p className="text-xs text-text-muted">
                            {CATEGORY_LABELS[photo.category] || photo.category}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-text-muted">
                        <Eye className="w-4 h-4" />
                        {formatNumber(photo.views)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-muted">暂无数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  iconColor,
  badge,
  badgePositive,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  badge?: string;
  badgePositive?: boolean;
}) {
  return (
    <Card className="hover:border-primary/20 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted mb-1">{label}</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-text-primary">{value}</p>
              {badge && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  badgePositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {badge}
                </span>
              )}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
