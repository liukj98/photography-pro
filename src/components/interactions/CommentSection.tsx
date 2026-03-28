import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useComments } from '../../hooks/useInteractions';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
  photoId: string;
}

export function CommentSection({ photoId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { comments, isLoading, isSubmitting, addComment, deleteComment } =
    useComments(photoId);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { error } = await addComment(newComment);
    if (!error) {
      setNewComment('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="relative">
              <textarea
                rows={3}
                placeholder="写下你的评论..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <Button
                type="submit"
                size="sm"
                isLoading={isSubmitting}
                disabled={!newComment.trim()}
                className="absolute bottom-3 right-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 bg-surface rounded-xl">
          <p className="text-text-secondary">
            请{' '}
            <Link to="/login" className="text-primary hover:text-primary-hover">
              登录
            </Link>{' '}
            后发表评论
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {comment.user?.avatar_url ? (
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                    <span className="text-sm font-medium text-text-secondary">
                      {comment.user?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-surface rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      to={`/u/${comment.user?.username}`}
                      className="font-medium text-text-primary hover:text-primary transition-colors"
                    >
                      {comment.user?.username}
                    </Link>
                    <span className="text-xs text-text-muted">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-text-secondary">{comment.content}</p>
                </div>
                {user?.id === comment.user_id && (
                  <div className="flex gap-2 mt-1 ml-1">
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-xs text-text-muted hover:text-error flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-text-muted">
            <p>还没有评论，来发表第一条评论吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
