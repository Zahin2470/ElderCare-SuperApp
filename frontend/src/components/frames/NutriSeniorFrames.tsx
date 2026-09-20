import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Minus, Plus, Star, ShoppingCart } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { QueryState } from '../common/QueryState';
import { useNavigation } from '../navigation/NavigationContext';
import { errorMessage, get, post } from '../../lib/api';
import { fmtDateTime, taka, todayISO } from '../../lib/format';

export interface MenuItem { id: string; name: string; mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'; calories: number | null; proteinG: number | null; tags: string[]; priceBdt: number }
export interface Plan { id: string; name: string; dietitian: string | null; tags: string[]; meals: string[]; pricePerDayBdt: number; rating: number }
export interface Order { id: string; items: { menuItemId: string; name: string; qty: number; priceBdt: number }[]; totalBdt: number; deliveryAt: string | null; address: string | null; status: 'placed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'; rating: number | null; feedback: string | null; planName: string | null }
export interface CheckoutData { plan?: Plan; lines?: { item: MenuItem; qty: number }[] }

export const useMenu = () => useQuery({ queryKey: ['nutrition', 'menu'], queryFn: () => get<{ items: MenuItem[] }>('/nutrition/menu').then((r) => r.items) });
export const usePlans = () => useQuery({ queryKey: ['nutrition', 'plans'], queryFn: () => get<{ plans: Plan[] }>('/nutrition/plans').then((r) => r.plans) });
export const useOrders = () => useQuery({ queryKey: ['nutrition', 'orders'], queryFn: () => get<{ active: Order[]; history: Order[] }>('/nutrition/orders'), refetchInterval: 30_000 });

function Back({ label = 'Back' }: { label?: string }) {
  const { navigateBack } = useNavigation();
  return <Button variant="ghost" onClick={navigateBack} className="-ml-2 mb-2"><ArrowLeft className="w-4 h-4 mr-2" aria-hidden />{label}</Button>;
}

export function PlanCard({ p, onChoose }: { p: Plan; onChoose: (p: Plan) => void }) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between"><p className="text-gray-900">{p.name}</p><span className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden />{p.rating.toFixed(1)}</span></div>
      <p className="text-xs text-gray-500">{p.dietitian}</p>
      <p className="text-sm text-gray-600">{p.meals.join(' · ')}</p>
      <div className="flex flex-wrap gap-1">{p.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
      <div className="flex items-center justify-between mt-auto pt-2"><span className="text-gray-900">{taka(p.pricePerDayBdt)}/day</span><Button size="sm" onClick={() => onChoose(p)}>Choose plan</Button></div>
    </Card>
  );
}

