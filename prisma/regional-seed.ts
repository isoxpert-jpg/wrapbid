import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { computeExposure, startingRentCents } from '../src/lib/pricing'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })
const cities = [
  { name: 'Karachi', region: 'Sindh, Pakistan', lat: 24.8607, lng: 67.0011, defaultArea: 'URBAN_CORE' },
  { name: 'Lahore', region: 'Punjab, Pakistan', lat: 31.5204, lng: 74.3587, defaultArea: 'URBAN_CORE' },
  { name: 'Islamabad', region: 'Islamabad, Pakistan', lat: 33.6844, lng: 73.0479, defaultArea: 'URBAN' },
  { name: 'Rawalpindi', region: 'Punjab, Pakistan', lat: 33.5651, lng: 73.0169, defaultArea: 'URBAN' },
  { name: 'Peshawar', region: 'Khyber Pakhtunkhwa, Pakistan', lat: 34.0151, lng: 71.5249, defaultArea: 'URBAN' },
  { name: 'Quetta', region: 'Balochistan, Pakistan', lat: 30.1798, lng: 66.975, defaultArea: 'URBAN' },
  { name: 'Kabul', region: 'Kabul, Afghanistan', lat: 34.5553, lng: 69.2075, defaultArea: 'URBAN_CORE' },
  { name: 'Herat', region: 'Herat, Afghanistan', lat: 34.3529, lng: 62.204, defaultArea: 'URBAN' },
  { name: 'Jalalabad', region: 'Nangarhar, Afghanistan', lat: 34.4342, lng: 70.4478, defaultArea: 'URBAN' },
  { name: 'Kandahar', region: 'Kandahar, Afghanistan', lat: 31.6289, lng: 65.7372, defaultArea: 'URBAN' },
  { name: 'Mazar-i-Sharif', region: 'Balkh, Afghanistan', lat: 36.7069, lng: 67.1122, defaultArea: 'URBAN' },
]
const drivers = [
  { email:'driver.ali@wrapbid.test',name:'Ali Raza',phone:'+92 300 555 0142',make:'Suzuki',model:'Alto',year:2020,color:'White',bodyType:'HATCHBACK',plate:'LEA-2046',home:'Rawalpindi',work:'Islamabad',area:'URBAN',condition:4,panels:['DRIVER_DOOR','REAR_WINDSHIELD'] },
  { email:'driver.farid@wrapbid.test',name:'Farid Ahmadi',phone:'+93 70 555 0142',make:'Toyota',model:'Corolla',year:2021,color:'Silver',bodyType:'SEDAN',plate:'KBL-5821',home:'Kabul',work:'Kabul',area:'URBAN_CORE',condition:3,panels:['DRIVER_DOOR','TAILGATE'] },
  { email:'driver.hassan@wrapbid.test',name:'Hassan Khan',phone:'+92 300 555 0188',make:'Suzuki',model:'Mehran',year:2018,color:'White',bodyType:'HATCHBACK',plate:'RIP-3188',home:'Rawalpindi',work:'Islamabad',area:'URBAN',condition:3,panels:['DRIVER_DOOR','TAILGATE'] },
] as const

async function main(){
  for(const c of cities) await prisma.city.upsert({where:{name_region:{name:c.name,region:c.region}},update:c,create:c})
  const passwordHash=await bcrypt.hash('demo1234',10)
  for(const d of drivers){
    const user=await prisma.user.upsert({where:{email:d.email},update:{name:d.name,phone:d.phone},create:{email:d.email,passwordHash,name:d.name,phone:d.phone,role:'DRIVER'}})
    const existing=await prisma.vehicle.findFirst({where:{driverId:user.id,plateNumber:d.plate}})
    if(existing){
      await prisma.vehicle.update({where:{id:existing.id},data:{make:d.make,model:d.model,year:d.year,color:d.color,bodyType:d.bodyType}})
      continue
    }
    const home=cities.find(c=>c.name===d.home)!;const work=cities.find(c=>c.name===d.work)!
    const exposure=computeExposure({home,work,commuteDaysPerWeek:6,areaType:d.area,parkingType:d.home==='Kabul'?'STREET_BUSY':'LOT'})
    const vehicle=await prisma.vehicle.create({data:{driverId:user.id,make:d.make,model:d.model,year:d.year,color:d.color,bodyType:d.bodyType,plateNumber:d.plate,verificationStatus:'VERIFIED',verifiedAt:new Date(),conditionRating:d.condition,commute:{create:{homeLabel:`${home.name}, ${home.region}`,homeLat:home.lat,homeLng:home.lng,workLabel:`${work.name}, ${work.region}`,workLat:work.lat,workLng:work.lng,commuteDaysPerWeek:6,areaType:d.area,parkingType:d.home==='Kabul'?'STREET_BUSY':'LOT',straightLineKm:exposure.straightLineKm,roadKm:exposure.roadKm,monthlyKm:exposure.monthlyKm,estMonthlyImpressions:exposure.estMonthlyImpressions,exposureScore:exposure.exposureScore}}}})
    for(const code of d.panels){const panel=await prisma.panelType.findUniqueOrThrow({where:{code}});const rent=startingRentCents(panel.baseRateCents,exposure.exposureScore);await prisma.panelListing.create({data:{vehicleId:vehicle.id,panelTypeCode:code,startingRentCents:rent,currentRentCents:rent,termMonths:3,baseRateSnapshotCents:panel.baseRateCents,exposureSnapshot:exposure.exposureScore,auctionEndsAt:new Date(Date.now()+5*86_400_000)}})}
  }
  console.log('Regional demo data ready: Pakistan and Afghanistan.')
}
main().finally(()=>prisma.$disconnect())
