import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isSupabaseConfigured } from '../lib/env';
import {
  deleteChatById,
  fetchAllChats,
  fetchChatReadsForUser,
  subscribeToChatReads,
  subscribeToChats,
  upsertChat,
  upsertChatRead,
} from '../lib/supabase/chatsRepository';
import {
  addParticipantToChat,
  chatIdForClub,
  chatIdForMeetup,
  chatIdForRoute,
  createClubChat,
  createMeetupChat,
  createRouteChat,
  mergeClubMembersIntoChat,
  removeParticipantFromChat,
  userMessage,
} from '../lib/chats';
import type { Club, Meetup, RouteChat } from '../types';
import { useAuth } from './AuthContext';

type ChatsContextValue = {
  chats: RouteChat[];
  getChat: (id: string) => RouteChat | undefined;
  getChatForMeetup: (meetupId: string) => RouteChat | undefined;
  getChatForRoute: (routeId: string) => RouteChat | undefined;
  getChatForClub: (clubId: string) => RouteChat | undefined;
  getUserChats: (email: string) => RouteChat[];
  ensureMeetupChat: (meetup: Meetup) => RouteChat;
  ensureRouteChat: (route: { id: string; title: string; creatorEmail?: string }) => RouteChat;
  ensureClubChat: (club: Pick<Club, 'id' | 'name' | 'creatorEmail' | 'memberEmails'>) => RouteChat;
  syncMeetupParticipant: (
    meetup: Meetup,
    email: string,
    userName: string,
    joined: boolean,
  ) => void;
  syncRouteParticipant: (
    route: { id: string; title: string; creatorEmail?: string },
    email: string,
    userName: string,
    joined: boolean,
  ) => void;
  syncClubParticipant: (
    club: Pick<Club, 'id' | 'name' | 'creatorEmail' | 'memberEmails'>,
    email: string,
    userName: string,
    joined: boolean,
  ) => void;
  removeClubChat: (clubId: string) => void;
  sendMessage: (chatId: string, author: { email: string; name: string }, text: string) => boolean;
  markChatRead: (chatId: string, email: string) => void;
  isChatUnread: (chatId: string, email: string) => boolean;
  getUnreadCount: (email: string) => number;
};

function readKey(chatId: string, email: string) {
  return `${chatId}|${email.toLowerCase()}`;
}

function chatIsUnreadFor(chat: RouteChat, email: string, reads: Record<string, string>): boolean {
  const last = chat.messages[chat.messages.length - 1];
  if (!last || last.type === 'system') return false;
  if (last.authorEmail && last.authorEmail.toLowerCase() === email.toLowerCase()) return false;
  const readAt = reads[readKey(chat.id, email)];
  if (!readAt) return true;
  return new Date(last.createdAt).getTime() > new Date(readAt).getTime();
}

const ChatsContext = createContext<ChatsContextValue | null>(null);

