import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Edit, Trash2, Eye, Grid, List, Loader2, Camera } from 'lucide-react';
import { useUserPhotos } from '../hooks/usePhotos';

import { EditPhotoDialog } from '../components/EditPhotoDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import type { Photo } from '../types';

export function Manage() {
  const { photos, isLoading, error, refetch, deletePhoto, updatePhoto } = useUserPhotos();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (photoId: string, data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    is_public: boolean;
    exif_data?: Record<string, string | number>;
  }) => {
    setIsUpdating(true);
    const result = await updatePhoto(photoId, data);
    setIsUpdating(false);
    return result;
  };

  const filteredPhotos = photos.filter((photo) =>
    photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

  const handleDeleteClick = (photo: Photo) => {
    setDeletingPhoto(photo);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (photoId: string) => {
    setDeletingId(photoId);
    const { error } = await deletePhoto(photoId);
    setDeletingId(null);

    if (!error) {
      setSelectedPhotos((prev) => prev.filter((id) => id !== photoId));
    }
    return { error };
  };

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
          <button
            onClick={refetch}
            className="text-primary hover:text-primary-hover"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              作品管理
            </h1>
            <p className="text-text-secondary">
              管理你的摄影作品，共 {photos.length} 张
            </p>
          </div>
          <Link to="/upload">
            <Button>上传新作品</Button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="搜索作品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPhotos.length > 0 && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <span className="text-sm text-text-secondary">
              已选择 {selectedPhotos.length} 个作品
            </span>
            <Button variant="ghost" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
          </div>
        )}

        {/* Photos */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="group">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo.id)}
                    onChange={() => toggleSelect(photo.id)}
                    className="absolute top-3 left-3 z-10 w-5 h-5 rounded border-border bg-surface/80 text-primary focus:ring-primary"
                  />
                  <img
                    src={photo.thumbnail_url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(photo)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={deletingId === photo.id}
                      onClick={() => handleDeleteClick(photo)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-text-primary truncate mb-1">
                    {photo.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>{photo.views_count} 浏览</span>
                    <span>{photo.likes_count} 喜欢</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo.id)}
                    onChange={() => toggleSelect(photo.id)}
                    className="w-5 h-5 rounded border-border bg-surface text-primary focus:ring-primary"
                  />
                  <img
                    src={photo.thumbnail_url}
                    alt={photo.title}
                    className="w-20 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary truncate">
                      {photo.title}
                    </h3>
                    <p className="text-sm text-text-muted truncate">
                      {photo.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {photo.views_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 rounded-lg hover:bg-surface transition-colors"
                      onClick={() => handleEdit(photo)}
                    >
                      <Edit className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-error/10 transition-colors"
                      onClick={() => handleDeleteClick(photo)}
                      disabled={deletingId === photo.id}
                    >
                      {deletingId === photo.id ? (
                        <Loader2 className="w-4 h-4 text-error animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-error" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-20 bg-surface rounded-2xl border border-border">
            {searchQuery ? (
              <>
                <Search className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted">没有找到匹配的作品</p>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditPhotoDialog
        photo={editingPhoto}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveEdit}
        isLoading={isUpdating}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        photo={deletingPhoto}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
