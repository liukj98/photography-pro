import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, Link as LinkIcon, Calendar, Camera, Eye, Heart, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUserPhotos } from '../hooks/usePhotos';
import { useUser } from '../hooks/useUser';
import { formatNumber } from '../lib/utils';

export function Profile() {
  const params = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const { user: profileUser, isLoading: isUserLoading, error: userError } = useUser(params.username);
  const { photos, isLoading: isPhotosLoading, error: photosError } = useUserPhotos(params.username);
  
  const isOwnProfile = !params.username || params.username === currentUser?.username;
  
  const isLoading = isUserLoading || isPhotosLoading;
  const error = userError || photosError;

  const totalViews = photos.reduce((sum, p) => sum + p.views_count, 0);
  const totalLikes = photos.reduce((sum, p) => sum + p.likes_count, 0);

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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar */}
              <div className="relative">
                {profileUser?.avatar_url ? (
                  <img
                    src={profileUser.avatar_url}
                    alt={profileUser.username}
                    className="w-32 h-32 rounded-full object-cover border-4 border-surface"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-surface">
                    <Camera className="w-12 h-12 text-primary" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {profileUser?.username || '用户'}
                </h1>
                
                {profileUser?.bio && (
                  <p className="text-text-secondary mb-4 max-w-xl">
                    {profileUser.bio}
                  </p>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6 text-sm text-text-muted">
                  {profileUser?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileUser.location}</span>
                    </div>
                  )}
                  {profileUser?.website && (
                    <a
                      href={profileUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>个人网站</span>
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {profileUser?.created_at
                        ? `加入于 ${new Date(profileUser.created_at).toLocaleDateString('zh-CN')}`
                        : '新用户'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-center md:justify-start gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {photos.length}
                    </div>
                    <div className="text-sm text-text-muted">作品</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {formatNumber(totalViews)}
                    </div>
                    <div className="text-sm text-text-muted">浏览</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {formatNumber(totalLikes)}
                    </div>
                    <div className="text-sm text-text-muted">喜欢</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isOwnProfile && (
                <div className="flex flex-col gap-2">
                  <Link to="/settings">
                    <Button>编辑资料</Button>
                  </Link>
                  <Link to="/stats">
                    <Button variant="secondary">查看统计</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos Grid */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-6">
            作品
          </h2>
          
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <Link key={photo.id} to={`/photo/${photo.id}`}>
                  <Card isHoverable className="group">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={photo.thumbnail_url}
                        alt={photo.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white font-semibold truncate">{photo.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {photo.views_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {photo.likes_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface rounded-2xl border border-border">
              <Camera className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                还没有作品
              </h3>
              <p className="text-text-secondary mb-4">
                上传你的第一张照片，开始展示你的摄影才华
              </p>
              <Link to="/upload">
                <Button>上传作品</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
