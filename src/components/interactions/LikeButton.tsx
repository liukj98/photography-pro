import { Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLike } from '../../hooks/useInteractions';
import { cn } from '../../lib/utils';

interface LikeButtonProps {
  photoId: string;
  className?: string;
}

export function LikeButton({ photoId, className }: LikeButtonProps) {
  const { isLiked, likesCount, isLoading, toggleLike } = useLike(photoId);

  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={isLoading}
      onClick={() => toggleLike()}
      className={cn(
        'flex items-center gap-1.5',
        isLiked && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      <Heart
        className={cn(
          'w-5 h-5 transition-all',
          isLiked && 'fill-current'
        )}
      />
      <span>{likesCount}</span>
    </Button>
  );
}
