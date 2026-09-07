import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
const prisma=new PrismaClient({adapter:new PrismaBetterSqlite3({url:process.env.DATABASE_URL})})
const creative=await prisma.creative.findFirst({where:{campaign:{advertiser:{email:'ads.northgear@wrapbid.test'}}}})
const listing=await prisma.panelListing.findFirst({where:{status:'ACTIVE',panelTypeCode:'DRIVER_DOOR'}})
if(!creative||!listing)throw new Error('Seed creative/listing unavailable')
const placement=await prisma.creativePlacement.upsert({where:{creativeId_listingId:{creativeId:creative.id,listingId:listing.id}},update:{},create:{creativeId:creative.id,listingId:listing.id,scale:.9,offsetX:0,offsetY:0,rotation:0}})
console.log(placement.id)
await prisma.$disconnect()
