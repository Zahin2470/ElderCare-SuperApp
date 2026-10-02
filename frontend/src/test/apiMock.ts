import { vi } from 'vitest';
import { setSession, SessionUser } from '../lib/api';

/**
 * A routing fetch mock returning realistic payloads for every endpoint the app's main screens call,
 * so whole screens can be rendered (and audited) with real-looking data instead of empty states.
 * Payload shapes mirror the backend's actual responses (camelCase, ISO timestamps).
 */
const now = Date.now();
const iso = (offsetHours: number) => new Date(now + offsetHours * 3600_000).toISOString();
const ymd = (offsetDays: number) => new Date(now + offsetDays * 86_400_000).toISOString().slice(0, 10);

export const senior: SessionUser = { id: 'sen-1', fullName: 'Md. Mosarraf Hossain', email: 'demo@eldercare.com', phone: '+8801712345678', role: 'senior', locale: 'en', isVerified: true };
export const family: SessionUser = { id: 'fam-1', fullName: 'Nusrat Jahan', email: 'family@eldercare.com', phone: null, role: 'family', locale: 'en', isVerified: true };
export const admin: SessionUser = { id: 'adm-1', fullName: 'System Administrator', email: 'super@eldercare.com', phone: null, role: 'super_admin', locale: 'en', isVerified: true };

const metrics = [
  { kind: 'blood_pressure', label: 'Blood Pressure', value1: 128, value2: 82, unit: 'mmHg', recordedAt: iso(-3), status: 'elevated', trend: 'up' },
  { kind: 'heart_rate', label: 'Heart Rate', value1: 72, value2: null, unit: 'bpm', recordedAt: iso(-3), status: 'normal', trend: 'stable' },
  { kind: 'blood_sugar', label: 'Blood Sugar', value1: 110, value2: null, unit: 'mg/dL', recordedAt: iso(-5), status: 'normal', trend: 'down' },
  { kind: 'weight', label: 'Weight', value1: 68.4, value2: null, unit: 'kg', recordedAt: iso(-48), status: 'recorded', trend: 'stable' },
];
const doses = [
  { medicationId: 'm1', name: 'Lisinopril', dosage: '10mg', purpose: 'Blood Pressure', reminder: true, time: '08:00', status: 'taken', takenAt: iso(-4) },
  { medicationId: 'm2', name: 'Metformin', dosage: '500mg', purpose: 'Diabetes', reminder: true, time: '12:00', status: 'upcoming', takenAt: null },
  { medicationId: 'm3', name: 'Atorvastatin', dosage: '20mg', purpose: 'Cholesterol', reminder: true, time: '21:00', status: 'scheduled', takenAt: null },
];
const medications = [
  { id: 'm1', name: 'Lisinopril', dosage: '10mg', purpose: 'Blood Pressure', scheduleTimes: ['08:00'], reminder: true, stockRemaining: 8, stockTotal: 30, refillDate: ymd(6), stockStatus: 'low' },
  { id: 'm2', name: 'Metformin', dosage: '500mg', purpose: 'Diabetes', scheduleTimes: ['12:00'], reminder: true, stockRemaining: 45, stockTotal: 90, refillDate: ymd(24), stockStatus: 'good' },
];
const caregiver = { id: 'c1', name: 'Nelufa Yeasmin', rating: 4.5, reviewsCount: 127, experienceYears: 8, specialties: ['Companionship', 'Meal Prep'], hourlyRateBdt: 3850, area: 'Dhanmondi', verified: true, availableFrom: ymd(0) };
const doctor = { id: 'd1', name: 'Professor Ali Hasan', specialty: 'Cardiology', designation: 'Senior Consultant', hospital: 'Square Hospital, Dhaka', rating: 4.9, reviewsCount: 234, experienceYears: 25, feeBdt: 1300, about: null };
const menuItem = { id: 'mi1', name: 'Grilled Salmon with Vegetables', mealType: 'Dinner', calories: 450, proteinG: 35, tags: ['Low-Sodium', 'Heart-Healthy'], priceBdt: 300 };
const plan = { id: 'p1', name: 'Heart Healthy Plan', dietitian: 'Dr. Mohammad Abrar, RD', tags: ['Low Sodium'], meals: ['Greek Salmon', 'Quinoa Salad'], pricePerDayBdt: 4950, rating: 4.9 };
const event = { id: 'e1', title: 'Morning Yoga & Meditation', description: 'Gentle yoga for all levels.', category: 'Exercise', startsAt: iso(24), endsAt: iso(25), location: 'AgeWell Community Center', mode: 'in-person', capacity: 15, attendees: 4, registered: false };
const record = { id: 'r1', type: 'Lab Results', title: 'Complete Blood Count', category: 'Labs', provider: 'Square Hospital', recordDate: ymd(-3), status: 'reviewed', fileName: 'cbc.pdf', fileMime: 'application/pdf', fileSize: 20480, hasFile: true };
const mentor = { id: 'mt1', name: 'Mohammod Zahin Khan', expertise: 'Financial Planning', experience: '35 years', skills: ['Retirement Planning'], rateBdtHour: 5500, rating: 4.9, reviewsCount: 45, verified: true, bio: 'Senior wealth manager.', availability: 'Available this week' };
const room = { id: 'rm1', name: 'Serenity Gardens Retirement Community', type: 'Independent Living', sizeSqft: 450, floor: '2nd Floor', features: ['Wheelchair Accessible'], priceMonthBdt: 35200, availableFrom: ymd(0) };

