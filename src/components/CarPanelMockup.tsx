'use client'

import { useState } from 'react'
import { Vehicle3DViewer } from './Vehicle3DViewer'
import { VEHICLE_TEMPLATES } from '@/lib/vehicleTemplates'
import type { VehiclePanelCode } from '@/lib/vehiclePanels'

const PANELS = [
  ['DRIVER_DOOR','Driver door'],['PASSENGER_DOOR','Passenger door'],['REAR_WINDSHIELD','Rear windshield'],
  ['TAILGATE','Tailgate / trunk'],['REAR_QUARTER','Rear quarter'],['HOOD','Hood'],['ROOF','Roof'],
] as const

export function CarPanelMockup({ artworkUrl, artworkName }: { artworkUrl:string; artworkName:string }) {
  const vehicles=VEHICLE_TEMPLATES.filter(template=>template.meshConfidence==='DRAFT')
  const [vehicleId,setVehicleId]=useState(vehicles[0]?.id??'')
  const [panelCode,setPanelCode]=useState<VehiclePanelCode>('DRIVER_DOOR')
  const vehicle=vehicles.find(template=>template.id===vehicleId)??vehicles[0]
  const panel=vehicle?.panels.find(item=>item.code===panelCode)??vehicle?.panels[0]
  if(!vehicle||!panel)return <div className="grid min-h-96 place-items-center text-sm muted">No calibrated vehicle preview is available.</div>
  return <div>
    <div className="mb-3 flex flex-wrap gap-2" aria-label="Preview vehicle">
      {vehicles.map(template=><button type="button" key={template.id} onClick={()=>setVehicleId(template.id)} className={`btn ${vehicle.id===template.id?'btn-primary':'btn-secondary'}`}>{template.make} {template.model}</button>)}
    </div>
    <Vehicle3DViewer template={vehicle} panel={panel} artworkUrl={artworkUrl} scale={.88} offsetX={0} offsetY={0} rotation={0}/>
    <div className="mt-3 flex flex-wrap gap-2">{PANELS.map(([code,label])=><button type="button" key={code} onClick={()=>setPanelCode(code)} className={`btn ${panel.code===code?'btn-primary':'btn-secondary'}`}>{label}</button>)}</div>
    <p className="mt-3 text-xs muted"><strong>{vehicle.make} {vehicle.model}</strong> · {artworkName} · {panel.label}. Drag to rotate and scroll or pinch to zoom. Placement is a calibrated draft.</p>
  </div>
}
