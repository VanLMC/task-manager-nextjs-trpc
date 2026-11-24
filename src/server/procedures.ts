import { logRequests } from './middlewares/logging';
import { limitMutationRate } from './middlewares/rate-limit';
import { publicProcedure } from './trpc';

export const appProcedure = publicProcedure.use(logRequests).use(limitMutationRate);
