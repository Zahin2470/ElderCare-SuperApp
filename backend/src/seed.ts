/**
 * Development / demo data. DESTRUCTIVE: truncates every table first, and creates accounts with publicly
 * documented passwords — so it refuses to run against production.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from './config.js';
import { one, pool, query } from './db.js';
import { migrate } from './migrate.js';
import { hashPassword } from './lib/security.js';
import { addDays, localNow, localToUtc } from './lib/time.js';

export const DEMO_PASSWORD = 'Demo@12345';
export const ADMIN_PASSWORD = 'Admin@12345';
export const DEV_TOTP_SECRET = 'JBSWY3DPEHPK3PXP'; // fixed, documented, dev-only
const TABLES = ['audit_logs', 'ai_digests', 'ai_messages', 'ai_conversations', 'reward_redemptions', 'rewards', 'points_ledger', 'mentor_sessions', 'mentors', 'facility_bookings', 'room_applications',
  'living_rooms', 'chat_messages', 'chat_group_members', 'chat_groups', 'event_rsvps', 'events', 'meal_orders', 'menu_items', 'meal_plans', 'caregiver_bookings', 'caregivers', 'record_shares', 'appointments',
  'doctors', 'refill_requests', 'prescriptions', 'health_records', 'health_metrics', 'medication_logs', 'medications', 'family_links', 'refresh_tokens', 'otp_codes', 'users'];

async function row<T = any>(table: string, o: Record<string, unknown>): Promise<T> {
  const keys = Object.keys(o);
  return (await one<T>(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, keys.map((k) => o[k])))!;
}

export async function seed(opts: { quiet?: boolean } = {}) {
  if (config.isProd) throw new Error('Refusing to seed (this truncates every table) in production.');
  await query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  const now = localNow();
  const at = (dayOffset: number, hhmm: string) => localToUtc(addDays(now.date, dayOffset), hhmm);
  const demoHash = await hashPassword(DEMO_PASSWORD), adminHash = await hashPassword(ADMIN_PASSWORD);
  const verified = new Date();

  // ── people ──
  const senior = await row('users', { full_name: 'Md. Mosarraf Hossain', email: 'demo@eldercare.com', phone: '+8801712345678', password_hash: demoHash, role: 'senior', phone_verified_at: verified, email_verified_at: verified });
  const family = await row('users', { full_name: 'Nusrat Jahan', email: 'family@eldercare.com', phone: '+8801812345678', password_hash: demoHash, role: 'family', phone_verified_at: verified, locale: 'bn' });
  const other = await row('users', { full_name: 'Rahima Begum', email: 'other@eldercare.com', phone: '+8801912345678', password_hash: demoHash, role: 'senior', phone_verified_at: verified });
  await row('family_links', { senior_id: senior.id, family_id: family.id, relation: 'Daughter', status: 'accepted' });
  for (const [email, name, role] of [['super@eldercare.com', 'System Administrator', 'super_admin'], ['security@eldercare.com', 'Security Admin', 'security_admin'], ['ops@eldercare.com', 'Operations Manager', 'operations_admin'], ['clinical@eldercare.com', 'Dr. Clinical Admin', 'clinical_admin']])
    await row('users', { full_name: name, email, password_hash: adminHash, role, email_verified_at: verified, totp_secret: DEV_TOTP_SECRET });

  // ── catalogs ──
  const docs: any[] = [];
  for (const d of [
    ['Professor Ali Hasan', 'Cardiology', 'Senior Consultant', 'Square Hospital, Dhaka', 4.9, 234, 25, 1300, 'Renowned cardiologist with expertise in geriatric heart care and preventive cardiology.'],
    ['Dr. Nusrat Ahmed', 'General Medicine', 'Consultant Physician', 'United Hospital, Dhaka', 4.8, 189, 15, 1500, 'Consultant physician focused on chronic disease management in older adults.'],
    ['Dr. Rahman Chowdhury', 'Neurology', 'Associate Professor', 'BIRDEM Hospital, Dhaka', 5.0, 156, 18, 1600, 'Neurologist experienced in stroke recovery and memory disorders.'],
    ['Dr. Farhana Islam', 'Endocrinology', 'Consultant', 'BIRDEM Hospital, Dhaka', 4.7, 121, 12, 1400, 'Endocrinologist with a focus on diabetes care.'],
    ['Dr. Kamal Uddin', 'Orthopedics', 'Assistant Professor', 'NITOR, Dhaka', 4.6, 98, 14, 1200, 'Orthopedic specialist for joint and mobility care.'],
  ] as const) docs.push(await row('doctors', { name: d[0], specialty: d[1], designation: d[2], hospital: d[3], rating: d[4], reviews_count: d[5], experience_years: d[6], fee_bdt: d[7], about: d[8] }));

  const cgs: any[] = [];
  for (const c of [
    ['Nelufa Yeasmin', 4.5, 127, 8, ['Companionship', 'Mobility Assistance', 'Meal Prep'], 3850, 'Dhanmondi', 0],
    ['Abrar Hossain Zahin', 5.0, 194, 10, ['Personal Care', 'Transportation', 'Light Housekeeping'], 3520, 'Gulshan', 1],
    ['Faisal Ahmed', 4.5, 156, 7, ['Medical Care', 'Dementia Care', 'Physical Therapy'], 2950, 'Mirpur', 7],
  ] as const) cgs.push(await row('caregivers', { name: c[0], rating: c[1], reviews_count: c[2], experience_years: c[3], specialties: c[4], hourly_rate_bdt: c[5], area: c[6], verified: true, available_from: addDays(now.date, c[7]) }));

  const plans: any[] = [];
  for (const p of [
    ['Heart Healthy Plan', 'Dr. Mohammad Abrar, RD', ['Low Sodium', 'Heart Healthy', 'Omega-3'], ['Greek Salmon', 'Quinoa Salad', 'Vegetable Soup'], 4950, 4.9],
    ['Diabetes Care Plan', 'Dr. Mohammad Kabir, RD', ['Low Carb', 'High Fiber', 'Blood Sugar Friendly'], ['Grilled Chicken', 'Roasted Vegetables', 'Berry Parfait'], 4620, 4.8],
    ['Soft Foods Plan', 'Chef Maria Hossain', ['Soft Texture', 'Comfort Food', 'Easy to Eat'], ['Meatloaf', 'Mashed Potatoes', 'Soft Bread Pudding'], 4180, 5.0],
  ] as const) plans.push(await row('meal_plans', { name: p[0], dietitian: p[1], tags: p[2], meals: p[3], price_per_day_bdt: p[4], rating: p[5] }));

  const menu: any[] = [];
  for (const m of [
    ['Grilled Salmon with Vegetables', 'Dinner', 450, 35, ['Low-Sodium', 'Heart-Healthy', 'Omega-3'], 300],
    ['Mediterranean Chicken Bowl', 'Lunch', 520, 38, ['Gluten-Free', 'High-Protein'], 300],
    ['Vegetable Stir-Fry', 'Lunch', 380, 12, ['Vegetarian', 'Low-Calorie'], 100],
    ['Diabetic-Friendly Oatmeal', 'Breakfast', 320, 11, ['Diabetic-Friendly', 'High-Fiber', 'Low-Sugar'], 100],
    ['Lentil Soup (Dal) with Brown Rice', 'Lunch', 410, 18, ['High-Fiber', 'Vegetarian', 'Low-Sodium'], 120],
    ['Steamed Fish with Greens', 'Dinner', 360, 30, ['Low-Sodium', 'Heart-Healthy'], 220],
    ['Soft Khichuri', 'Dinner', 430, 15, ['Soft-Texture', 'Comfort-Food'], 110],
    ['Fruit & Yogurt Bowl', 'Snack', 210, 8, ['Low-Sugar', 'High-Fiber'], 90],
  ] as const) menu.push(await row('menu_items', { name: m[0], meal_type: m[1], calories: m[2], protein_g: m[3], tags: m[4], price_bdt: m[5] }));

  const evs: any[] = [];
  for (const [title, d, s, e, loc, cap, mode, cat, desc] of [
    ['Morning Yoga & Meditation', 1, '08:00', '09:00', 'AgeWell Community Center - Room 101', 15, 'in-person', 'Exercise', 'Gentle yoga and guided meditation for all levels.'],
    ['Virtual Book Discussion: "The Midnight Library"', 2, '15:00', '16:30', 'Zoom Meeting', 30, 'virtual', 'Book Club', 'Monthly online book club.'],
    ['Watercolor Painting Workshop', 3, '14:00', '16:00', 'AgeWell Community Center - Art Studio', 12, 'in-person', 'Arts & Crafts', 'Beginner-friendly painting with all materials provided.'],
    ['Sunday Brunch Social', 5, '11:00', '13:00', 'AgeWell Dining Hall', 40, 'in-person', 'Social', 'Meet neighbours over a relaxed brunch.'],
    ['Classical Music Appreciation', 6, '16:00', '17:30', 'Virtual - Google Meet', 25, 'virtual', 'Music', 'Listen and discuss classical pieces.'],
    ['Chair Exercise Class', 7, '10:00', '11:00', 'AgeWell Community Center - Fitness Room', 20, 'in-person', 'Exercise', 'Low-impact seated exercises to keep you moving.'],
  ] as const) evs.push(await row('events', { title, description: desc, category: cat, starts_at: at(d, s), ends_at: at(d, e), location: loc, mode, capacity: cap }));

  for (const [t, d, c, cat] of [['Free NutriSenior Meal', 'Redeem for any meal from our menu', 500, 'Food'], ['20% Off ElderLink Service', 'Discount on your next caregiver booking', 300, 'Discount'], ['Free Yoga Session', 'Complimentary community yoga class', 250, 'Activity'],
    ['Free TeleHealth Consultation', 'One free video consultation with any doctor', 1000, 'Healthcare'], ['SilverBox Medication Discount', '15% off your next medication order', 400, 'Discount'], ['Premium Event Pass', 'VIP access to exclusive community events', 750, 'Activity'],
    ['Monthly Meal Plan Upgrade', 'Upgrade to premium meal plan for one month', 2000, 'Food']] as const)   // 'Gold Membership Upgrade' dropped: tiers are earned from lifetime points, not bought
    await row('rewards', { title: t, description: d, cost: c, category: cat });

  const mentors: any[] = [];
  for (const m of [['Mohammod Zahin Khan', 'Financial Planning', '35 years in wealth management', ['Investment Strategy', 'Retirement Planning', 'Tax Planning'], 5500, 4.9, 45, 'Senior wealth manager who helps families plan a secure retirement.', 'Available this week'],
    ['Azra Zabin Maisha', 'Career Coaching', '30 years in HR and talent development', ['Career Transitions', 'Interview Skills', 'Leadership'], 4400, 5.0, 62, 'HR leader who mentors people through career changes.', 'Available this week'],
    ['Saif Ali Khan', 'Business Consulting', '40 years building and selling businesses', ['Startups', 'Operations', 'Sales'], 8250, 4.8, 38, 'Serial entrepreneur advising small business owners.', 'Available next week']] as const)
    mentors.push(await row('mentors', { name: m[0], expertise: m[1], experience: m[2], skills: m[3], rate_bdt_hour: m[4], rating: m[5], reviews_count: m[6], verified: true, bio: m[7], availability: m[8] }));
  for (const [n, t, s, f, ft, p] of [['Serenity Gardens Retirement Community', 'Independent Living', 450, '2nd Floor', ['Wheelchair Accessible', 'Private Bath', 'Kitchenette'], 35200], ['Golden Years Residence', 'Assisted Living', 650, '1st Floor', ['Balcony', 'Full Kitchen', 'Emergency Call System'], 45100]] as const)
    await row('living_rooms', { name: n, type: t, size_sqft: s, floor: f, features: ft, price_month_bdt: p });

  const yoga = await row('chat_groups', { name: 'Yoga Enthusiasts' }), book = await row('chat_groups', { name: 'Book Club October' });
  for (const g of [yoga, book]) for (const u of [senior, other]) await row('chat_group_members', { group_id: g.id, user_id: u.id });
  await row('chat_messages', { group_id: yoga.id, user_id: other.id, body: 'See you all tomorrow morning!' });

  // ── the demo senior's own data ──
  const meds: any[] = [];
  for (const [name, dose, purpose, times, rem, tot, refill] of [['Lisinopril', '10mg', 'Blood Pressure', ['08:00'], 8, 30, 6], ['Metformin', '500mg', 'Diabetes', ['12:00'], 45, 90, 24], ['Aspirin', '81mg', 'Heart Health', ['08:00'], 22, 30, 12], ['Atorvastatin', '20mg', 'Cholesterol', ['21:00'], 3, 30, 3]] as const)
    meds.push(await row('medications', { senior_id: senior.id, name, dosage: dose, purpose, schedule_times: times, stock_remaining: rem, stock_total: tot, refill_date: addDays(now.date, refill), created_at: new Date(Date.now() - 31 * 86_400_000) }));

  let x = 12345; const rnd = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);   // deterministic history
  for (let d = 29; d >= 1; d--) for (const m of meds) for (const t of m.scheduleTimes as string[]) {
    if (rnd() < 0.9) await row('medication_logs', { medication_id: m.id, senior_id: senior.id, scheduled_date: addDays(now.date, -d), scheduled_time: t, status: 'taken', taken_at: localToUtc(addDays(now.date, -d), t) });
  }
  if (now.minutes > 8 * 60 + 15) await row('medication_logs', { medication_id: meds[2].id, senior_id: senior.id, scheduled_date: now.date, scheduled_time: '08:00', status: 'taken', taken_at: localToUtc(now.date, '08:15') });

  for (let d = 9; d >= 0; d--) {
    const when = new Date(Math.min(at(-d, '09:00').getTime(), Date.now() - 3600_000)); // a reading is never in the future
    await row('health_metrics', { senior_id: senior.id, kind: 'blood_pressure', value1: 118 + ((d * 7) % 14), value2: 78 + ((d * 5) % 8), recorded_at: when });
    await row('health_metrics', { senior_id: senior.id, kind: 'heart_rate', value1: 68 + (d % 6), recorded_at: when });
    if (d % 2 === 0) await row('health_metrics', { senior_id: senior.id, kind: 'blood_sugar', value1: 105 + ((d * 9) % 30), recorded_at: when });
  }
  await row('health_metrics', { senior_id: senior.id, kind: 'weight', value1: 68.4, recorded_at: at(-2, '08:00') });

  for (const [type, title, cat, prov, day] of [['Lab Results', 'Complete Blood Count', 'Labs', 'Professor Ali Hasan - Square Hospital', -3], ['Imaging', 'Chest X-Ray Report', 'Imaging', 'United Hospital, Dhaka', -20], ['Visit Summary', 'Cardiology Follow-up Notes', 'Visits', 'Professor Ali Hasan - Square Hospital', -35]] as const)
    await row('health_records', { senior_id: senior.id, type, title, category: cat, provider: prov, record_date: addDays(now.date, day), status: 'reviewed' });
  for (const [med, dose, by, start, refills] of [['Lisinopril', '10mg daily', 'Dr. Sarah Hossain', -600, 3], ['Metformin', '500mg daily', 'Dr. Nusrat Ahmed', -420, 2], ['Atorvastatin', '20mg nightly', 'Professor Ali Hasan', -300, 0]] as const)
    await row('prescriptions', { senior_id: senior.id, medication: med, dosage: dose, prescribed_by: by, start_date: addDays(now.date, start), refills_remaining: refills });

  await row('appointments', { senior_id: senior.id, doctor_id: docs[0].id, starts_at: at(1, '15:00'), type: 'video', reason: 'Follow-up', status: 'confirmed' });
  await row('appointments', { senior_id: senior.id, doctor_id: docs[0].id, starts_at: at(-4, '15:00'), type: 'video', status: 'completed', diagnosis: 'Hypertension - well controlled', consult_notes: 'Blood pressure stable, lifestyle modifications discussed' });
  await row('caregiver_bookings', { senior_id: senior.id, caregiver_id: cgs[0].id, starts_at: at(1, '14:00'), ends_at: at(1, '17:00'), services: ['Companionship', 'Meal Prep'], total_bdt: 3 * 3850, status: 'confirmed' });
  await row('caregiver_bookings', { senior_id: senior.id, caregiver_id: cgs[1].id, starts_at: at(3, '10:00'), ends_at: at(3, '14:00'), services: ['Transportation', 'Light Housekeeping'], total_bdt: 4 * 3520, status: 'pending' });
  await row('event_rsvps', { event_id: evs[0].id, user_id: senior.id });
  await row('event_rsvps', { event_id: evs[1].id, user_id: senior.id });
  await row('meal_orders', { senior_id: senior.id, plan_id: plans[0].id, items: JSON.stringify([{ menuItemId: menu[0].id, name: menu[0].name, qty: 1, priceBdt: 300 }]), total_bdt: 300, delivery_at: at(0, '18:00'), address: 'House 12, Road 5, Dhanmondi, Dhaka', status: 'out_for_delivery' });
  for (const [i, day, rating, fb] of [[1, -3, 5, 'Delicious!'], [7, -6, 4, 'Nice and soft, easy to eat.']] as const)
    await row('meal_orders', { senior_id: senior.id, items: JSON.stringify([{ menuItemId: menu[i].id, name: menu[i].name, qty: 1, priceBdt: menu[i].priceBdt }]), total_bdt: menu[i].priceBdt, delivery_at: at(day, '13:00'), address: 'House 12, Road 5, Dhanmondi, Dhaka', status: 'delivered', rating, feedback: fb });
  for (const [delta, reason, key, day] of [[500, 'Welcome bonus', null, -30], [300, 'TeleHealth consultation', null, -12], [400, 'Community engagement', null, -9], [50, 'Weekly medication streak', null, -4]] as const)
    await row('points_ledger', { user_id: senior.id, delta, reason, action_key: key, local_day: addDays(now.date, day) });

  if (!opts.quiet) console.log('Seeded. Demo logins:\n  senior  demo@eldercare.com / +8801712345678   password', DEMO_PASSWORD, '\n  family  family@eldercare.com                  password', DEMO_PASSWORD, '\n  admin   super@eldercare.com (also security@, ops@, clinical@)  password', ADMIN_PASSWORD, ' TOTP secret', DEV_TOTP_SECRET);
  return { senior, family, other, docs, cgs, plans, menu, evs, meds };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (config.isProd) { console.error('Refusing to seed demo data in production.'); process.exit(1); }
  migrate(false).then(() => seed()).then(() => pool.end()).catch((e) => { console.error(e); process.exit(1); });
}
