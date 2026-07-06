import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { seedFeedPosts } from '../data/feedSeed';
import { isSupabaseConfigured } from '../lib/env';
import {
  addFeedPostComment,
  deleteFeedPost,
  fetchAllFeedPosts,
  subscribeToFeedPosts,
  toggleFeedPostLike,
  upsertFeedPost,
} from '../lib/supabase/feedRepository';
import { fetchAvatarUrlsByEmails } from '../lib/supabase/profileRepository';
import { uploadUserImage } from '../lib/supabase/storageRepository';
import type { CreatePostInput, FeedPost } from '../types';
import { useAuth } from './AuthContext';

type FeedContextValue = {
  posts: FeedPost[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  feedError: string | null;
  clearFeedError: () => void;
  isLiveFeed: boolean;
  toggleLike: (postId: string, userEmail: string) => void;
  isLiked: (postId: string, userEmail: string) => boolean;
  addComment: (postId: string, user: { email: string; name: string }, text: string) => void;
  createPost: (
    input: CreatePostInput,
    author: { email: string; name: string },
  ) => Promise<FeedPost>;
  deletePost: (postId: string, userEmail: string) => Promise<boolean>;
  getAuthorAvatar: (email: string) => string | undefined;
  getUserPostCount: (email: string) => number;
};

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabaseOn = isSupabaseConfigured();
  const useRemoteFeed = supabaseOn;
  const useRemoteWrite = supabaseOn && !!user;

  const [dbPosts, setDbPosts] = useState<FeedPost[]>([]);
  const [userPosts, setUserPosts] = useState<FeedPost[]>([]);
  const [overrides, setOverrides] = useState<Record<string, FeedPost>>({});
  const [avatarByEmail, setAvatarByEmail] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(useRemoteFeed);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const clearFeedError = useCallback(() => setFeedError(null), []);

  const refresh = useCallback(async () => {
    if (!useRemoteFeed) return;
    setRefreshing(true);
    try {
      const list = await fetchAllFeedPosts();
      setDbPosts(list);
    } finally {
      setRefreshing(false);
    }
  }, [useRemoteFeed]);

  useEffect(() => {
    if (!useRemoteFeed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchAllFeedPosts().then((list) => {
      setDbPosts(list);
      setLoading(false);
    });
  }, [useRemoteFeed]);

  useEffect(() => {
    if (!useRemoteFeed) return;
    return subscribeToFeedPosts(
      (post) => {
        setDbPosts((prev) => {
          const idx = prev.findIndex((p) => p.id === post.id);
          if (idx < 0) return [post, ...prev];
          const next = [...prev];
          next[idx] = post;
          return next;
        });
      },
      (postId) => {
        setDbPosts((prev) => prev.filter((p) => p.id !== postId));
      },
    );
  }, [useRemoteFeed]);

  const posts = useMemo(() => {
    if (useRemoteFeed) {
      return [...dbPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    const merged = [
      ...userPosts,
      ...seedFeedPosts.map((post) => overrides[post.id] ?? post),
    ];
    return [...merged].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [useRemoteFeed, dbPosts, userPosts, overrides]);

  useEffect(() => {
    if (!useRemoteFeed || !posts.length) return;
    const emails = [...new Set(posts.map((p) => p.authorEmail))];
    void fetchAvatarUrlsByEmails(emails).then((map) => {
      if (Object.keys(map).length) {
        setAvatarByEmail((prev) => ({ ...prev, ...map }));
      }
    });
  }, [useRemoteFeed, posts]);

  const updateDbPost = useCallback((postId: string, next: FeedPost) => {
    setDbPosts((prev) => prev.map((p) => (p.id === postId ? next : p)));
  }, []);

  const persistSeedOverride = useCallback((post: FeedPost) => {
    setOverrides((prev) => ({ ...prev, [post.id]: { ...post, isSeed: false } }));
  }, []);

  const updateUserPost = useCallback((postId: string, updater: (post: FeedPost) => FeedPost) => {
    setUserPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === postId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = updater(next[idx]);
      return next;
    });
  }, []);

  const toggleLike = useCallback(
    (postId: string, userEmail: string) => {
      if (useRemoteWrite) {
        void toggleFeedPostLike(postId).then((result) => {
          if ('post' in result) updateDbPost(postId, result.post);
          else setFeedError(result.error);
        });
        return;
      }

      const stored = userPosts.find((p) => p.id === postId);
      if (stored) {
        updateUserPost(postId, (post) => {
          const likes = post.likes.includes(userEmail)
            ? post.likes.filter((e) => e !== userEmail)
            : [...post.likes, userEmail];
          return { ...post, likes };
        });
        return;
      }

      const seed = seedFeedPosts.find((p) => p.id === postId);
      if (!seed) return;
      const current = overrides[postId] ?? seed;
      const likes = current.likes.includes(userEmail)
        ? current.likes.filter((e) => e !== userEmail)
        : [...current.likes, userEmail];
      persistSeedOverride({ ...current, likes });
    },
    [useRemoteWrite, userPosts, overrides, updateUserPost, persistSeedOverride, updateDbPost],
  );

  const isLiked = useCallback(
    (postId: string, userEmail: string) => {
      const post = posts.find((p) => p.id === postId);
      return post?.likes.includes(userEmail) ?? false;
    },
    [posts],
  );

  const addComment = useCallback(
    (postId: string, author: { email: string; name: string }, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (useRemoteWrite) {
        void addFeedPostComment(postId, trimmed, author.name).then((result) => {
          if ('post' in result) updateDbPost(postId, result.post);
          else setFeedError(result.error);
        });
        return;
      }

      const comment = {
        id: `c_${Date.now()}`,
        authorEmail: author.email,
        authorName: author.name,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      if (userPosts.some((p) => p.id === postId)) {
        updateUserPost(postId, (post) => ({
          ...post,
          comments: [...post.comments, comment],
        }));
        return;
      }

      const seed = seedFeedPosts.find((p) => p.id === postId);
      if (!seed) return;
      const current = overrides[postId] ?? seed;
      persistSeedOverride({
        ...current,
        comments: [...current.comments, comment],
      });
    },
    [useRemoteWrite, userPosts, overrides, updateUserPost, persistSeedOverride, updateDbPost],
  );

  const createPost = useCallback(
    async (input: CreatePostInput, author: { email: string; name: string }) => {
      let imageUrl = input.imageUrl?.trim();
      if (!imageUrl) {
        throw new Error('Sube al menos una foto para publicar.');
      }

      if (useRemoteWrite && user?.id) {
        imageUrl = await uploadUserImage(user.id, 'posts', imageUrl);
      }

      const post: FeedPost = {
        id: `post_${Date.now()}`,
        authorEmail: author.email,
        authorName: author.name,
        imageUrl,
        caption: input.caption.trim(),
        routeTitle: input.routeTitle?.trim() || undefined,
        vehicleLabel: input.vehicleLabel?.trim() || undefined,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
      };

      if (useRemoteWrite) {
        const ok = await upsertFeedPost(post);
        if (!ok) throw new Error('No se pudo guardar la publicación.');
        setDbPosts((prev) => [post, ...prev]);
      } else {
        setUserPosts((prev) => [post, ...prev]);
      }

      return post;
    },
    [useRemoteWrite, user?.id],
  );

  const deletePost = useCallback(
    async (postId: string, userEmail: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post || post.authorEmail.toLowerCase() !== userEmail.toLowerCase()) return false;

      if (useRemoteWrite) {
        const ok = await deleteFeedPost(postId);
        if (ok) {
          setDbPosts((prev) => prev.filter((p) => p.id !== postId));
          return true;
        }
        setFeedError('No se pudo eliminar la publicación.');
        return false;
      }

      if (userPosts.some((p) => p.id === postId)) {
        setUserPosts((prev) => prev.filter((p) => p.id !== postId));
        return true;
      }
      return false;
    },
    [useRemoteWrite, posts, userPosts],
  );

  const getAuthorAvatar = useCallback(
    (email: string) => {
      const key = email.toLowerCase();
      return avatarByEmail[key] ?? avatarByEmail[email];
    },
    [avatarByEmail],
  );

  const getUserPostCount = useCallback(
    (email: string) => posts.filter((p) => p.authorEmail === email).length,
    [posts],
  );

  const value = useMemo(
    () => ({
      posts,
      loading,
      refreshing,
      refresh,
      feedError,
      clearFeedError,
      isLiveFeed: useRemoteFeed,
      toggleLike,
      isLiked,
      addComment,
      createPost,
      deletePost,
      getAuthorAvatar,
      getUserPostCount,
    }),
    [
      posts,
      loading,
      refreshing,
      refresh,
      feedError,
      clearFeedError,
      useRemoteFeed,
      toggleLike,
      isLiked,
      addComment,
      createPost,
      deletePost,
      getAuthorAvatar,
      getUserPostCount,
    ],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed(): FeedContextValue {
  const ctx = useContext(FeedContext);
  if (!ctx) {
    throw new Error('useFeed debe usarse dentro de FeedProvider');
  }
  return ctx;
}
