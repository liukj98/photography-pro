import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Heart, Loader2 } from 'lucide-react';
import { useUserFavorites } from '../hooks/useInteractions';
import { formatNumber } from '../lib/utils';

export function Favorites() {
  const { favorites, isLoading } = useUserFavorites();

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            我的收藏
          </h1>
          <p className="text-text-secondary">
            共收藏 {favorites.length} 张作品
          </p>
        </div>

        {/* Favorites Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} isHoverable className="group">
                <Link to={`/photo/${favorite.photo?.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={favorite.photo?.thumbnail_url}
                      alt={favorite.photo?.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-semibold truncate">
                        {favorite.photo?.title}
                      </h3>
                    </div>
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/u/${favorite.photo?.user?.username}`}
                      className="flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {favorite.photo?.user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {favorite.photo?.user?.username}
                      </span>
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-text-muted">
                      <Heart className="w-4 h-4 fill-current text-red-500" />
                      <span>{formatNumber(favorite.photo?.likes_count || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-2xl border border-border">
            <Heart className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              还没有收藏
            </h3>
            <p className="text-text-secondary mb-4">
              浏览作品时点击收藏按钮，将喜欢的作品保存到这里
            </p>
            <Link to="/explore">
              <Button>去浏览作品</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
