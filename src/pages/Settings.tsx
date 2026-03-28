import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { uploadImage } from '../lib/storage';
import { Camera, Loader2, User, MapPin, Link as LinkIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function Settings() {
  const { user, setUser } = useAuthStore();
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    // Demo mode
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUrl = URL.createObjectURL(file);
      setUser({ ...user, avatar_url: mockUrl });
      addToast('头像上传成功', 'success');
      setIsUploading(false);
      return;
    }

    const { url, error } = await uploadImage(file, user.id, 'avatar');

    if (error || !url) {
      addToast(error || '上传失败', 'error');
      setIsUploading(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('users')
        .update({ avatar_url: url })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser({ ...user, avatar_url: url });
      addToast('头像上传成功', 'success');
    } catch (err) {
      addToast('更新头像失败', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    // Demo mode
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUser({
        ...user,
        ...formData,
      });
      addToast('资料已更新', 'success');
      setIsSaving(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('users')
        .update({
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({
        ...user,
        ...formData,
      });
      addToast('资料已更新', 'success');
    } catch (err) {
      addToast('更新失败', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            账号设置
          </h1>
          <p className="text-text-secondary">
            管理你的个人资料和偏好设置
          </p>
        </div>

        {/* Avatar Section */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">
              头像
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div
                className="relative cursor-pointer group"
                onClick={handleAvatarClick}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-24 h-24 rounded-full object-cover border-4 border-surface group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-surface group-hover:bg-primary/20 transition-colors">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 rounded-full p-2">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-2">
                  点击头像上传新图片
                </p>
                <p className="text-text-muted text-xs">
                  支持 JPG、PNG 格式，最大 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">
              个人资料
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="用户名"
                value={formData.username}
                disabled
                helperText="用户名不可修改"
              />

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  个人简介
                </label>
                <textarea
                  rows={4}
                  placeholder="介绍一下你自己..."
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-[34px] w-5 h-5 text-text-muted" />
                <Input
                  label="所在地"
                  placeholder="例如：北京，中国"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <LinkIcon className="absolute left-3 top-[34px] w-5 h-5 text-text-muted" />
                <Input
                  label="个人网站"
                  placeholder="https://your-website.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="pl-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSaving}
              >
                保存更改
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
