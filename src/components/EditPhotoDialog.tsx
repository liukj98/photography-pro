import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Photo, PhotoCategory } from '../types';

const categories: { value: PhotoCategory; label: string }[] = [
  { value: 'landscape', label: '风光' },
  { value: 'portrait', label: '人像' },
  { value: 'street', label: '街头' },
  { value: 'nature', label: '自然' },
  { value: 'architecture', label: '建筑' },
  { value: 'other', label: '其他' },
];

interface EditPhotoDialogProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (photoId: string, data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    is_public: boolean;
  }) => Promise<{ error: string | null }>;
  isLoading?: boolean;
}

export function EditPhotoDialog({
  photo,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: EditPhotoDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'landscape' as PhotoCategory,
    tags: '',
    is_public: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when photo changes
  useEffect(() => {
    if (photo) {
      setFormData({
        title: photo.title,
        description: photo.description || '',
        category: photo.category,
        tags: photo.tags?.join(', ') || '',
        is_public: photo.is_public,
      });
      setErrors({});
    }
  }, [photo]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入作品标题';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !photo) return;

    const tags = formData.tags
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const result = await onSave(photo.id, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      tags,
      is_public: formData.is_public,
    });

    if (!result.error) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑作品</DialogTitle>
        </DialogHeader>

        {photo && (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Preview Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface">
              <img
                src={photo.thumbnail_url}
                alt={photo.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Title */}
            <Input
              label="作品标题"
              placeholder="给你的作品起个名字"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              error={errors.title}
              disabled={isLoading}
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                作品描述
              </label>
              <textarea
                rows={3}
                placeholder="分享这张照片背后的故事..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                分类
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: cat.value })
                    }
                    disabled={isLoading}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50',
                      formData.category === cat.value
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                <Tag className="w-4 h-4 inline mr-1" />
                标签
              </label>
              <Input
                placeholder="添加标签，用逗号分隔（如：风光, 日落, 山脉）"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) =>
                    setFormData({ ...formData, is_public: e.target.checked })
                  }
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary disabled:opacity-50"
                />
                <span className="text-sm text-text-secondary">
                  公开作品（其他人可以查看）
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={handleClose}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? '保存中...' : '保存修改'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
