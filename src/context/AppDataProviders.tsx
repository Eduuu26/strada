import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ChatsProvider, useChats } from './ChatsContext';
import { ClubsProvider } from './ClubsContext';
import { CommunitiesProvider } from './CommunitiesContext';
import { RoutesProvider } from './RoutesContext';
import { CarMatchProvider } from './CarMatchContext';
import { SocialProvider } from './SocialContext';
import { PushRegistrar } from '../components/PushRegistrar';

function RoutesWithChats({ children }: { children: ReactNode }) {
  const chats = useChats();
  const chatSync = {
    ensureMeetupChat: chats.ensureMeetupChat,
    ensureRouteChat: chats.ensureRouteChat,
    syncMeetupParticipant: chats.syncMeetupParticipant,
    syncRouteParticipant: chats.syncRouteParticipant,
  };
  return <RoutesProvider chatSync={chatSync}>{children}</RoutesProvider>;
}

function ClubsWithChats({ children }: { children: ReactNode }) {
  const chats = useChats();
  const { findUserByEmail } = useAuth();
  const chatSync = {
    ensureClubChat: chats.ensureClubChat,
    syncClubParticipant: chats.syncClubParticipant,
    removeClubChat: chats.removeClubChat,
  };
  return (
    <ClubsProvider findUser={findUserByEmail} chatSync={chatSync}>
      {children}
    </ClubsProvider>
  );
}

export function AppDataProviders({ children }: { children: ReactNode }) {
  return (
    <ChatsProvider>
      <RoutesWithChats>
        <ClubsWithChats>
          <CommunitiesProvider>
            <CarMatchProvider>
              <SocialProvider>
                <PushRegistrar />
                {children}
              </SocialProvider>
            </CarMatchProvider>
          </CommunitiesProvider>
        </ClubsWithChats>
      </RoutesWithChats>
    </ChatsProvider>
  );
}