/** Full menu with a running cart. */
export function NS01_MenuOverview() {
  const { navigateToFrame } = useNavigation();
  const menu = useMenu();
  const [cart, setCart] = useState<Record<string, number>>({});
  const setQty = (id: string, d: number) => setCart((c) => { const n = Math.max(0, Math.min(10, (c[id] ?? 0) + d)); const { [id]: _, ...rest } = c; return n ? { ...rest, [id]: n } : rest; });
  const lines = (menu.data ?? []).filter((m) => cart[m.id]).map((item) => ({ item, qty: cart[item.id] }));
  const total = lines.reduce((s, l) => s + l.item.priceBdt * l.qty, 0);
  const types = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div><Back label="NutriSenior" /><h1 className="text-gray-900">Menu</h1></div>
      <QueryState q={menu} isEmpty={(m) => !m.length}>
        {(items) => types.map((t) => items.some((i) => i.mealType === t) && (
          <section key={t} aria-label={t}><h2 className="text-gray-900 mb-3">{t}</h2>
            <div className="grid md:grid-cols-2 gap-3">{items.filter((i) => i.mealType === t).map((i) => (
              <Card key={i.id} className="p-4 flex flex-col gap-2">
                <p className="text-gray-900">{i.name}</p>
                <p className="text-xs text-gray-500">{i.calories ?? '—'} kcal · {i.proteinG ?? '—'} g protein</p>
                <div className="flex flex-wrap gap-1">{i.tags.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag.replace(/-/g, ' ')}</Badge>)}</div>
                <div className="flex items-center justify-between mt-auto pt-1"><span className="text-gray-900">{taka(i.priceBdt)}</span>
                  {cart[i.id] ? (
                    <div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label={`Remove one ${i.name}`} onClick={() => setQty(i.id, -1)}><Minus className="w-4 h-4" /></Button><span aria-live="polite" className="w-6 text-center">{cart[i.id]}</span><Button size="icon" variant="outline" aria-label={`Add one ${i.name}`} onClick={() => setQty(i.id, 1)}><Plus className="w-4 h-4" /></Button></div>
                  ) : <Button size="sm" variant="outline" onClick={() => setQty(i.id, 1)}>Add</Button>}
                </div>
              </Card>
            ))}</div>
          </section>
        ))}
      </QueryState>
      {lines.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 md:left-80 bg-white border-t shadow-lg p-4 flex items-center justify-between gap-4 z-10">
          <span className="text-gray-900 flex items-center gap-2"><ShoppingCart className="w-5 h-5" aria-hidden />{lines.reduce((s, l) => s + l.qty, 0)} items · {taka(total)}</span>
          <Button onClick={() => navigateToFrame('nutrisenior', 'NS03_PlaceOrder', { lines } satisfies CheckoutData)}>Checkout</Button>
        </div>
      )}
    </div>
  );
}

export function NS02_SelectPlan() {
  const { navigateToFrame } = useNavigation();
  const plans = usePlans();
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div><Back label="NutriSenior" /><h1 className="text-gray-900">Meal plans</h1><p className="text-gray-600">Designed with registered dietitians</p></div>
      <QueryState q={plans} isEmpty={(p) => !p.length}>{(p) => <div className="grid md:grid-cols-2 gap-4">{p.map((x) => <PlanCard key={x.id} p={x} onChoose={(plan) => navigateToFrame('nutrisenior', 'NS03_PlaceOrder', { plan } satisfies CheckoutData)} />)}</div>}</QueryState>
    </div>
  );
}

