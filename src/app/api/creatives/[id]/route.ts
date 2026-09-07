import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/session'

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireUser()
  const creative=await prisma.creative.findUnique({where:{id:(await params).id},include:{campaign:true,agreements:true}})
  const allowed=creative&&(user.role==='ADMIN'||creative.campaign.advertiserId===user.id||creative.agreements.some(a=>a.driverId===user.id))
  if(!allowed||!creative)return new Response('Not found',{status:404})
  if(creative.filePath.startsWith('/')) return Response.redirect(new URL(creative.filePath,request.url),302)
  try{const body=await readFile(join(process.cwd(),'storage','creatives',creative.filePath));return new Response(body,{headers:{'Content-Type':creative.mimeType,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}catch{return new Response('Not found',{status:404})}
}
