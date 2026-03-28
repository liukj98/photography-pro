import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

interface MasonryGridProps {
  children: ReactNode[];
  columns?: { sm?: number; md?: number; lg?: number };
  gap?: number;
  className?: string;
}

export function MasonryGrid({
  children,
  columns = { sm: 2, md: 2, lg: 3 },
  gap = 24,
  className = '',
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(columns.lg || 3);

  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    if (width >= 1024) {
      setColumnCount(columns.lg || 3);
    } else if (width >= 768) {
      setColumnCount(columns.md || 2);
    } else if (width >= 640) {
      setColumnCount(columns.sm || 2);
    } else {
      setColumnCount(1);
    }
  }, [columns]);

  useEffect(() => {
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [updateColumns]);

  // Distribute items across columns based on their rendered heights
  const getColumns = () => {
    const cols: { items: ReactNode[]; heights: number[] }[] = Array.from(
      { length: columnCount },
      () => ({ items: [], heights: [] })
    );

    // For CSS-based masonry, we just split into columns
    const items = Array.isArray(children) ? children : [children];
    items.forEach((child, index) => {
      const colIndex = index % columnCount;
      cols[colIndex].items.push(child);
    });

    return cols;
  };

  const cols = getColumns();

  return (
    <div
      ref={containerRef}
      className={`flex gap-[${gap}px] ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {cols.map((col, colIndex) => (
        <div
          key={colIndex}
          className="flex-1 flex flex-col gap-[${gap}px]"
          style={{ gap: `${gap}px` }}
        >
          {col.items.map((item, itemIndex) => (
            <div key={itemIndex} className="break-inside-avoid">
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
