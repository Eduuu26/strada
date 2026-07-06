import type { ChatMessage, Club, Meetup, RouteChat } from '../types';

export function chatIdForMeetup(meetupId: string): string {
  return `chat_meetup_${meetupId}`;
}

export function chatIdForRoute(routeId: string): string {
  return `chat_route_${routeId}`;
}

export function chatIdForClub(clubId: string): string {
  return `chat_club_${clubId}`;
}

export function systemMessage(text: string): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'system',
    text,
    createdAt: new Date().toISOString(),
  };
}

export function userMessage(
  text: string,
  author: { email: string; name: string },
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'user',
    text: text.trim(),
    authorEmail: author.email,
    authorName: author.name,
    createdAt: new Date().toISOString(),
  };
}

export function createMeetupChat(
  meetup: Pick<Meetup, 'id' | 'title' | 'routeId' | 'creatorEmail'>,
): RouteChat {
  const organizer = meetup.creatorEmail || '';
  return {
    id: chatIdForMeetup(meetup.id),
    meetupId: meetup.id,
    routeId: meetup.routeId,
    title: meetup.title,
    organizerEmail: meetup.creatorEmail,
    participantEmails: organizer ? [organizer] : [],
    messages: [
      systemMessage('Chat del grupo creado. Aquí coordináis la quedada con el resto de participantes.'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createRouteChat(
  route: { id: string; title: string; creatorEmail?: string },
): RouteChat {
  const organizer = route.creatorEmail || '';
  return {
    id: chatIdForRoute(route.id),
    routeId: route.id,
    title: route.title,
    organizerEmail: route.creatorEmail,
    participantEmails: organizer ? [organizer] : [],
    messages: [
      systemMessage('Chat de la ruta creado. Aquí habláis con el resto de conductores apuntados.'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createClubChat(
  club: Pick<Club, 'id' | 'name' | 'creatorEmail' | 'memberEmails'>,
): RouteChat {
  return {
    id: chatIdForClub(club.id),
    clubId: club.id,
    title: club.name,
    organizerEmail: club.creatorEmail,
    participantEmails: [...club.memberEmails],
    messages: [
      systemMessage('Chat del club creado. Aquí habláis con el resto de miembros.'),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mergeClubMembersIntoChat(
  chat: RouteChat,
  club: Pick<Club, 'memberEmails'>,
): RouteChat {
  let updated = chat;
  for (const email of club.memberEmails) {
    updated = addParticipantToChat(updated, email);
  }
  return updated;
}

export function addParticipantToChat(
  chat: RouteChat,
  email: string,
  userName?: string,
): RouteChat {
  const key = email.toLowerCase();
  if (chat.participantEmails.some((e) => e.toLowerCase() === key)) {
    return chat;
  }
  const messages = [...chat.messages];
  if (userName) {
    messages.push(systemMessage(`${userName} se unió al grupo.`));
  }
  return {
    ...chat,
    participantEmails: [...chat.participantEmails, email],
    messages,
    updatedAt: new Date().toISOString(),
  };
}

export function removeParticipantFromChat(
  chat: RouteChat,
  email: string,
  userName?: string,
): RouteChat {
  const key = email.toLowerCase();
  const next = chat.participantEmails.filter((e) => e.toLowerCase() !== key);
  const messages = [...chat.messages];
  if (userName) {
    messages.push(systemMessage(`${userName} abandonó el grupo.`));
  }
  return {
    ...chat,
    participantEmails: next,
    messages,
    updatedAt: new Date().toISOString(),
  };
}
