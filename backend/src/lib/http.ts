import { z } from 'zod';
import { badRequest } from './errors.js';

/** Validate untrusted input (body / query / params) and throw a uniform 400 on failure. */
export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw badRequest('Invalid request', r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return r.data;
}

export const uuid = z.string().uuid();

/** Optional integer query parameter with bounds and a default (z.coerce would turn a missing value into NaN). */
export const intParam = (min: number, max: number, def: number) =>
  z.string().optional().transform((v) => (v === undefined || v === '' ? def : Number(v))).pipe(z.number().int().min(min).max(max));
