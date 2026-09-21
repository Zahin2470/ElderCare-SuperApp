export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
export const badRequest = (m: string, d?: unknown) => new HttpError(400, 'bad_request', m, d);
export const unauthorized = (m = 'Authentication required') => new HttpError(401, 'unauthorized', m);
export const forbidden = (m = 'You do not have access to this resource') => new HttpError(403, 'forbidden', m);
export const notFound = (m = 'Not found') => new HttpError(404, 'not_found', m);
export const conflict = (m: string) => new HttpError(409, 'conflict', m);
export const tooMany = (m = 'Too many requests. Please try again later.') => new HttpError(429, 'rate_limited', m);
