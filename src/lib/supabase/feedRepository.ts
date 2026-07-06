import type { FeedPost } from '../../types';
import { tryGetSupabase } from './client';

type FeedRow = {
  id: string;
  data: FeedPost;
  author_email: string;
  created_at: string;
};

export function feedFromRow(row: FeedRow): FeedPost {
  return {
    ...row.data,
    id: row.id,
    authorEmail: row.data.authorEmail ?? row.author_email,
    createdAt: row.data.createdAt ?? row.created_at,
    likes: row.data.likes ?? [],
    comments: row.data.comments ?? [],
  };
}

export function feedToRow(post: FeedPost) {
  return {
    id: post.id,
    data: post,
    author_email: post.authorEmail.toLowerCase(),
    created_at: post.createdAt,
  };
}

function feedFromRpc(data: FeedPost & { id?: string; createdAt?: string }): FeedPost {
  return {
    ...data,
    id: data.id!,
    likes: data.likes ?? [],
    comments: data.comments ?? [],
  };
}

export async function fetchAllFeedPosts(): Promise<FeedPost[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('feed_posts')
    .select('id, data, author_email, created_at')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => feedFromRow(row as FeedRow));
}

export async function upsertFeedPost(post: FeedPost): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('feed_posts').upsert(feedToRow(post));
  return !error;
}

export async function toggleFeedPostLike(
  postId: string,
): Promise<{ post: FeedPost } | { error: string }> {
  const sb = tryGetSupabase();
  if (!sb) return { error: 'Supabase no configurado' };
  const { data, error } = await sb.rpc('toggle_feed_post_like', { p_post_id: postId });
  if (error) return { error: error.message };
  if (!data) return { error: 'No se pudo actualizar el like' };
  return { post: feedFromRpc(data as FeedPost) };
}

export async function addFeedPostComment(
  postId: string,
  text: string,
  authorName: string,
): Promise<{ post: FeedPost } | { error: string }> {
  const sb = tryGetSupabase();
  if (!sb) return { error: 'Supabase no configurado' };
  const { data, error } = await sb.rpc('add_feed_post_comment', {
    p_post_id: postId,
    p_text: text,
    p_author_name: authorName,
  });
  if (error) return { error: error.message };
  if (!data) return { error: 'No se pudo guardar el comentario' };
  return { post: feedFromRpc(data as FeedPost) };
}

export async function deleteFeedPost(postId: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('feed_posts').delete().eq('id', postId);
  return !error;
}

export function subscribeToFeedPosts(
  onChange: (post: FeedPost) => void,
  onDelete?: (postId: string) => void,
): () => void {
  const sb = tryGetSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel('feed-posts-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'feed_posts' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as { id?: string } | undefined;
          if (old?.id) onDelete?.(old.id);
          return;
        }
        const row = payload.new as FeedRow | undefined;
        if (row?.data) onChange(feedFromRow(row));
      },
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}
