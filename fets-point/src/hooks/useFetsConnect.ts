import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

const STALE_TIME = 30000 // 30 seconds

// --- Posts, Likes, and Comments ---

const fetchPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:staff_profiles!posts_author_id_fkey(full_name, avatar_url, role, department),
      likes:post_likes(user_id),
      comments:post_comments(
        *,
        author:staff_profiles!post_comments_author_id_fkey(full_name, avatar_url)
      )
    `)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => fetchPosts(),
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
  })
}

export const usePostMutations = () => {
  const queryClient = useQueryClient()

  const invalidatePosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] })

  const addPost = useMutation({
    mutationFn: async (newPost: { content: string; author_id: string }) => {
      const { error } = await supabase.from('posts').insert(newPost)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Post created!')
      invalidatePosts()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const toggleLike = useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
        if (error) throw error
      }
    },
    onSuccess: () => invalidatePosts(),
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const addComment = useMutation({
    mutationFn: async (newComment: { post_id: string; author_id: string; content: string }) => {
      const { error } = await supabase.from('post_comments').insert(newComment)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Comment added!')
      invalidatePosts()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const updatePost = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { error } = await supabase
        .from('posts')
        .update({ content })
        .eq('id', postId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Post updated!')
      invalidatePosts()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Post deleted!')
      invalidatePosts()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const updateComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { error } = await supabase
        .from('post_comments')
        .update({ content })
        .eq('id', commentId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Comment updated!')
      invalidatePosts()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Comment deleted!')
      invalidatePosts()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  return {
    addPost: addPost.mutateAsync,
    toggleLike: toggleLike.mutateAsync,
    addComment: addComment.mutateAsync,
    updatePost: updatePost.mutateAsync,
    deletePost: deletePost.mutateAsync,
    updateComment: updateComment.mutateAsync,
    deleteComment: deleteComment.mutateAsync,
  }
}

// --- Tasks ---

const fetchTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_tasks')
    .select(`
      *,
      assigned_by:staff_profiles!user_tasks_assigned_by_fkey(full_name)
    `)
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const useTasks = (userId: string) => {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: () => fetchTasks(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
  })
}

export const useTaskMutations = (userId: string) => {
  const queryClient = useQueryClient()

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] })

  const addTask = useMutation({
    mutationFn: async (newTask: { title: string; description?: string; assigned_to: string; assigned_by: string; due_date?: string }) => {
      const { error } = await supabase.from('user_tasks').insert(newTask)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Task created successfully!')
      invalidateTasks()
    },
    onError: (err: Error) => toast.error(`Error creating task: ${err.message}`),
  })

  const updateTask = useMutation({
    mutationFn: async (updatedTask: { id: string; title?: string; description?: string; status?: 'pending' | 'in_progress' | 'completed' }) => {
      const { error } = await supabase.from('user_tasks').update(updatedTask).eq('id', updatedTask.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Task updated!')
      invalidateTasks()
    },
    onError: (err: Error) => toast.error(`Error updating task: ${err.message}`),
  })

  return {
    addTask: addTask.mutateAsync,
    isAdding: addTask.isPending,
    updateTask: updateTask.mutateAsync,
    isUpdating: updateTask.isPending,
  }
}

// --- Staff Profiles for Online List ---

const fetchStaffProfiles = async () => {
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, full_name, avatar_url, role, department')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data || []
}

export const useOnlineStaff = () => {
  return useQuery({
    queryKey: ['staffProfiles'],
    queryFn: () => fetchStaffProfiles(),
    staleTime: STALE_TIME * 5, // Staff list doesn't change often
  })
}

// --- All Staff for Task Assignment ---
const fetchAllStaff = async () => {
  const { data, error } = await supabase.from('staff_profiles').select('id, user_id, full_name, role, avatar_url')
  if (error) throw new Error(error.message)
  return data || []
}

export const useAllStaff = () => {
  return useQuery({
    queryKey: ['allStaff'],
    queryFn: fetchAllStaff,
    staleTime: Infinity, // Staff list is relatively static
  })
}

// --- Kudos ---

const fetchKudos = async () => {
  const { data, error } = await supabase
    .from('kudos')
    .select(`
      *,
      giver:staff_profiles!kudos_giver_id_fkey(full_name, avatar_url),
      receiver:staff_profiles!kudos_receiver_id_fkey(full_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const useKudos = () => {
  return useQuery({
    queryKey: ['kudos'],
    queryFn: fetchKudos,
    staleTime: STALE_TIME,
  })
}

export const useKudosMutations = () => {
  const queryClient = useQueryClient()

  const invalidateKudos = () => queryClient.invalidateQueries({ queryKey: ['kudos'] })

  const addKudos = useMutation({
    mutationFn: async (newKudos: { giver_id: string; receiver_id: string; message: string }) => {
      const { error } = await supabase.from('kudos').insert(newKudos)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Kudos given!')
      invalidateKudos()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  return { addKudos: addKudos.mutateAsync }
}