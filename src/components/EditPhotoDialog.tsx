import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Tag, Camera } from 'lucide-react';
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
    exif_data?: Record<string, string | number>;
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
    exif: {
      camera: '',
      lens: '',
      aperture: '',
      shutter: '',
      iso: '',
      focal_length: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when photo changes or dialog opens
  useEffect(() => {
    if (photo && isOpen) {
      // Use requestAnimationFrame to avoid synchronous setState during render
      requestAnimationFrame(() => {
        setFormData({
          title: photo.title,
          description: photo.description || '',
          category: photo.category,
          tags: photo.tags?.join(', ') || '',
          is_public: photo.is_public,
          exif: {
            camera: photo.exif_data?.camera || '',
            lens: photo.exif_data?.lens || '',
            aperture: photo.exif_data?.aperture || '',
            shutter: photo.exif_data?.shutter || '',
            iso: photo.exif_data?.iso?.toString() || '',
            focal_length: photo.exif_data?.focal_length || '',
          },
        });
        setErrors({});
      });
    }
  }, [photo, isOpen]);

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

    // Build exif data (only include non-empty values)
    const exifData: Record<string, string | number> = {};
    if (formData.exif.camera.trim()) exifData.camera = formData.exif.camera.trim();
    if (formData.exif.lens.trim()) exifData.lens = formData.exif.lens.trim();
    if (formData.exif.aperture.trim()) exifData.aperture = formData.exif.aperture.trim();
    if (formData.exif.shutter.trim()) exifData.shutter = formData.exif.shutter.trim();
    if (formData.exif.iso.trim()) exifData.iso = parseInt(formData.exif.iso) || 0;
    if (formData.exif.focal_length.trim()) exifData.focal_length = formData.exif.focal_length.trim();

    const result = await onSave(photo.id, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      tags,
      is_public: formData.is_public,
      exif_data: Object.keys(exifData).length > 0 ? exifData : undefined,
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

            {/* EXIF Data */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                摄影参数
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="相机"
                  placeholder="如：Sony A7M4"
                  value={formData.exif.camera}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exif: { ...formData.exif, camera: e.target.value },
                    })
                  }
                  disabled={isLoading}
                />
                <Input
                  label="镜头"
                  placeholder="如：24-70mm f/2.8"
                  value={formData.exif.lens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exif: { ...formData.exif, lens: e.target.value },
                    })
                  }
                  disabled={isLoading}
                />
                <Input
                  label="光圈"
                  placeholder="如：f/2.8"
                  value={formData.exif.aperture}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exif: { ...formData.exif, aperture: e.target.value },
                    })
                  }
                  disabled={isLoading}
                />
                <Input
                  label="快门"
                  placeholder="如：1/125s"
                  value={formData.exif.shutter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exif: { ...formData.exif, shutter: e.target.value },
                    })
                  }
                  disabled={isLoading}
                />
                <Input
                  label="ISO"
                  placeholder="如：100"
                  value={formData.exif.iso}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exif: { ...formData.exif, iso: e.target.value },
                    })
                  }
                  disabled={isLoading}
                />
                <Input
                  label="焦距"
                  placeholder="如：35mm"
                  value={formData.exif.focal_length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exif: { ...formData.exif, focal_length: e.target.value },
                    })
                  }
                  disabled={isLoading}
                />
              </div>
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
