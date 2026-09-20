import { Card } from '../ui/card';
import { QueryState } from '../common/QueryState';
import { useAdminRoles, ROLE_LABEL } from './adminApi';

/** Read-only: permissions are defined in code (backend/src/lib/permissions.ts) and enforced by the API on every request. */
export function RolesPermissions() {
  const roles = useAdminRoles();
  return (
    <div className="space-y-5">
      <div><h1 className="text-gray-900">Roles & permissions</h1><p className="text-gray-600">What each admin role may do. Changes are made in code review so they are versioned and audited, not edited from a screen.</p></div>
      <QueryState q={roles}>{(r) => {
        const perms = [...new Set(Object.values(r).flat())].sort();
        const names = Object.keys(r);
        return (
          <Card className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600"><tr><th scope="col" className="px-4 py-3 font-medium">Permission</th>{names.map((n) => <th key={n} scope="col" className="px-4 py-3 font-medium text-center">{ROLE_LABEL[n] ?? n}</th>)}</tr></thead>
            <tbody className="divide-y">{perms.map((p) => <tr key={p}><td className="px-4 py-2 font-mono text-xs">{p}</td>{names.map((n) => <td key={n} className="px-4 py-2 text-center">{r[n].includes(p) ? <span aria-label="allowed" className="text-green-600">✓</span> : <span aria-label="not allowed" className="text-gray-300">–</span>}</td>)}</tr>)}</tbody></table></Card>
        );
      }}</QueryState>
    </div>
  );
}
