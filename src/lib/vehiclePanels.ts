export type DimensionConfidence='MANUFACTURER'|'MEASURED'|'PROFESSIONAL_TEMPLATE'|'ESTIMATED'
export type VehiclePanelCode='DRIVER_DOOR'|'PASSENGER_DOOR'|'REAR_WINDSHIELD'|'TAILGATE'|'REAR_QUARTER'|'HOOD'|'ROOF'
export type VehiclePanelDefinition={code:VehiclePanelCode;label:string;safeAreaCm:{width:number;height:number};dimensionConfidence:DimensionConfidence;anchor:{position:[number,number,number];rotation:[number,number,number];scale:[number,number]};preferredCamera:{position:[number,number,number];target:[number,number,number]};qrAnchor:{x:number;y:number};meshNames?:string[]}

export function panelsFor(length:number,width:number,height:number):VehiclePanelDefinition[]{
  const estimated='ESTIMATED' as const
  return [
    {code:'DRIVER_DOOR',label:'Driver door',safeAreaCm:{width:92,height:43},dimensionConfidence:estimated,anchor:{position:[-.25,height*.55,width/2+.012],rotation:[0,0,0],scale:[.92,.43]},preferredCamera:{position:[0,1.3,5],target:[0,.8,0]},qrAnchor:{x:.88,y:.84},meshNames:['Door_FL','Door_RL']},
    {code:'PASSENGER_DOOR',label:'Passenger door',safeAreaCm:{width:92,height:43},dimensionConfidence:estimated,anchor:{position:[-.25,height*.55,-width/2-.012],rotation:[0,Math.PI,0],scale:[.92,.43]},preferredCamera:{position:[0,1.3,-5],target:[0,.8,0]},qrAnchor:{x:.88,y:.84},meshNames:['Door_FR','Door_RR']},
    {code:'REAR_WINDSHIELD',label:'Rear windshield',safeAreaCm:{width:105,height:38},dimensionConfidence:estimated,anchor:{position:[length/2+.012,height*.72,0],rotation:[0,Math.PI/2,0],scale:[1.05,.38]},preferredCamera:{position:[5,1.8,3],target:[0,.9,0]},qrAnchor:{x:.88,y:.84},meshNames:['RearGlass']},
    {code:'TAILGATE',label:'Tailgate / trunk',safeAreaCm:{width:96,height:38},dimensionConfidence:estimated,anchor:{position:[length/2+.014,height*.48,0],rotation:[0,Math.PI/2,0],scale:[.96,.38]},preferredCamera:{position:[5,1.5,2.5],target:[0,.7,0]},qrAnchor:{x:.88,y:.84},meshNames:['Trunk']},
    {code:'REAR_QUARTER',label:'Rear quarter',safeAreaCm:{width:48,height:32},dimensionConfidence:estimated,anchor:{position:[length*.34,height*.62,width/2+.014],rotation:[0,0,0],scale:[.48,.32]},preferredCamera:{position:[3,1.5,4],target:[1,.8,0]},qrAnchor:{x:.82,y:.82}},
    {code:'HOOD',label:'Hood',safeAreaCm:{width:105,height:55},dimensionConfidence:estimated,anchor:{position:[-length*.34,height*.69,0],rotation:[-Math.PI/2,0,0],scale:[1.05,.55]},preferredCamera:{position:[-4,3.3,3],target:[-1,.6,0]},qrAnchor:{x:.88,y:.84},meshNames:['Hood']},
    {code:'ROOF',label:'Roof',safeAreaCm:{width:90,height:65},dimensionConfidence:estimated,anchor:{position:[0,height+.014,0],rotation:[-Math.PI/2,0,0],scale:[.9,.65]},preferredCamera:{position:[-2,5,3],target:[0,.8,0]},qrAnchor:{x:.88,y:.84},meshNames:['Roof']},
  ]
}
