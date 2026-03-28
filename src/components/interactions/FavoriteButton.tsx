import { Bookmark } from 'lucide-react';
import { Button } from '../ui/Button';
import { useFavorite } from '../../hooks/useInteractions';
import { cn } from '../../lib/utils';

interface FavoriteButtonProps {
  photoId: string;
  className?: string;
}

export function FavoriteButton({ photoId, className }: FavoriteButtonProps) {
  const { isFavorited, isLoading, toggleFavorite } = useFavorite(photoId);

  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={isLoading}
      onClick={() => toggleFavorite()}
      className={cn(
        'flex items-center gap-1.5',
        isFavorited && 'text-primary hover:text-primary-hover',
        className
      )}
    >
      <Bookmark
        className={cn(
          'w-5 h-5 transition-all',
          isFavorited && 'fill-current'
        )}
      />
      <span>{isFavorited ? '已收藏' : '收藏'}</span>
    </Button>
  );
}
