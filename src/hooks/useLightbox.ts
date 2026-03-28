import { useState, useCallback } from 'react';
import type { LightboxImage } from '../components/ui/Lightbox';

export function useLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<LightboxImage[]>([]);

  const open = useCallback((index: number, imgs?: LightboxImage[]) => {
    if (imgs) setImages(imgs);
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      if (!isOpen) setImages([]);
    }, 300);
  }, [isOpen]);

  const navigate = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const setImagesList = useCallback((imgs: LightboxImage[]) => {
    setImages(imgs);
  }, []);

  return {
    isOpen,
    currentIndex,
    images,
    open,
    close,
    navigate,
    setImages: setImagesList,
  };
}