export function ChatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<RouteChat[]>([]);
  const [reads, setReads] = useState<Record<string, string>>({});
  const lastPersisted = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void fetchAllChats().then((list) => {
      if (list.length) setChats(list);
    });
    return subscribeToChats((chat) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === chat.id);
        if (idx < 0) return [chat, ...prev];
        const next = [...prev];
        next[idx] = chat;
        return next;
      });
    });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured() || !user?.email) return;
    void fetchChatReadsForUser(user.email).then((map) => {
      if (Object.keys(map).length) setReads((prev) => ({ ...prev, ...map }));
    });
    return subscribeToChatReads(user.email, (chatId, readAt) => {
      setReads((prev) => ({ ...prev, [readKey(chatId, user.email)]: readAt }));
    });
  }, [user?.email]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const timer = setTimeout(() => {
      for (const chat of chats) {
        const key = `${chat.updatedAt}|${chat.messages.length}`;
        if (lastPersisted.current.get(chat.id) === key) continue;
        lastPersisted.current.set(chat.id, key);
        void upsertChat(chat);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [chats]);

  const getChat = useCallback((id: string) => chats.find((c) => c.id === id), [chats]);

  const getChatForMeetup = useCallback(
    (meetupId: string) => chats.find((c) => c.meetupId === meetupId),
    [chats],
  );

  const getChatForRoute = useCallback(
    (routeId: string) => chats.find((c) => c.routeId === routeId && !c.meetupId && !c.clubId),
    [chats],
  );

  const getChatForClub = useCallback(
    (clubId: string) => chats.find((c) => c.clubId === clubId),
    [chats],
  );

  const getUserChats = useCallback(
    (email: string) => {
      const key = email.toLowerCase();
      return chats
        .filter((c) => c.participantEmails.some((e) => e.toLowerCase() === key))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
    [chats],
  );

  const ensureMeetupChat = useCallback((meetup: Meetup) => {
    const id = chatIdForMeetup(meetup.id);
    let created: RouteChat | undefined;
    setChats((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) {
        created = existing;
        return prev;
      }
      const chat = createMeetupChat(meetup);
      if (meetup.creatorEmail && !chat.participantEmails.includes(meetup.creatorEmail)) {
        chat.participantEmails.push(meetup.creatorEmail);
      }
      created = chat;
      return [chat, ...prev];
    });
    return created!;
  }, []);

  const ensureRouteChat = useCallback(
    (route: { id: string; title: string; creatorEmail?: string }) => {
      const id = chatIdForRoute(route.id);
      let created: RouteChat | undefined;
      setChats((prev) => {
        const existing = prev.find((c) => c.id === id);
        if (existing) {
          created = existing;
          return prev;
        }
        const chat = createRouteChat(route);
        created = chat;
        return [chat, ...prev];
      });
      return created!;
    },
    [],
  );

  const ensureClubChat = useCallback(
    (club: Pick<Club, 'id' | 'name' | 'creatorEmail' | 'memberEmails'>) => {
      const id = chatIdForClub(club.id);
      let created: RouteChat | undefined;
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx >= 0) {
          const merged = mergeClubMembersIntoChat(prev[idx], club);
          created = merged;
          if (merged === prev[idx]) return prev;
          const list = [...prev];
          list[idx] = merged;
          return list;
        }
        const chat = createClubChat(club);
        created = chat;
        return [chat, ...prev];
      });
      return created!;
    },
    [],
  );

  const syncMeetupParticipant = useCallback(
    (meetup: Meetup, email: string, userName: string, joined: boolean) => {
      const id = chatIdForMeetup(meetup.id);
      setChats((prev) => {
        let list = [...prev];
        let idx = list.findIndex((c) => c.id === id);
        if (idx < 0) {
          list = [createMeetupChat(meetup), ...list];
          idx = 0;
        }
        const chat = list[idx];
        const next = joined
          ? addParticipantToChat(chat, email, userName)
          : removeParticipantFromChat(chat, email, userName);
        list[idx] = next;
        return list;
      });
    },
    [],
  );

  const syncRouteParticipant = useCallback(
    (
      route: { id: string; title: string; creatorEmail?: string },
      email: string,
      userName: string,
      joined: boolean,
    ) => {
      const id = chatIdForRoute(route.id);
      setChats((prev) => {
        let list = [...prev];
        let idx = list.findIndex((c) => c.id === id);
        if (idx < 0) {
          list = [createRouteChat(route), ...list];
          idx = 0;
        }
        const chat = list[idx];
        const next = joined
          ? addParticipantToChat(chat, email, userName)
          : removeParticipantFromChat(chat, email, userName);
        list[idx] = next;
        return list;
      });
    },
    [],
  );

  const syncClubParticipant = useCallback(
    (
      club: Pick<Club, 'id' | 'name' | 'creatorEmail' | 'memberEmails'>,
      email: string,
      userName: string,
      joined: boolean,
    ) => {
      const id = chatIdForClub(club.id);
      setChats((prev) => {
        let list = [...prev];
        let idx = list.findIndex((c) => c.id === id);
        if (idx < 0) {
          list = [createClubChat(club), ...list];
          idx = 0;
        }
        const chat = list[idx];
        const next = joined
          ? addParticipantToChat(chat, email, userName)
          : removeParticipantFromChat(chat, email, userName);
        list[idx] = next;
        return list;
      });
    },
    [],
  );

  const removeClubChat = useCallback((clubId: string) => {
    const id = chatIdForClub(clubId);
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured()) void deleteChatById(id);
  }, []);

  const sendMessage = useCallback(
    (chatId: string, author: { email: string; name: string }, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          if (!chat.participantEmails.some((e) => e.toLowerCase() === author.email.toLowerCase())) {
            return chat;
          }
          return {
            ...chat,
            messages: [...chat.messages, userMessage(trimmed, author)],
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      return true;
    },
    [],
  );

  const markChatRead = useCallback(
    (chatId: string, email: string) => {
      const readAt = new Date().toISOString();
      setReads((prev) => ({ ...prev, [readKey(chatId, email)]: readAt }));
      if (isSupabaseConfigured()) void upsertChatRead(chatId, email, readAt);
    },
    [],
  );

  const isChatUnread = useCallback(
    (chatId: string, email: string) => {
      const chat = chats.find((c) => c.id === chatId);
      return chat ? chatIsUnreadFor(chat, email, reads) : false;
    },
    [chats, reads],
  );

  const getUnreadCount = useCallback(
    (email: string) => {
      const key = email.toLowerCase();
      return chats.filter(
        (c) =>
          c.participantEmails.some((e) => e.toLowerCase() === key) &&
          chatIsUnreadFor(c, email, reads),
      ).length;
    },
    [chats, reads],
  );

  const value = useMemo(
    () => ({
      chats,
      getChat,
      getChatForMeetup,
      getChatForRoute,
      getChatForClub,
      getUserChats,
      ensureMeetupChat,
      ensureRouteChat,
      ensureClubChat,
      syncMeetupParticipant,
      syncRouteParticipant,
      syncClubParticipant,
      removeClubChat,
      sendMessage,
      markChatRead,
      isChatUnread,
      getUnreadCount,
    }),
    [
      chats,
      getChat,
      getChatForMeetup,
      getChatForRoute,
      getChatForClub,
      getUserChats,
      ensureMeetupChat,
      ensureRouteChat,
      ensureClubChat,
      syncMeetupParticipant,
      syncRouteParticipant,
      syncClubParticipant,
      removeClubChat,
      sendMessage,
      markChatRead,
      isChatUnread,
      getUnreadCount,
    ],
  );

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChats(): ChatsContextValue {
  const ctx = useContext(ChatsContext);
  if (!ctx) {
    throw new Error('useChats debe usarse dentro de ChatsProvider');
  }
  return ctx;
}
