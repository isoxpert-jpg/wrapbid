import { redirect } from 'next/navigation'
import { AgreementList } from '@/components/AgreementList'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/session'

export default async function AdvertiserAgreements({searchParams}:{searchParams:Promise<{ok?:string;error?:string}>}){const user=await requireRole('ADVERTISER').catch(()=>null);if(!user)redirect('/login?next=/advertise/agreements');const agreements=await prisma.agreement.findMany({where:{advertiserId:user.id},include:{campaign:true,installation:{include:{checks:{orderBy:{requestedAt:'desc'}}}},listing:{include:{panelType:true,vehicle:true}}},orderBy:{createdAt:'desc'}});return <AgreementList agreements={agreements} role="ADVERTISER" name={user.name} notice={await searchParams}/>}
