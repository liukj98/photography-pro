import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Eye, Image as ImageIcon, TrendingUp, Users, Loader2 } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { useStats } from '../hooks/useStats';

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

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            数据统计
          </h1>
          <p className="text-text-secondary">
            追踪你的作品表现和受众增长
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">总浏览量</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {formatNumber(stats.total_views)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">作品数量</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {stats.total_photos}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">今日浏览</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {formatNumber(stats.views_by_day[stats.views_by_day.length - 1]?.count || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">本周增长</p>
                  <p className="text-3xl font-bold text-text-primary">
                    +{formatNumber(stats.views_by_day.reduce((a, b) => a + b.count, 0))}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Views Chart */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">
                浏览趋势（最近7天）
              </h2>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {stats.views_by_day.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary/20 rounded-t-lg relative group cursor-pointer hover:bg-primary/30 transition-colors"
                      style={{ height: `${(day.count / maxViews) * 100}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface border border-border rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.count} 浏览
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">{day.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Photos */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">
                热门作品
              </h2>
            </CardHeader>
            <CardContent>
              {stats.popular_photos.length > 0 ? (
                <div className="space-y-4">
                  {stats.popular_photos.map((photo, index) => (
                    <div
                      key={photo.photo_id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <span className="text-lg font-bold text-text-muted w-6">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">
                          {photo.title}
                        </h3>
                        <p className="text-sm text-text-muted">
                          {formatNumber(photo.views)} 浏览
                        </p>
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
