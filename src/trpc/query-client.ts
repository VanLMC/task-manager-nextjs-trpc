import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';

const THIRTY_SECONDS = 30_000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: THIRTY_SECONDS },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
        shouldRedactErrors: () => false,
      },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });
}
