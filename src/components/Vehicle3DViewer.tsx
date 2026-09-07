'use client'
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { VehicleTemplate } from '@/lib/vehicleTemplates'
import type { VehiclePanelDefinition } from '@/lib/vehiclePanels'
import { uniformScaleForLength } from '@/lib/vehicle3d'

class VehiclePreviewBoundary extends Component<{children:ReactNode;fallbackImage:string},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){
    if(this.state.failed)return <div className="grid h-[520px] place-items-center border-4 bg-[#d8d4c9] p-8 text-center" style={{borderColor:'var(--ink)'}}><div><img src={this.props.fallbackImage} alt="Vehicle preview fallback" className="mx-auto max-h-72 object-contain"/><p className="mt-4 text-sm muted">The interactive model could not load. Panel dimensions and the production export remain available.</p></div></div>
    return this.props.children
  }
}

function Vehicle({template,panel,artworkUrl,scale,offsetX,offsetY,rotation}:{template:VehicleTemplate;panel:VehiclePanelDefinition;artworkUrl:string;scale:number;offsetX:number;offsetY:number;rotation:number}){
  const gltf=useGLTF(template.glbPath!)
  const texture=useTexture(artworkUrl);texture.colorSpace=THREE.SRGBColorSpace
  const scene=useMemo(()=>gltf.scene.clone(true),[gltf.scene])
  const normalized=useMemo(()=>{const box=new THREE.Box3().setFromObject(scene);return uniformScaleForLength(box.getSize(new THREE.Vector3()).x,template.realDimensionsMm.length/1000)??1},[scene,template])
  const qr=useMemo(()=>{const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d')!;x.fillStyle='white';x.fillRect(0,0,96,96);x.fillStyle='black';for(let i=0;i<9;i++)for(let j=0;j<9;j++)if((i*j+i+j)%3!==0)x.fillRect(5+i*9,5+j*9,8,8);return new THREE.CanvasTexture(c)},[])
  const controls=useRef<any>(null);const {camera}=useThree()
  useEffect(()=>{camera.position.set(...panel.preferredCamera.position);controls.current?.target.set(...panel.preferredCamera.target);controls.current?.update()},[camera,panel])
  const [pw,ph]=panel.anchor.scale
  return <><primitive object={scene} scale={normalized}/><mesh position={[panel.anchor.position[0]+offsetX,panel.anchor.position[1]+offsetY,panel.anchor.position[2]]} rotation={[panel.anchor.rotation[0],panel.anchor.rotation[1],panel.anchor.rotation[2]+rotation]}><planeGeometry args={[pw*scale,ph*scale]}/><meshStandardMaterial map={texture} transparent polygonOffset polygonOffsetFactor={-4}/></mesh><mesh position={[panel.anchor.position[0]+offsetX+pw*scale*(panel.qrAnchor.x-.5),panel.anchor.position[1]+offsetY+ph*scale*(.5-panel.qrAnchor.y),panel.anchor.position[2]+.008]} rotation={panel.anchor.rotation}><planeGeometry args={[Math.min(pw,ph)*.16,Math.min(pw,ph)*.16]}/><meshBasicMaterial map={qr}/></mesh><OrbitControls ref={controls} enablePan={false} minDistance={3} maxDistance={9}/></>
}
export function Vehicle3DViewer(props:{template:VehicleTemplate;panel:VehiclePanelDefinition;artworkUrl:string;scale:number;offsetX:number;offsetY:number;rotation:number}){return <VehiclePreviewBoundary fallbackImage={props.template.previewPath??'/budget-hatchback-mockup.png'}><div className="h-[520px] overflow-hidden border-4 bg-[#d8d4c9]" style={{borderColor:'var(--ink)'}}><Canvas camera={{position:props.panel.preferredCamera.position,fov:36}} shadows><color attach="background" args={['#d8d4c9']}/><ambientLight intensity={1.4}/><directionalLight position={[-4,7,4]} intensity={2.2}/><Suspense fallback={<Html center><span className="badge badge-neutral">Loading 3D vehicle...</span></Html>}><Vehicle {...props}/><Environment preset="warehouse"/></Suspense></Canvas></div></VehiclePreviewBoundary>}
