import { useQuery } from '@tanstack/react-query';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Recommendations } from './ai/Recommendations';
import { QueryState } from './common/QueryState';
import { PlanCard, useMenu, useOrders, usePlans } from './frames/NutriSeniorFrames';
import { useNavigation } from './navigation/NavigationContext';
import { get } from '../lib/api';
import { fmtDateTime, taka } from '../lib/format';

export default function NutriSenior({ userRole }: { userRole: 'senior' | 'family' }) {
  const { navigateToFrame } = useNavigation();
  const plans = usePlans();
  const menu = useMenu();
  const orders = useOrders();
  const stats = useQuery({ queryKey: ['nutrition', 'stats'], queryFn: () => get<{ calories: number; calorieTarget: number; proteinG: number }>('/nutrition/stats') });
  const active = orders.data?.active[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-gray-900 mb-2">NutriSenior</h1><p className="text-gray-600">{userRole === 'senior' ? 'Healthy meals, delivered to your door' : 'Nutritious meals for your loved one'}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => navigateToFrame('nutrisenior', 'NS04_TrackDelivery')}>Your orders</Button><Button onClick={() => navigateToFrame('nutrisenior', 'NS01_MenuOverview')}>Browse menu</Button></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5"><p className="text-sm text-gray-600 mb-1">Today's planned meals</p>
          {stats.data ? (<><p className="text-3xl text-purple-700 mb-2">{stats.data.calories} <span className="text-base text-gray-500">/ {stats.data.calorieTarget} kcal</span></p><Progress value={Math.min(100, (stats.data.calories / stats.data.calorieTarget) * 100)} aria-label="Calories planned today" /><p className="text-xs text-gray-500 mt-2">{stats.data.proteinG} g protein from ordered meals</p></>) : <p className="text-gray-400">—</p>}</Card>
        <Card className="p-5"><p className="text-sm text-gray-600 mb-1">Current delivery</p>
          {active ? (<><p className="text-gray-900">{active.planName ?? active.items.map((i) => i.name).join(', ')}</p><p className="text-sm text-gray-600">{active.deliveryAt ? fmtDateTime(active.deliveryAt) : ''}</p><Badge className="mt-2 capitalize">{active.status.replace(/_/g, ' ')}</Badge></>) : <p className="text-gray-600">No active delivery.</p>}</Card>
      </div>

      <Recommendations type="meals" title="Suggested for you" actionLabel="Order"
        onSelect={(r) => {
          if (r.type === 'plan') { const plan = plans.data?.find((p) => p.id === r.id); if (plan) navigateToFrame('nutrisenior', 'NS03_PlaceOrder', { plan }); }
          else { const item = menu.data?.find((m) => m.id === r.id); if (item) navigateToFrame('nutrisenior', 'NS03_PlaceOrder', { lines: [{ item, qty: 1 }] }); }
        }} />

      <section aria-label="Meal plans">
        <div className="flex items-center justify-between mb-4"><h2 className="text-gray-900">Meal plans</h2><Button variant="ghost" size="sm" onClick={() => navigateToFrame('nutrisenior', 'NS02_SelectPlan')}>See all →</Button></div>
        <QueryState q={plans} isEmpty={(p) => !p.length}>{(p) => <div className="grid md:grid-cols-3 gap-4">{p.map((x) => <PlanCard key={x.id} p={x} onChoose={(plan) => navigateToFrame('nutrisenior', 'NS03_PlaceOrder', { plan })} />)}</div>}</QueryState>
      </section>
      <p className="text-xs text-gray-500">Menu prices from {menu.data?.length ? taka(Math.min(...menu.data.map((m) => m.priceBdt))) : '—'}. Dietary tags are informational; please follow your doctor's dietary advice.</p>
    </div>
  );
}
