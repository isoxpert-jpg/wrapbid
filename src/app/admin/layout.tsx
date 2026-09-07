import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/session'
export default async function AdminLayout({children}:{children:React.ReactNode}){const user=await requireRole('ADMIN').catch(()=>null);if(!user)redirect('/login?next=/admin');return children}
