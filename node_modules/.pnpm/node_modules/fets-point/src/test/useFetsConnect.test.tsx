
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePostMutations } from '../hooks/useFetsConnect';
import { supabase } from '../lib/supabase';

// Mock the supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      delete: vi.fn(() => ({
        match: vi.fn(),
      })),
    })),
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePostMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a post', async () => {
    const { result } = renderHook(() => usePostMutations(), { wrapper });
    const { addPost } = result.current;

    const newPost = { content: 'Test Post', author_id: '123' };
    
    const fromMock = vi.mocked(supabase.from);
    const insertMock = vi.fn().mockResolvedValueOnce({ error: null });
    fromMock.mockReturnValue({ insert: insertMock } as any);

    await addPost(newPost);

    expect(fromMock).toHaveBeenCalledWith('posts');
    expect(insertMock).toHaveBeenCalledWith(newPost);
  });

  it('should toggle a like', async () => {
    const { result } = renderHook(() => usePostMutations(), { wrapper });
    const { toggleLike } = result.current;

    const likeData = { postId: 'post-1', userId: 'user-1', isLiked: false };
    
    const fromMock = vi.mocked(supabase.from);
    const insertMock = vi.fn().mockResolvedValueOnce({ error: null });
    fromMock.mockReturnValue({ insert: insertMock } as any);

    await toggleLike(likeData);

    expect(fromMock).toHaveBeenCalledWith('post_likes');
    expect(insertMock).toHaveBeenCalledWith({ post_id: likeData.postId, user_id: likeData.userId });
  });

  it('should remove a like', async () => {
    const { result } = renderHook(() => usePostMutations(), { wrapper });
    const { toggleLike } = result.current;

    const likeData = { postId: 'post-1', userId: 'user-1', isLiked: true };
    
    const fromMock = vi.mocked(supabase.from);
    const deleteMock = vi.fn().mockReturnThis();
    const matchMock = vi.fn().mockResolvedValueOnce({ error: null });
    fromMock.mockReturnValue({ delete: deleteMock, match: matchMock } as any);

    await toggleLike(likeData);

    expect(fromMock).toHaveBeenCalledWith('post_likes');
    expect(deleteMock).toHaveBeenCalled();
    expect(matchMock).toHaveBeenCalledWith({ post_id: likeData.postId, user_id: likeData.userId });
  });

  it('should add a comment', async () => {
    const { result } = renderHook(() => usePostMutations(), { wrapper });
    const { addComment } = result.current;

    const newComment = { post_id: 'post-1', author_id: 'user-1', content: 'Test comment' };
    
    const fromMock = vi.mocked(supabase.from);
    const insertMock = vi.fn().mockResolvedValueOnce({ error: null });
    fromMock.mockReturnValue({ insert: insertMock } as any);

    await addComment(newComment);

    expect(fromMock).toHaveBeenCalledWith('post_comments');
    expect(insertMock).toHaveBeenCalledWith(newComment);
  });
});
