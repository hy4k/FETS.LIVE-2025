import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  Edit,
  Trash2,
  MoreHorizontal,
  Send,
  FileText,
} from 'lucide-react';
import { usePostMutations } from '../hooks/useFetsConnect';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

const PostCard = ({ post, currentUserProfile }) => {
  const queryClient = useQueryClient()
  const {
    toggleLike,
    addComment,
    updatePost,
    deletePost,
    updateComment,
    deleteComment,
  } = usePostMutations();
  const [comment, setComment] = useState('');
  const isLiked = useMemo(
    () =>
      post.likes?.some((like) => like.user_id === currentUserProfile?.id) ||
      false,
    [post.likes, currentUserProfile?.id]
  );
  const [showAllComments, setShowAllComments] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedPostContent, setEditedPostContent] = useState(post.content);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(
    null
  );
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUserProfile) return;
    try {
      await addComment({
        post_id: post.id,
        author_id: currentUserProfile.id,
        content: comment,
        author: currentUserProfile
      });
      setComment('');
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const handleUpdatePost = async () => {
    if (editedPostContent.trim() === post.content)
      return setIsEditingPost(false);
    await updatePost({ postId: post.id, content: editedPostContent });
    setIsEditingPost(false);
  };

  const handleUpdateComment = async (commentId: string) => {
    await updateComment({ commentId, content: editedCommentContent });
    setEditingCommentId(null);
    setEditedCommentContent('');
  };

  const renderAttachments = () => {
    if (!post.attachments || post.attachments.length === 0) return null;
    
    const attachments = typeof post.attachments === 'string' 
      ? JSON.parse(post.attachments) 
      : post.attachments;
    
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {attachments.map((file: any, index: number) => {
          if (file.type?.startsWith('image/')) {
            return (
              <a 
                key={index}
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img 
                  src={file.url} 
                  alt={file.name} 
                  className="w-full h-48 object-cover"
                />
              </a>
            );
          }
          
          return (
            <a
              key={index}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <FileText className="w-5 h-5 text-slate-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {file.size ? (file.size / 1024).toFixed(1) + ' KB' : ''}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-slate-200"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <img
            src={
              post.author?.avatar_url ||
              `https://ui-avatars.com/api/?name=${post.author?.full_name}&background=random`
            }
            alt={post.author?.full_name}
            className="w-11 h-11 rounded-full"
          />
          <div>
            <p className="font-bold text-slate-800">
              {post.author?.full_name}
            </p>
            <p className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {post.pinned && <Pin className="w-4 h-4 text-yellow-500" />}
            {post.author_id === currentUserProfile?.id && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <MoreHorizontal className="w-5 h-5 text-slate-500" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                    <button
                      onClick={() => {
                        setIsEditingPost(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {isEditingPost ? (
          <div className="my-4">
            <textarea
              value={editedPostContent}
              onChange={(e) => setEditedPostContent(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md"
              rows={3}
            ></textarea>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsEditingPost(false)}
                className="px-3 py-1 text-sm bg-slate-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePost}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="my-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
            {renderAttachments()}
          </>
        )}
      </div>
      <div className="px-5 py-2 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
        <div>
          {(post.likes?.length || 0) > 0 &&
            `${post.likes.length} ${
              post.likes.length === 1 ? 'like' : 'likes'
            }`}
        </div>
        <div>
          {(post.comments?.length || 0) > 0 &&
            `${post.comments.length} ${
              post.comments.length === 1 ? 'comment' : 'comments'
            }`}
        </div>
      </div>
      <div className="px-5 py-2 border-t border-slate-200 flex justify-around">
        <button
          onClick={() =>
            currentUserProfile &&
            toggleLike({
              postId: post.id,
              userId: currentUserProfile.id,
              isLiked,
            })
          }
          className={`flex items-center gap-2 p-2 rounded-lg w-full justify-center hover:bg-slate-100 font-semibold transition-colors ${
            isLiked ? 'text-blue-600' : 'text-slate-600'
          }`}
        >
          <ThumbsUp
            className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
          />{' '}
          {isLiked ? 'Liked' : 'Like'}
        </button>
        <button className="flex items-center gap-2 p-2 rounded-lg w-full justify-center hover:bg-slate-100 font-semibold text-slate-600">
          <MessageSquare className="w-5 h-5" /> Comment
        </button>
      </div>
      <div className="p-5 border-t border-slate-200 bg-slate-50/70">
        {/* Comments List */}
        {(post.comments?.length || 0) > 0 && (
          <div className="space-y-4 mb-4">
            {(showAllComments
              ? post.comments
              : post.comments.slice(0, 2)
            ).map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <img
                  src={
                    comment.author?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${comment.author?.full_name}&background=random`
                  }
                  alt={comment.author?.full_name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="bg-slate-200 p-3 rounded-lg text-sm flex-1 group relative">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-800">
                      {comment.author?.full_name}
                    </p>
                    {comment.author_id === currentUserProfile?.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditedCommentContent(comment.content);
                          }}
                          className="p-1 hover:bg-slate-300 rounded-full"
                        >
                          <Edit className="w-3 h-3 text-slate-600" />
                        </button>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="p-1 hover:bg-slate-300 rounded-full"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={editedCommentContent}
                        onChange={(e) =>
                          setEditedCommentContent(e.target.value)
                        }
                        className="w-full p-1 border border-slate-300 rounded-md text-sm"
                      />
                      <div className="flex justify-end gap-1 mt-1">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-2 py-0.5 text-xs bg-slate-300 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateComment(comment.id)}
                          className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-md"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-700">{comment.content}</p>
                  )}
                </div>
              </div>
            ))}
            {post.comments.length > 2 && (
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                {showAllComments
                  ? 'Show fewer comments'
                  : `View all ${post.comments.length} comments`}
              </button>
            )}
          </div>
        )}
        {/* Comment Input */}
        <form onSubmit={handleComment} className="flex items-center gap-3">
          <img
            src={
              currentUserProfile?.avatar_url ||
              `https://ui-avatars.com/api/?name=${currentUserProfile?.full_name}&background=random`
            }
            alt="Your avatar"
            className="w-9 h-9 rounded-full"
          />
          <div className="relative flex-1">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-white p-3 border border-slate-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!comment.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default PostCard;
