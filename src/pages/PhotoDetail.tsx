import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LikeButton } from '../components/interactions/LikeButton';
import { FavoriteButton } from '../components/interactions/FavoriteButton';
import { CommentSection } from '../components/interactions/CommentSection';
import { usePhoto } from '../hooks/usePhotos';
import { useViews } from '../hooks/useInteractions';
import { ArrowLeft, Eye, Camera, Aperture } from 'lucide-react';
import { formatDate, formatNumber } from '../lib/utils';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function PhotoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { photo, isLoading, error } = usePhoto(id);
  const { viewsCount, incrementView } = useViews(id || '');
  
  // 页面加载时增加浏览量
  useEffect(() => {
    if (id) {
      incrementView();
    }
  }, [id, incrementView]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error || '作品不存在'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Section */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </Card>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Title & Author */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {photo.title}
                </h1>
                {photo.description && (
                  <p className="text-text-secondary mb-4">
                    {photo.description}
                  </p>
                )}
                
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  {photo.user?.avatar_url ? (
                    <img
                      src={photo.user.avatar_url}
                      alt={photo.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {photo.user?.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-primary">
                      {photo.user?.username}
                    </p>
                    <p className="text-sm text-text-muted">
                      发布于 {formatDate(photo.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

              {/* Stats & Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatNumber(viewsCount)} 浏览
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  {id && <LikeButton photoId={id} className="flex-1" />}
                  {id && <FavoriteButton photoId={id} className="flex-1" />}
                </div>
              </CardContent>
            </Card>

            {/* EXIF Data */}
            {photo.exif_data && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-text-primary mb-4">
                    EXIF 信息
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {photo.exif_data.camera && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Camera className="w-4 h-4" />
                        <span>{photo.exif_data.camera}</span>
                      </div>
                    )}
                    {photo.exif_data.aperture && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Aperture className="w-4 h-4" />
                        <span>f/{photo.exif_data.aperture}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-text-primary mb-4">
                    标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-surface rounded-full text-sm text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">
                评论
              </h2>
              {id && <CommentSection photoId={id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
