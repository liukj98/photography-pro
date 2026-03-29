import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Lightbox } from '../components/ui/Lightbox';
import type { LightboxImage } from '../components/ui/Lightbox';
import { MasonryGrid } from '../components/ui/MasonryGrid';
import { Search, Filter, Image as ImageIcon, Loader2, Heart, Eye, X, Expand } from 'lucide-react';
import { usePhotos } from '../hooks/usePhotos';
import { useLightbox } from '../hooks/useLightbox';
import { formatNumber } from '../lib/utils';
import type { PhotoCategory } from '../types';

const categories: { value: PhotoCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'landscape', label: '风光' },
  { value: 'portrait', label: '人像' },
  { value: 'street', label: '街头' },
  { value: 'nature', label: '自然' },
  { value: 'architecture', label: '建筑' },
  { value: 'other', label: '其他' },
];

export function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'all'>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const lightbox = useLightbox();

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { photos, isLoading, error, hasMore, loadMore, refetch } = usePhotos({
    category: selectedCategory,
    limit: 12,
  });

  // 当页面重新获得焦点时刷新数据（从详情页返回时）
  useEffect(() => {
    // 初始挂载时刷新一次
    refetch();
    
    // 页面可见性变化时刷新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // refetch 是稳定的回调函数，不需要作为依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在挂载时执行一次

  // Filter photos by debounced search query
  const filteredPhotos = useMemo(() => {
    if (!debouncedQuery) return photos;
    const query = debouncedQuery.toLowerCase();
    return photos.filter((photo) => {
      return (
        photo.title.toLowerCase().includes(query) ||
        photo.description?.toLowerCase().includes(query) ||
        photo.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [photos, debouncedQuery]);

  // Generate search suggestions from tags and titles
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const query = searchQuery.toLowerCase();
    const suggestions = new Set<string>();
    
    photos.forEach((photo) => {
      // Add matching tags
      photo.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag);
        }
      });
      // Add matching title words
      const titleWords = photo.title.split(/\s+/);
      titleWords.forEach((word) => {
        if (word.toLowerCase().includes(query) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 8); // Max 8 suggestions
  }, [searchQuery, photos]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          setSearchQuery(searchSuggestions[selectedSuggestionIndex]);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        !searchInputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Infinite scroll
  const lastPhotoRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, loadMore]
  );

  return (
    <div className="min-h-screen py-8">
      <Lightbox
        images={lightbox.images}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.close}
        onNavigate={lightbox.navigate}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            探索作品
          </h1>
          <p className="text-text-secondary">
            发现来自全球摄影师的精彩作品
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1" ref={suggestionsRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted z-10" />
            <Input
              ref={searchInputRef}
              placeholder="搜索作品、标签..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedSuggestionIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setShowSuggestions(false);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            )}
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      index === selectedSuggestionIndex
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <Search className="w-4 h-4 text-text-muted" />
                    <span className="flex-1">
                      {suggestion.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                          <span key={i} className="text-primary font-medium">
                            {part}
                          </span>
                        ) : (
                          part
                        )
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter className="w-5 h-5 text-text-muted flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Info */}
        {debouncedQuery && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-text-secondary">
              "<span className="text-primary font-medium">{debouncedQuery}</span>" 的搜索结果：
              <span className="text-text-primary font-medium ml-1">
                {filteredPhotos.length} 个作品
              </span>
            </p>
            {filteredPhotos.length === 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                }}
                className="text-sm text-primary hover:underline"
              >
                清除搜索
              </button>
            )}
          </div>
        )}

        {/* Photo Grid - Masonry Layout */}
        {filteredPhotos.length > 0 ? (
          <MasonryGrid columns={{ sm: 2, md: 2, lg: 3 }} gap={24}>
            {filteredPhotos.map((photo, index) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo}
                ref={index === filteredPhotos.length - 1 ? lastPhotoRef : null}
                onOpenLightbox={() => {
                  const imgs: LightboxImage[] = filteredPhotos.map((p) => ({
                    src: p.image_url,
                    alt: p.title,
                    title: p.title,
                  }));
                  lightbox.setImages(imgs);
                  lightbox.open(index, imgs);
                }}
              />
            ))}
          </MasonryGrid>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              没有找到相关作品
            </h3>
            <p className="text-text-secondary">
              尝试使用其他关键词或筛选条件
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* No More */}
        {!hasMore && filteredPhotos.length > 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-text-muted">没有更多作品了</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 作品卡片组件（支持数据同步 + 瀑布流动态高度）
const ASPECT_RATIOS = ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[5/4]'];

const PhotoCard = forwardRef<HTMLDivElement, { photo: any; onOpenLightbox: () => void }>(({ photo, onOpenLightbox }, ref) => {
  // 直接使用 photo 中的数据，不再从 store 获取
  const viewsCount = photo.views_count || 0;
  const likesCount = photo.likes_count || 0;
  
  // 根据图片ID生成动态长宽比
  const aspectRatio = ASPECT_RATIOS[photo.id.charCodeAt(0) % ASPECT_RATIOS.length];
  
  return (
    <div ref={ref} data-testid="photo-card">
      <Card isHoverable className="group">
        <div className="relative">
          <Link to={`/photo/${photo.id}`}>
            <div className={`relative ${aspectRatio} overflow-hidden`}>
              <img
                src={photo.thumbnail_url}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-semibold truncate">
                  {photo.title}
                </h3>
                <p className="text-white/80 text-sm truncate">
                  {photo.description}
                </p>
              </div>
            </div>
          </Link>
          {/* Lightbox button */}
          <button
            onClick={(e) => { e.preventDefault(); onOpenLightbox(); }}
            className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60 hover:text-white transition-all backdrop-blur-sm"
            title="全屏预览"
          >
            <Expand className="w-4 h-4" />
          </button>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Link
              to={`/u/${photo.user?.username}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {photo.user?.avatar_url ? (
                <img
                  src={photo.user.avatar_url}
                  alt={photo.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {photo.user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-text-secondary">
                {photo.user?.username}
              </span>
            </Link>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formatNumber(viewsCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {formatNumber(likesCount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
PhotoCard.displayName = 'PhotoCard';
