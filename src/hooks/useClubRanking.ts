import { useMemo, useState } from 'react';
import { useChats } from '../context/ChatsContext';
import { useClubs } from '../context/ClubsContext';
import { useRoutes } from '../context/RoutesContext';
import {
  buildClubRanking,
  type ClubRankingMetric,
  type ClubRankingRow,
} from '../lib/clubRanking';

export function useClubRanking(limit = 10) {
  const { clubs, invitations } = useClubs();
  const { routes, meetups, signups } = useRoutes();
  const { chats } = useChats();
  const [metric, setMetric] = useState<ClubRankingMetric>('overall');

  const ranking = useMemo((): ClubRankingRow[] => {
    return buildClubRanking(
      { clubs, routes, meetups, signups, invitations, chats },
      metric,
    ).slice(0, limit);
  }, [clubs, routes, meetups, signups, invitations, chats, metric, limit]);

  return { metric, setMetric, ranking };
}
