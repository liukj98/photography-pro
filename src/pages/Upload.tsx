import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Upload as UploadIcon, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadImage, validateImageFile } from '../lib/storage';
import { useCreatePhoto } from '../hooks/usePhotos';
import { useAuthStore } from '../stores/authStore';
import type { PhotoCategory } from '../types';

const categories: { value: PhotoCategory; label: string }[] = [
  { value: 'landscape', label: '风光' },
  { value: 'portrait', label: '人像' },
  { value: 'street', label: '街头' },
  { value: 'nature', label: '自然' },
  { value: 'architecture', label: '建筑' },
  { value: 'other', label: '其他' },
];

export function Upload() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createPhoto, isLoading: isCreating } = useCreatePhoto();
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'landscape' as PhotoCategory,
    tags: '',
    isPublic: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors({ file: validation.error ?? 'Invalid file' });
      return;
    }

    setErrors({});
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedFile) {
      newErrors.file = '请选择要上传的图片';
    }

    if (!formData.title.trim()) {
      newErrors.title = '请输入作品标题';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedFile || !user) {
      if (!user) {
        navigate('/login');
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload image
      const { url, thumbnailUrl, error: uploadError } = await uploadImage(
        selectedFile,
        user.id
      );

      clearInterval(progressInterval);

      if (uploadError || !url || !thumbnailUrl) {
        setIsUploading(false);
        return;
      }

      setUploadProgress(100);

      // Parse tags
      const tags = formData.tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Create photo record
      const { error: createError } = await createPhoto({
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: url,
        thumbnail_url: thumbnailUrl,
        category: formData.category,
        tags,
        is_public: formData.isPublic,
      });

      if (createError) {
        setIsUploading(false);
        return;
      }

      // Navigate to profile
      navigate(`/u/${user.username}`);
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
    }
  };

  const isSubmitting = isUploading || isCreating;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            上传作品
          </h1>
          <p className="text-text-secondary">
            分享你的摄影作品，展示你的创意
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Upload Area */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {!selectedFile ? (
                <div
                  className={cn(
                    'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200',
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <UploadIcon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-text-primary font-medium mb-2">
                    点击或拖拽上传图片
                  </p>
                  <p className="text-sm text-text-muted">
                    支持 JPG、PNG、WebP 格式，最大 10MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute -top-2 -right-2 p-1.5 bg-error text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {previewUrl && (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-96 object-contain rounded-xl"
                      />
                      {isSubmitting && (
                        <div className="absolute inset-0 bg-background/80 rounded-xl flex flex-col items-center justify-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                          <p className="text-text-secondary text-sm">
                            上传中... {uploadProgress}%
                          </p>
                          <div className="w-48 h-2 bg-surface rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.file && (
                <p className="mt-3 text-sm text-error text-center">{errors.file}</p>
              )}
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">
                作品信息
              </h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                label="作品标题"
                placeholder="给你的作品起个名字"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                error={errors.title}
                disabled={isSubmitting}
              />

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  作品描述
                </label>
                <textarea
                  rows={4}
                  placeholder="分享这张照片背后的故事..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
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
                      disabled={isSubmitting}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50',
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

              <Input
                label="标签"
                placeholder="添加标签，用逗号分隔（如：风光, 日落, 山脉）"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                disabled={isSubmitting}
              />

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublic: e.target.checked })
                    }
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary disabled:opacity-50"
                  />
                  <span className="text-sm text-text-secondary">
                    公开作品（其他人可以查看）
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
                disabled={!selectedFile}
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                {isSubmitting ? '发布中...' : '发布作品'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
