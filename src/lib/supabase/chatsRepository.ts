import type { RouteChat } from '../../types';
import { tryGetSupabase } from './client';

type ChatRow = { id: string; data: RouteChat; updated_at: string };

export function chatFromRow(row: ChatRow): RouteChat {
  return { ...row.data, id: row.id, updatedAt: row.updated_at ?? row.data.updatedAt };
}

export function chatToRow(chat: RouteChat) {
  return {
    id: chat.id,
    data: chat,
    updated_at: chat.updatedAt,
  };
}

export async function fetchAllChats(): Promise<RouteChat[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('chats').select('id, data, updated_at').order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => chatFromRow(row as ChatRow));
}

export async function upsertChat(chat: RouteChat): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('chats').upsert(chatToRow(chat));
  return !error;
}

export async function deleteChatById(chatId: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('chats').delete().eq('id', chatId);
  return !error;
}

export async function fetchChatReadsForUser(email: string): Promise<Record<string, string>> {
  const sb = tryGetSupabase();
  if (!sb) return {};
  const key = email.toLowerCase();
  const { data, error } = await sb
    .from('chat_reads')
    .select('chat_id, read_at')
    .eq('user_email', key);
  if (error) {
    // Tabla aún no migrada: lecturas solo en memoria hasta ejecutar la migración.
    if (error.code === 'PGRST205' || error.message?.includes('chat_reads')) return {};
    return {};
  }
  if (!data) return {};
  const map: Record<string, string> = {};
  for (const row of data) {
    map[`${row.chat_id}|${key}`] = row.read_at as string;
  }
  return map;
}

export async function upsertChatRead(
  chatId: string,
  email: string,
  readAt: string,
): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('chat_reads').upsert(
    {
      chat_id: chatId,
      user_email: email.toLowerCase(),
      read_at: readAt,
    },
    { onConflict: 'chat_id,user_email' },
  );
  if (error?.code === 'PGRST205' || error?.message?.includes('chat_reads')) return false;
  return !error;
}

export function subscribeToChatReads(
  email: string,
  onChange: (chatId: string, readAt: string) => void,
): () => void {
  const sb = tryGetSupabase();
  if (!sb) return () => {};

  const key = email.toLowerCase();
  const channel = sb
    .channel(`chat-reads-${key}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_reads',
        filter: `user_email=eq.${key}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as { chat_id?: string; read_at?: string } | undefined;
        if (row?.chat_id && row?.read_at) onChange(row.chat_id, row.read_at);
      },
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}

export function subscribeToChats(onChange: (chat: RouteChat) => void): () => void {
  const sb = tryGetSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel('chats-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chats' },
      (payload) => {
        const row = payload.new as ChatRow | undefined;
        if (row?.data) onChange(chatFromRow(row));
      },
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}
