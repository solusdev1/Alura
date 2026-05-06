import { redirect } from 'next/navigation';

export default function LegacyAction1Page() {
  redirect('/dashboard/admin/bases');
}
