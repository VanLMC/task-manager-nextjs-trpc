import { handleTrpcRequest } from '@/server/api-handler';
import { createContext } from '@/server/context';

function handler(request: Request) {
  return handleTrpcRequest(request, () => createContext({ headers: request.headers }));
}

export { handler as GET, handler as POST };
