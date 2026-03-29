import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  tutorials,
  tutorialCategories,
  getDifficultyLabel,
  type TutorialCategory,
} from '../lib/tutorials';
import { cn } from '../lib/utils';
import { Clock, ChevronRight } from 'lucide-react';

export function Tutorials() {
  const [activeCategory, setActiveCategory] = useState<TutorialCategory | 'all'>('all');

  const filteredTutorials =
    activeCategory === 'all'
      ? tutorials
      : tutorials.filter((t) => t.category === activeCategory);

  const activeCategoryInfo = tutorialCategories.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight">
              摄影教程
            </h1>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              从相机基础知识到进阶拍摄技巧，系统化学习摄影的核心概念。
              每篇教程都配有实用建议和示例，帮助你提升摄影水平。
            </p>
          </div>

          {/* Stats */}
          <div className="mt-8 flex gap-8">
            <div>
              <div className="text-2xl font-bold text-primary">{tutorials.length}</div>
              <div className="text-sm text-text-muted">篇教程</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{tutorialCategories.length}</div>
              <div className="text-sm text-text-muted">个分类</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {tutorials.reduce((sum, t) => sum + t.readTime, 0)}
              </div>
              <div className="text-sm text-text-muted">分钟内容</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-5 py-2.5 text-sm font-medium rounded-xl transition-all',
              activeCategory === 'all'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border'
            )}
          >
            全部教程
          </button>
          {tutorialCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-5 py-2.5 text-sm font-medium rounded-xl transition-all',
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border'
              )}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Category Description */}
      {activeCategoryInfo && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-surface rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{activeCategoryInfo.emoji}</span>
              <h2 className="text-xl font-bold text-text-primary">{activeCategoryInfo.label}</h2>
            </div>
            <p className="text-text-secondary">{activeCategoryInfo.description}</p>
          </div>
        </section>
      )}

      {/* Tutorial Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <Link
              key={tutorial.slug}
              to={`/tutorials/${tutorial.slug}`}
              className="group bg-surface rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              {/* Cover */}
              <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span className="text-6xl">{tutorial.coverEmoji}</span>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                    {getDifficultyLabel(tutorial.difficulty)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {tutorial.readTime} 分钟
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors mb-2">
                  {tutorial.title}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {tutorial.description}
                </p>

                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  阅读教程
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredTutorials.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-muted">暂无该分类的教程</p>
          </div>
        )}
      </section>
    </div>
  );
}
