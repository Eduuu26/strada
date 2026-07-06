import { useMemo, useState } from 'react';

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/** Filtra una lista por texto en campos indicados. */
export function useListFilter<T>(
  items: T[],
  fields: (item: T) => (string | undefined | null)[],
) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter((item) =>
      fields(item).some((f) => f && normalize(f).includes(q)),
    );
  }, [items, query, fields]);

  return { query, setQuery, filtered };
}