export function NS03_PlaceOrder() {
  const { navigateToFrame, currentNavigation } = useNavigation();
  const qc = useQueryClient();
  const data = currentNavigation.data as CheckoutData;
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('18:00');
  const estimate = (data.plan?.pricePerDayBdt ?? 0) + (data.lines ?? []).reduce((s, l) => s + l.item.priceBdt * l.qty, 0);

  const order = useMutation({
    mutationFn: () => post('/nutrition/orders', { planId: data.plan?.id, items: (data.lines ?? []).map((l) => ({ menuItemId: l.item.id, qty: l.qty })), date, time, address: address.trim() }),
    onSuccess: () => { toast.success('Order placed!'); qc.invalidateQueries({ queryKey: ['nutrition'] }); navigateToFrame('nutrisenior', 'NS04_TrackDelivery'); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div><Back /><h1 className="text-gray-900">Place your order</h1></div>
      <Card className="p-5 space-y-2">
        {data.plan && <div className="flex justify-between"><span>{data.plan.name} <span className="text-gray-500 text-sm">(1 day)</span></span><span>{taka(data.plan.pricePerDayBdt)}</span></div>}
        {(data.lines ?? []).map((l) => <div key={l.item.id} className="flex justify-between"><span>{l.qty} × {l.item.name}</span><span>{taka(l.item.priceBdt * l.qty)}</span></div>)}
        <div className="flex justify-between border-t pt-2 text-lg"><span>Total</span><span>{taka(estimate)}</span></div>
        <p className="text-xs text-gray-500">The final total is calculated by ElderCare from current menu prices.</p>
      </Card>
      <Card className="p-5 space-y-4">
        <div><Label htmlFor="o-addr">Delivery address</Label><Input id="o-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, road, area" className="h-12" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="o-date">Date</Label><Input id="o-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="h-12" /></div>
          <div><Label htmlFor="o-time">Time</Label><Input id="o-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-12" /></div>
        </div>
      </Card>
      <Button className="w-full h-12" disabled={address.trim().length < 5 || order.isPending} onClick={() => order.mutate()}>{order.isPending ? 'Placing order…' : `Place order · ${taka(estimate)}`}</Button>
    </div>
  );
}

const STEPS: Order['status'][] = ['placed', 'preparing', 'out_for_delivery', 'delivered'];
const STEP_LABEL: Record<string, string> = { placed: 'Order placed', preparing: 'Preparing', out_for_delivery: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled' };

export function NS04_TrackDelivery() {
  const orders = useOrders();
  const qc = useQueryClient();
  const cancel = useMutation({ mutationFn: (id: string) => post(`/nutrition/orders/${id}/cancel`), onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries({ queryKey: ['nutrition'] }); }, onError: (e) => toast.error(errorMessage(e)) });
  const rate = useMutation({ mutationFn: ({ id, rating }: { id: string; rating: number }) => post(`/nutrition/orders/${id}/rate`, { rating }), onSuccess: () => { toast.success('Thanks for your feedback!'); qc.invalidateQueries({ queryKey: ['nutrition'] }); }, onError: (e) => toast.error(errorMessage(e)) });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div><Back label="NutriSenior" /><h1 className="text-gray-900">Your orders</h1></div>
      <QueryState q={orders} isEmpty={(o) => !o.active.length && !o.history.length} empty="No orders yet.">
        {(o) => (<>
          {o.active.map((x) => (
            <Card key={x.id} className="p-5 space-y-3">
              <div className="flex justify-between"><p className="text-gray-900">{x.planName ?? x.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p><span>{taka(x.totalBdt)}</span></div>
              <p className="text-sm text-gray-600">{x.deliveryAt ? fmtDateTime(x.deliveryAt) : ''} · {x.address}</p>
              <Progress value={((STEPS.indexOf(x.status) + 1) / STEPS.length) * 100} aria-label={`Order progress: ${STEP_LABEL[x.status]}`} />
              <div className="flex justify-between text-xs text-gray-500">{STEPS.map((s) => <span key={s} className={s === x.status ? 'text-purple-700 font-medium' : ''}>{STEP_LABEL[s]}</span>)}</div>
              {x.status === 'placed' && <Button variant="outline" size="sm" className="text-red-600" disabled={cancel.isPending} onClick={() => { if (window.confirm('Cancel this order?')) cancel.mutate(x.id); }}>Cancel order</Button>}
            </Card>
          ))}
          {o.history.length > 0 && <h2 className="text-gray-900">Past orders</h2>}
          {o.history.map((x) => (
            <Card key={x.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48"><p className="text-gray-900">{x.planName ?? x.items.map((i) => i.name).join(', ')}</p><p className="text-xs text-gray-500">{x.deliveryAt ? fmtDateTime(x.deliveryAt) : ''} · {taka(x.totalBdt)}</p></div>
              <Badge variant={x.status === 'delivered' ? 'secondary' : 'outline'}>{STEP_LABEL[x.status]}</Badge>
              {x.status === 'delivered' && (x.rating ? <span aria-label={`Rated ${x.rating} of 5`}>{'★'.repeat(x.rating)}</span> : (
                <div className="flex" role="group" aria-label="Rate this order">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className="text-xl text-gray-300 hover:text-yellow-500" disabled={rate.isPending} onClick={() => rate.mutate({ id: x.id, rating: n })}>★</button>)}</div>
              ))}
            </Card>
          ))}
        </>)}
      </QueryState>
    </div>
  );
}
