import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

globalThis.FileReader=class{result=null;onloadend=null;readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;queueMicrotask(()=>this.onloadend?.())})}}

const types={
  'generic-sedan':{l:4.55,w:1.76,h:1.47,cabin:[2.35,.95,1.48]},
  'generic-suv':{l:4.55,w:1.84,h:1.72,cabin:[2.55,1.12,1.58]},
  'generic-hatchback':{l:3.65,w:1.62,h:1.48,cabin:[2.18,1.0,1.44]},
  'generic-pickup':{l:5.15,w:1.88,h:1.72,cabin:[1.85,1.08,1.6]},
}
const exporter=new GLTFExporter()
for(const [id,d] of Object.entries(types)){
  const scene=new THREE.Scene();const paint=new THREE.MeshStandardMaterial({color:0xe8e5dc,metalness:.25,roughness:.38});const dark=new THREE.MeshStandardMaterial({color:0x202522,roughness:.55})
  const box=(name,size,pos,mat=paint)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.name=name;m.position.set(...pos);scene.add(m)}
  box('Body',[d.l,.58,d.w],[0,.63,0]);box('Cabin',d.cabin,[id==='generic-pickup'?-1.05:0,.63+d.cabin[1]/2,0],paint)
  for(const side of [-1,1])for(const x of [-d.l*.31,d.l*.31]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.2,24),dark);m.name='Wheel';m.rotation.x=Math.PI/2;m.position.set(x,.35,side*(d.w/2+.02));scene.add(m)}
  const panelNames=['Door_FL','Door_FR','Door_RL','Door_RR','Hood','Roof','Trunk','RearGlass'];for(const name of panelNames){const marker=new THREE.Object3D();marker.name=name;scene.add(marker)}
  const dir=path.join('public','vehicles',id);await mkdir(dir,{recursive:true});const data=await new Promise((resolve,reject)=>exporter.parse(scene,resolve,reject,{binary:true}));await writeFile(path.join(dir,'vehicle.glb'),Buffer.from(data));await copyFile('public/budget-hatchback-mockup.png',path.join(dir,'preview.webp')).catch(()=>{})
}