const ROUTES: Record<string, unknown> = {
  '/api/dashboard': { metrics, medications: { total: 3, taken: 1, missed: 0, next: doses[1] }, upcoming: [{ startsAt: iso(24), title: 'Professor Ali Hasan — Cardiology', type: 'appointment', location: 'Video call' }], points: 1250 },
  '/api/medications/today': { doses },
  '/api/medications/adherence': { thisWeek: 92, thisMonth: 88, onTime: 85, missedThisWeek: 1, dosesThisWeek: 14 },
  '/api/medications/history': { history: [{ date: ymd(-1), time: '08:00', name: 'Lisinopril', dosage: '10mg', status: 'taken', takenAt: iso(-24) }, { date: ymd(-1), time: '21:00', name: 'Atorvastatin', dosage: '20mg', status: 'missed', takenAt: null }] },
  '/api/medications': { medications },
  '/api/ai/digest': { kind: 'daily', locale: 'en', source: 'fallback', cached: false, content: { headline: 'Your day at a glance', summary: 'You have 3 medicine doses today; 1 taken so far.', highlights: ['Next medicine: Metformin at 12:00'], tip: 'Sip water regularly.', attention: ['Latest Blood Pressure (128/82 mmHg) is outside the usual range — worth mentioning to a doctor.'] }, facts: { dosesToday: 3, dosesTaken: 1, dosesMissed: 0, adherenceThisWeek: 92, missedThisWeek: 1 } },
  '/api/ai/recommendations': { items: [{ id: 'mi1', type: 'meal', title: 'Grilled Salmon with Vegetables', subtitle: 'Dinner · 450 kcal · ৳300', score: 5, reason: 'Heart-Healthy — chosen because you take medicine for blood pressure' }], phrasedBy: 'template' },
  '/api/ai/status': { mode: 'basic', dailyMessageLimit: 30, emergencyNumber: '999' },
  '/api/family/requests': { requests: [] },
  '/api/caregivers': { caregivers: [caregiver] },
  '/api/caregivers/bookings': { bookings: [{ id: 'b1', startsAt: iso(48), endsAt: iso(51), services: ['Companionship'], totalBdt: 11550, status: 'confirmed', caregiverId: 'c1', caregiverName: 'Nelufa Yeasmin' }] },
  '/api/telehealth/doctors': { doctors: [doctor] },
  '/api/telehealth/appointments': { upcoming: [{ id: 'a1', startsAt: iso(24), type: 'video', reason: 'Follow-up', location: null, status: 'confirmed', diagnosis: null, consultNotes: null, doctorId: 'd1', doctorName: 'Professor Ali Hasan', specialty: 'Cardiology', hospital: 'Square Hospital' }], past: [] },
  '/api/nutrition/plans': { plans: [plan] },
  '/api/nutrition/menu': { items: [menuItem] },
  '/api/nutrition/orders': { active: [{ id: 'o1', items: [{ menuItemId: 'mi1', name: 'Grilled Salmon', qty: 1, priceBdt: 300 }], totalBdt: 300, deliveryAt: iso(6), address: 'House 12, Road 5, Dhanmondi', status: 'preparing', rating: null, feedback: null, planName: null }], history: [] },
  '/api/nutrition/stats': { calories: 450, calorieTarget: 1800, proteinG: 35 },
  '/api/care360/records': { records: [record] },
  '/api/care360/prescriptions': { prescriptions: [{ id: 'rx1', medication: 'Lisinopril', dosage: '10mg daily', prescribedBy: 'Dr. Sarah Hossain', startDate: ymd(-600), refillsRemaining: 3, status: 'active' }] },
  '/api/community/events': { events: [event] },
  '/api/community/events/mine': { events: [] },
  '/api/community/groups': { groups: [{ id: 'g1', name: 'Yoga Enthusiasts', members: 2, lastMessage: 'See you all tomorrow!', lastMessageAt: iso(-2), unread: 1, joined: true }] },
  '/api/rewards/summary': { balance: 1250, lifetimeEarned: 1250, earnedThisMonth: 125, redeemedCount: 2, recentActivity: [{ id: 1, delta: 500, reason: 'Welcome bonus', createdAt: iso(-720) }], earnActions: [{ key: 'health_checkin', title: 'Complete Health Check-in', description: 'Log your daily vitals', points: 25, available: true }], rewards: [{ id: 'rw1', title: 'Free NutriSenior Meal', description: 'Redeem for any meal', cost: 500, category: 'Food' }] },
  '/api/mentors': { mentors: [mentor] },
  '/api/mentors/categories': { categories: [{ name: 'Financial Planning', count: 1 }] },
  '/api/mentors/sessions': { sessions: [] },
  '/api/agewell/rooms': { rooms: [room] },
  '/api/agewell/applications': { applications: [] },
  '/api/agewell/facility-bookings': { facilities: ['Community Room', 'Garden Pavilion'], bookings: [] },
  // admin
  '/api/admin/stats': { users: { total: 7, seniors: 2, families: 1, suspended: 0, new7d: 3, active24h: 2 }, operations: { upcomingAppointments: 4, pendingCaregiverBookings: 1, openMealOrders: 2, aiMessages24h: 10, failedAuth24h: 0 } },
  '/api/admin/users': { users: [{ id: 'u1', fullName: 'Md. Mosarraf Hossain', email: 'demo@eldercare.com', phone: '+8801712345678', role: 'senior', status: 'active', isVerified: true, lastLoginAt: iso(-1), createdAt: iso(-720) }], total: 1, page: 1, pageSize: 25 },
  '/api/admin/audit-logs': { logs: [{ id: 1, action: 'auth.login', actorRole: 'senior', actorName: 'Md. Mosarraf Hossain', subjectType: null, subjectId: null, metadata: {}, ip: '203.0.113.5', createdAt: iso(-1) }], page: 1, pageSize: 50 },
  '/api/admin/roles': { roles: { super_admin: ['users.read', 'audit_logs.read'], security_admin: ['audit_logs.read'] } },
  '/api/admin/security/sessions': { sessions: [{ familyId: 'f1', userId: 'u1', userName: 'Md. Mosarraf Hossain', userRole: 'senior', ip: '203.0.113.5', userAgent: 'Mozilla', startedAt: iso(-5), lastRefreshedAt: iso(-1) }] },
  '/api/admin/security/locked-users': { users: [] },
  '/api/admin/security/events': { events: [{ id: 1, action: 'auth.login_failed', actorId: null, actorName: null, metadata: {}, ip: '203.0.113.9', createdAt: iso(-2), severity: 'medium' }] },
  '/api/admin/security/ip-activity': { ips: [{ ip: '203.0.113.9', totalEvents: 5, failedEvents: 3, lastSeen: iso(-1) }] },
};

/** Install the mock and sign in as `user`. `linkedSeniors` is only used for family accounts. */
export function installApiMock(user: SessionUser, opts: { linkedSeniors?: { id: string; fullName: string; relation: string | null }[]; overrides?: Record<string, unknown> } = {}) {
  const routes = { ...ROUTES, ...(opts.overrides ?? {}) };
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const path = new URL(input, 'http://localhost').pathname;
    if (path === '/api/auth/refresh') return Response.json({ user, accessToken: 't' });
    if (path === '/api/auth/me') return Response.json({ user, linkedSeniors: opts.linkedSeniors ?? [] });
    if (path in routes) return Response.json(routes[path]);
    return Response.json({ error: { code: 'not_found', message: `No mock for ${path}` } }, { status: 404 });
  }));
  setSession({ user, accessToken: 't' });
}
