import { useParams, Link } from 'react-router-dom';
import { getTutorialBySlug, getTutorialsByCategory, getDifficultyLabel, tutorialCategories } from '../lib/tutorials';
import { ArrowLeft, Clock, BookOpen, Lightbulb } from 'lucide-react';
import { ExposureSimulator } from '../components/ui/ExposureSimulator';

export function TutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const tutorial = getTutorialBySlug(slug || '');

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted text-lg">教程未找到</p>
          <Link to="/tutorials" className="text-primary hover:underline mt-2 inline-block">
            返回教程列表
          </Link>
        </div>
      </div>
    );
  }

  const category = tutorialCategories.find((c) => c.id === tutorial.category);
  const relatedTutorials = getTutorialsByCategory(tutorial.category).filter(
    (t) => t.slug !== tutorial.slug
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
            <Link to="/tutorials" className="hover:text-text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              教程
            </Link>
            <span>/</span>
            <span>{category?.label}</span>
            <span>/</span>
            <span className="text-text-primary">{tutorial.title}</span>
          </div>

          {/* Title */}
          <div className="flex items-start gap-4">
            <span className="text-5xl">{tutorial.coverEmoji}</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                {tutorial.title}
              </h1>
              <p className="mt-3 text-lg text-text-secondary">{tutorial.description}</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                  {getDifficultyLabel(tutorial.difficulty)}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Clock className="w-4 h-4" />
                  {tutorial.readTime} 分钟阅读
                </span>
                <span className="flex items-center gap-1.5 text-sm text-text-muted">
                  <BookOpen className="w-4 h-4" />
                  {tutorial.sections.length} 个章节
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-10">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Table of Contents */}
            <div className="bg-surface rounded-2xl border border-border p-6 mb-10">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                目录
              </h2>
              <ol className="space-y-2">
                {tutorial.sections.map((section, i) => (
                  <li key={i}>
                    <a
                      href={`#section-${i}`}
                      className="text-text-secondary hover:text-primary transition-colors text-sm leading-relaxed"
                    >
                      {i + 1}. {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* Exposure Simulator for exposure triangle tutorial */}
            {tutorial.slug === 'exposure-triangle' && (
              <div className="mb-10">
                <ExposureSimulator />
              </div>
            )}

            {/* Sections */}
            <article className="space-y-12">
              {tutorial.sections.map((section, i) => (
                <section key={i} id={`section-${i}`} className="scroll-mt-24">
                  <h2 className="text-2xl font-bold text-text-primary mb-4 pb-3 border-b border-border">
                    {section.title}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    {section.content.split('\n').map((paragraph, pi) => {
                      if (!paragraph.trim()) return <br key={pi} />;
                      // Table rendering
                      if (paragraph.startsWith('|') && paragraph.endsWith('|')) {
                        return null; // handled below
                      }
                      return (
                        <p
                          key={pi}
                          className="text-text-secondary leading-relaxed mb-4"
                        >
                          {renderFormattedText(paragraph)}
                        </p>
                      );
                    })}
                    {/* Render tables */}
                    {renderTable(section.content)}
                  </div>

                  {/* Tip */}
                  {section.tip && (
                    <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-primary mb-1">
                            实用技巧
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {section.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </article>

            {/* Navigation */}
            <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
              <Link
                to="/tutorials"
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                返回全部教程
              </Link>
            </div>
          </div>

          {/* Sidebar - Related */}
          {relatedTutorials.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                  相关教程
                </h3>
                <div className="space-y-3">
                  {relatedTutorials.slice(0, 5).map((related) => (
                    <Link
                      key={related.slug}
                      to={`/tutorials/${related.slug}`}
                      className="block bg-surface rounded-xl border border-border p-3 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{related.coverEmoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {related.title}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {related.readTime} 分钟
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Category card */}
                {category && (
                  <div className="mt-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 border border-primary/10">
                    <div className="text-3xl mb-2">{category.emoji}</div>
                    <h4 className="font-semibold text-text-primary">{category.label}</h4>
                    <p className="text-sm text-text-secondary mt-1">{category.description}</p>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/** Render bold and inline code within text */
function renderFormattedText(text: string): React.ReactNode {
  // Split by **bold** and `code` patterns
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Bold
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`b${key++}`} className="text-text-primary font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/** Render markdown-like tables */
function renderTable(content: string) {
  const lines = content.split('\n');
  const tableLines = lines.filter((l) => l.trimStart().startsWith('|') && l.trimEnd().endsWith('|'));

  if (tableLines.length < 2) return null;

  // Check if it's a separator row (like |---|---|)
  const isSeparator = (line: string) => /^\|[\s\-:|]+\|$/.test(line.trim());

  const rows = tableLines
    .filter((l) => !isSeparator(l))
    .map((line) =>
      line
        .split('|')
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
        .map((cell) => cell.trim())
    );

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-surface">
            {rows[0].map((cell, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-text-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
