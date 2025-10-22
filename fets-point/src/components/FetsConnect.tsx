import React, { useState, useMemo, useEffect } from 'react';
import {
  Rss,
  MessageSquare,
  CheckSquare,
  Users,
  Paperclip,
  Send,
  Smile,
  ThumbsUp,
  Pin,
  Plus,
  X,
  Award,
  Star,
  Edit,
  Trash2,
  MoreHorizontal,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePosts,
  usePostMutations,
  useTasks,
  useOnlineStaff,
  useTaskMutations,
  useAllStaff,
  useKudos,
  useKudosMutations,
} from '../hooks/useFetsConnect';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import TaskBoard from './TaskBoard';
import Chat from './Chat/Chat';

interface FetsConnectProps {
  onNavigate?: (tab: string) => void;
}

const FetsConnect = ({ onNavigate }: FetsConnectProps = {}) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // --- Data Fetching with React Query ---
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: kudos = [], isLoading: isLoadingKudos } = useKudos();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(profile?.id);
  const { data: allStaff = [] } = useAllStaff();
  const { data: onlineStaff = [], isLoading: isLoadingStaff } = useOnlineStaff();
  const { addPost } = usePostMutations(queryClient);
  const { addTask, updateTask } = useTaskMutations(profile?.id, queryClient);
  const { addKudos } = useKudosMutations(queryClient);

  // --- Local UI State ---
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'tasks', 'chat', 'kudos'

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Kudos Modal State
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);

  const handlePostSubmit = async () => {
    if (!newPostContent.trim() || !profile) return;
    try {
      await addPost({
        content: newPostContent,
        author_id: profile.id,
      });
      setNewPostContent('');
    } catch (error) {
      console.error('Error posting:', error);
      toast.error('Failed to post. Please try again.');
    }
  };

  const openTaskModal = (task = null) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  return (
    <div className="h-full w-full grid grid-cols-12 bg-slate-50 font-sans">
      {/* Left Panel: Navigation & My Tasks */}
      <aside className="col-span-3 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">FETS Connect</h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'feed'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Rss className="w-5 h-5" /> Feed
          </button>
          <button
            onClick={() => setActiveTab('kudos')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'kudos'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-5 h-5" /> Kudos Board
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-5 h-5" /> Task Board
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-5 h-5" /> Chat
          </button>
        </nav>

        <div className="mt-6 space-y-3">
          {profile?.role === 'super_admin' && (
            <button
              onClick={() => openTaskModal()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" /> Assign Task
            </button>
          )}
          <button
            onClick={() => setIsKudosModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-md"
          >
            <Star className="w-5 h-5" /> Give Kudos
          </button>
        </div>

        {/* My Tasks Widget */}
        <div className="flex-1 bg-slate-100 rounded-xl p-4 mt-8 overflow-y-auto">
          <h2 className="font-bold text-slate-800 mb-4">My Tasks</h2>
          {isLoadingTasks ? (
            <p>Loading tasks...</p>
          ) : (
            <ul className="space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <li
                    key={task.id}
                    onClick={() => openTaskModal(task)}
                    className="bg-white p-3 rounded-lg text-sm cursor-pointer hover:bg-slate-50 shadow-sm border border-slate-200"
                  >
                    <p className="font-semibold text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Assigned by: {task.assigned_by?.full_name}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-center text-slate-500 text-sm italic mt-4">
                  No tasks assigned.
                </p>
              )}
            </ul>
          )}
        </div>
      </aside>

      {/* Center Panel: Main Content */}
      <main className="col-span-9 flex flex-col bg-slate-100 border-r border-slate-200">
        {activeTab === 'feed' && (
          <div className="overflow-y-auto p-8">
            {/* Post Creator */}
            <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200 mb-8">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={`What's happening, ${profile?.full_name}?`}
                className="w-full p-2 border-none focus:ring-0 resize-none text-base text-slate-700 placeholder-slate-400"
                rows="3"
              ></textarea>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handlePostSubmit}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all shadow-md disabled:bg-slate-300"
                  disabled={!newPostContent.trim()}
                >
                  Post
                </button>
              </div>
            </div>
            {/* Posts Feed */}
            {isLoadingPosts ? (
              <p className="text-center text-slate-500">Loading feed...</p>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserProfile={profile}
                    queryClient={queryClient}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'kudos' && (
          <KudosBoard kudos={kudos} isLoading={isLoadingKudos} />
        )}
        {activeTab === 'tasks' && <TaskBoard />}
        {activeTab === 'chat' && <Chat />}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isTaskModalOpen && profile && (
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={closeTaskModal}
            task={selectedTask}
            currentUserProfile={profile}
            staffList={allStaff}
          />
        )}
        {isKudosModalOpen && (
          <KudosModal
            isOpen={isKudosModalOpen}
            onClose={() => setIsKudosModalOpen(false)}
            currentUserProfile={profile}
            staffList={allStaff}
            addKudos={addKudos}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const PostCard = ({ post, currentUserProfile, queryClient }) => {
  const {
    toggleLike,
    addComment,
    updatePost,
    deletePost,
    updateComment,
    deleteComment,
  } = usePostMutations(queryClient);
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
          <p className="my-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
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

const KudosBoard = ({ kudos, isLoading }) => {
  if (isLoading)
    return <p className="text-center p-8 text-slate-500">Loading Kudos...</p>;
  return (
    <div className="p-8 space-y-6">
      {kudos.map((kudo) => (
        <motion.div
          key={kudo.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-300 to-amber-400 p-6 rounded-xl shadow-lg text-slate-800"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white/50 p-3 rounded-full">
              <Award className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg">
                <span className="font-bold">{kudo.giver?.full_name}</span> gave
                kudos to{' '}
                <span className="font-bold">{kudo.receiver?.full_name}</span>
              </p>
              <p className="mt-2 text-xl font-semibold italic">
                "{kudo.message}"
              </p>
              <p className="text-right text-xs text-slate-700 mt-4">
                {formatDistanceToNow(new Date(kudo.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

import TaskModal from './TaskModal';
import KudosModal from './KudosModal';

export default FetsConnect;
