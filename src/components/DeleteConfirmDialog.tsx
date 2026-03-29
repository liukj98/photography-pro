import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';
import type { Photo } from '../types';

interface DeleteConfirmDialogProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photoId: string) => Promise<{ error: string | null }>;
}

export function DeleteConfirmDialog({
  photo,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!photo) return;

    setIsDeleting(true);
    await onConfirm(photo.id);
    setIsDeleting(false);
    onClose();
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <span>删除作品</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {photo && (
            <>
              {/* Photo Preview */}
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                <img
                  src={photo.thumbnail_url}
                  alt={photo.title}
                  className="w-16 h-12 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {photo.title}
                  </p>
                  <p className="text-sm text-text-muted">
                    {photo.views_count} 浏览 · {photo.likes_count} 喜欢
                  </p>
                </div>
              </div>

              {/* Warning Message */}
              <div className="text-sm text-text-secondary space-y-2">
                <p>
                  确定要删除作品 <span className="font-medium text-text-primary">"{photo.title}"</span> 吗？
                </p>
                <div className="flex items-start gap-2 p-3 bg-error/5 border border-error/20 rounded-xl">
                  <Trash2 className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-error">
                    此操作不可撤销，作品将被永久删除，包括所有相关的点赞、评论和收藏数据。
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  isLoading={isDeleting}
                  disabled={isDeleting}
                  onClick={handleConfirm}
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
