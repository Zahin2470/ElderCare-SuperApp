import { Info } from 'lucide-react';

/** Shown on admin screens whose controls have no backend yet, so static sample data is never mistaken for live data. */
export function DemoNotice({ what }: { what: string }) {
  return (
    <div role="note" className="mb-4 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
      <span><strong>Sample data.</strong> {what} is a design preview — nothing on this screen reads from or changes the live system yet.</span>
    </div>
  );
}
