import 'server-only';

import { getServices } from './services';
import { type Context, readRequestMetadata } from './trpc';

export function createContext({ headers }: { headers: Headers }): Context {
  return { ...getServices(), ...readRequestMetadata(headers) };
}
