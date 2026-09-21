import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { parse, uuid } from '../lib/http.js';
import { todaysDoses } from '../lib/adherence.js';
import { balance } from '../lib/points.js';
import { requireAuth, requireMember, resolveSubject, wrap } from '../middleware/auth.js';
import { latestMetrics } from '../lib/metrics.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth, requireMember);

dashboardRouter.get('/', wrap(async (req, res) => {
  const seniorId = await resolveSubject(req, parse(z.object({ seniorId: uuid.optional() }), req.query).seniorId);
  const [metrics, doses, appts, visits, events] = await Promise.all([
    latestMetrics(seniorId),
    todaysDoses(seniorId),
    query<any>(`SELECT a.starts_at, a.type, d.name AS doctor, d.specialty, COALESCE(a.location, 'Video call') AS location FROM appointments a JOIN doctors d ON d.id=a.doctor_id WHERE a.senior_id=$1 AND a.status='confirmed' AND a.starts_at > now() ORDER BY a.starts_at LIMIT 5`, [seniorId]),
    query<any>(`SELECT b.starts_at, c.name AS caregiver FROM caregiver_bookings b JOIN caregivers c ON c.id=b.caregiver_id WHERE b.senior_id=$1 AND b.status IN ('pending','confirmed') AND b.starts_at > now() ORDER BY b.starts_at LIMIT 5`, [seniorId]),
    query<any>(`SELECT e.starts_at, e.title, e.location FROM event_rsvps r JOIN events e ON e.id=r.event_id WHERE r.user_id=$1 AND e.starts_at > now() ORDER BY e.starts_at LIMIT 5`, [seniorId]),
  ]);
  const upcoming = [
    ...appts.map((a) => ({ startsAt: a.startsAt, title: `${a.doctor} — ${a.specialty}`, type: 'appointment', location: a.location })),
    ...visits.map((v) => ({ startsAt: v.startsAt, title: `Caregiver visit — ${v.caregiver}`, type: 'caregiver', location: 'At home' })),
    ...events.map((e) => ({ startsAt: e.startsAt, title: e.title, type: 'activity', location: e.location })),
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()).slice(0, 6);

  const taken = doses.filter((d) => d.status === 'taken').length;
  res.json({
    metrics,
    medications: { total: doses.length, taken, missed: doses.filter((d) => d.status === 'missed').length, next: doses.find((d) => d.status === 'upcoming' || d.status === 'scheduled') ?? null },
    upcoming,
    points: await balance(seniorId),
  });
}));
