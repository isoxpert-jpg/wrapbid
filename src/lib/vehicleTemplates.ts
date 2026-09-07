import type { BodyType } from './constants'
import { panelsFor, type VehiclePanelDefinition } from './vehiclePanels'

export type VehicleTemplate={id:string;make:string;model:string;generationLabel:string;yearFrom:number;yearTo:number;bodyType:BodyType;glbPath:string|null;previewPath?:string;meshConfidence?:'DRAFT'|'LICENSED';realDimensionsMm:{length:number;width:number;height:number;wheelbase?:number};dimensionConfidence:'MANUFACTURER'|'ESTIMATED';panels:VehiclePanelDefinition[];nearestFor?:{make:string;model:string}[]}
const generic=(id:string,bodyType:BodyType,d:[number,number,number]):VehicleTemplate=>({id,make:'Generic',model:bodyType.toLowerCase(),generationLabel:'Generic body template',yearFrom:2000,yearTo:2099,bodyType,glbPath:`/vehicles/${id}/vehicle.glb`,previewPath:'/budget-hatchback-mockup.png',realDimensionsMm:{length:d[0],width:d[1],height:d[2]},dimensionConfidence:'ESTIMATED',panels:panelsFor(d[0]/1000,d[1]/1000,d[2]/1000)})
export const VEHICLE_TEMPLATES:VehicleTemplate[]=[
  generic('generic-sedan','SEDAN',[4550,1760,1470]),generic('generic-suv','SUV',[4550,1840,1720]),generic('generic-hatchback','HATCHBACK',[3650,1620,1480]),generic('generic-pickup','PICKUP',[5150,1880,1720]),
  {id:'suzuki-alto-2019-2024',make:'Suzuki',model:'Alto',generationLabel:'2019-2024 Higgsfield calibrated draft',yearFrom:2019,yearTo:2024,bodyType:'HATCHBACK',glbPath:'/vehicles/suzuki-alto-2020/vehicle.glb',previewPath:'/vehicles/suzuki-alto-2020/preview.png',meshConfidence:'DRAFT',realDimensionsMm:{length:3395,width:1475,height:1490,wheelbase:2460},dimensionConfidence:'ESTIMATED',panels:panelsFor(3.395,1.475,1.49)},
  {id:'toyota-corolla-2020-2023',make:'Toyota',model:'Corolla',generationLabel:'2020-2023 Higgsfield calibrated draft',yearFrom:2020,yearTo:2023,bodyType:'SEDAN',glbPath:'/vehicles/toyota-corolla-2020/vehicle.glb',previewPath:'/vehicles/toyota-corolla-2020/preview.png',meshConfidence:'DRAFT',realDimensionsMm:{length:4630,width:1780,height:1435,wheelbase:2700},dimensionConfidence:'MANUFACTURER',panels:panelsFor(4.63,1.78,1.435)},
  {id:'suzuki-mehran-2012-2019',make:'Suzuki',model:'Mehran',generationLabel:'2012-2019 Higgsfield calibrated draft',yearFrom:2012,yearTo:2019,bodyType:'HATCHBACK',glbPath:'/vehicles/suzuki-mehran-2018/vehicle.glb',previewPath:'/vehicles/suzuki-mehran-2018/preview.png',meshConfidence:'DRAFT',realDimensionsMm:{length:3300,width:1405,height:1410,wheelbase:2175},dimensionConfidence:'ESTIMATED',panels:panelsFor(3.3,1.405,1.41)},
]
export type TemplateMatchType='EXACT'|'NEAREST'|'GENERIC'|'NONE'
export function getVehicleTemplate(input:{make:string;model:string;year:number;bodyType:string}):{template:VehicleTemplate|null;matchType:TemplateMatchType}{
  const same=VEHICLE_TEMPLATES.filter(t=>t.make.toLowerCase()===input.make.toLowerCase()&&t.model.toLowerCase()===input.model.toLowerCase()&&t.make!=='Generic')
  const exact=same.find(t=>input.year>=t.yearFrom&&input.year<=t.yearTo&&t.glbPath);if(exact)return{template:exact,matchType:'EXACT'}
  const nearest=same.filter(t=>t.glbPath).sort((a,b)=>Math.abs(input.year-a.yearFrom)-Math.abs(input.year-b.yearFrom))[0];if(nearest)return{template:nearest,matchType:'NEAREST'}
  const generic=VEHICLE_TEMPLATES.find(t=>t.make==='Generic'&&t.bodyType===input.bodyType);return generic?{template:generic,matchType:'GENERIC'}:{template:null,matchType:'NONE'}
}
