'use client'
import type { VehiclePanelCode } from '@/lib/vehiclePanels'

const areas:Record<VehiclePanelCode,{left:string;top:string;width:string;height:string;rear?:boolean}>={
  DRIVER_DOOR:{left:'47%',top:'43%',width:'19%',height:'20%'},PASSENGER_DOOR:{left:'47%',top:'43%',width:'19%',height:'20%'},
  REAR_WINDSHIELD:{left:'48%',top:'25%',width:'18%',height:'15%',rear:true},TAILGATE:{left:'61%',top:'40%',width:'26%',height:'18%',rear:true},
  REAR_QUARTER:{left:'43%',top:'42%',width:'14%',height:'17%',rear:true},HOOD:{left:'18%',top:'39%',width:'20%',height:'14%'},ROOF:{left:'44%',top:'25%',width:'20%',height:'12%'},
}
export function RealisticVehiclePreview({panelCode,artworkUrl,scale,offsetX,offsetY,rotation}:{panelCode:VehiclePanelCode;artworkUrl:string;scale:number;offsetX:number;offsetY:number;rotation:number}){
  const a=areas[panelCode]
  return <div className="relative aspect-[3/2] w-full overflow-hidden border-4 bg-[#d8d4c9]" style={{borderColor:'var(--ink)'}}><img src={a.rear?'/vehicles/ford-f150-2016/rear-three-quarter.png':'/vehicles/ford-f150-2016/driver-side.png'} alt="Photorealistic 2016 full-size pickup reference" className="absolute inset-0 h-full w-full object-contain"/><img src={artworkUrl} alt="Artwork positioned on vehicle" className="absolute object-cover shadow-lg" style={{left:`calc(${a.left} + ${offsetX*100}%)`,top:`calc(${a.top} - ${offsetY*100}%)`,width:a.width,height:a.height,transform:`scale(${scale}) rotate(${rotation}rad)`,transformOrigin:'center',clipPath:a.rear?'polygon(3% 4%, 100% 0, 100% 95%, 0 100%)':undefined}}/><span className="absolute bottom-3 left-3 badge badge-neutral">Photorealistic reference · placement estimate</span></div>
}
