import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Image as ImageIcon, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  useSocialPosts,
  useCurrentUser,
  useCreatePost,
  useToggleLike,
  useAddComment,
  useDeletePost,
  useUploadImage,
} from '../hooks/useSocial';
import { supabase } from '../lib/supabase';

const FetsConnectNew: React.FC = () => {
  const { data: posts = [], isLoading } = useSocialPosts();
  const { data: currentUser } = useCurrentUser();
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();
  const addComment = useAddComment();
  const deletePost = useDeletePost();
  const uploadImage = useUploadImage();

  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current profile for UI checks
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('staff_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (profile) {
          setCurrentProfileId(profile.id);
        }
      }
    };
    loadCurrentProfile();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('social-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_posts' }, () => {
        // Refresh posts when changes occur
        window.location.reload();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !selectedImage) {
      toast.error('Please enter some text or select an image');
      return;
    }
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to post');
      return;
    }

    // Get user profile to use profile.id as user_id
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      toast.error('Profile not found. Please log in again.');
      return;
    }

    let imageUrl: string | undefined;

    if (selectedImage) {
      console.log('📤 Starting image upload...');
      toast.loading('Uploading image...', { id: 'upload' });
      try {
        imageUrl = await uploadImage.mutateAsync(selectedImage);
        console.log('✅ Image uploaded:', imageUrl);
        toast.success('Image uploaded!', { id: 'upload' });
      } catch (error: any) {
        console.error('❌ Upload failed:', error);
        toast.error('Image upload failed. Posting text only.', { id: 'upload' });
        imageUrl = undefined;
      }
    }

    try {
      await createPost.mutateAsync({
        content: postContent || 'Post',
        image_url: imageUrl,
        user_id: profile.id, // Use profile.id, not auth user id
      });

      setPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error('Post creation error:', error);
      toast.error(error.message || 'Failed to create post. Please try again.');
    }
  };

  const handleToggleLike = async (postId: string) => {
    // Get current user profile ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    const post = posts.find(p => p.id === postId);
    const isLiked = post?.likes?.some(like => like.user_id === profile.id) || false;

    toggleLike.mutate({
      post_id: postId,
      user_id: profile.id,
      isLiked,
    });
  };

  const handleAddComment = async (postId: string) => {
    const content = commentTexts[postId]?.trim();
    if (!content) return;

    // Get current user profile ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    addComment.mutate({
      post_id: postId,
      user_id: profile.id,
      content,
    });

    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading FETS Connect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">FC</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FETS Connect
              </h1>
              <p className="text-sm text-gray-500">Share your moments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Create Post Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                rows={3}
              />

              {imagePreview && (
                <div className="mt-3 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Photo</span>
                </button>

                <button
                  onClick={handleCreatePost}
                  disabled={(!postContent.trim() && !selectedImage) || createPost.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  {createPost.isPending ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Posts Feed */}
        <AnimatePresence>
          {posts.map((post, index) => {
            const isLiked = post.likes?.some(like => like.user_id === currentProfileId) || false;
            const showComments = expandedComments[post.id] || false;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
              >
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md">
                        {post.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{post.user?.full_name || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">{post.user?.role || 'Staff'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {currentProfileId === post.user_id && (
                      <button
                        onClick={() => deletePost.mutate(post.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="mt-4 text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="mt-4 w-full rounded-xl object-cover max-h-96"
                    />
                  )}
                </div>

                {/* Post Stats */}
                <div className="px-6 py-2 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
                  <span>{post._count?.likes || 0} likes</span>
                  <span>{post._count?.comments || 0} comments</span>
                </div>

                {/* Post Actions */}
                <div className="px-6 py-3 border-t border-gray-100 flex gap-4">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
                      isLiked
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                  </button>

                  <button
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Comment</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    {/* Existing Comments */}
                    <div className="space-y-3 mb-4">
                      {post.comments?.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-semibold shadow">
                            {comment.user?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
                            <p className="font-semibold text-sm text-gray-900">{comment.user?.full_name}</p>
                            <p className="text-gray-700 mt-1">{comment.content}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentTexts[post.id] || ''}
                        onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Write a comment..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentTexts[post.id]?.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FetsConnectNew;
