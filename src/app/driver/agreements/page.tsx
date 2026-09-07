import { redirect } from 'next/navigation'
import { AgreementList } from '@/components/AgreementList'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/session'

export default async function DriverAgreements({searchParams}:{searchParams:Promise<{ok?:string;error?:string}>}){const user=await requireRole('DRIVER').catch(()=>null);if(!user)redirect('/login?next=/driver/agreements');const agreements=await prisma.agreement.findMany({where:{driverId:user.id},include:{campaign:true,installation:{include:{checks:{orderBy:{requestedAt:'desc'}}}},listing:{include:{panelType:true,vehicle:true}}},orderBy:{createdAt:'desc'}});return <AgreementList agreements={agreements} role="DRIVER" name={user.name} notice={await searchParams}/>}
