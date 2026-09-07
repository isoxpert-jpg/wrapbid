'use client'

import { useEffect, useState } from 'react'
import { CarPanelMockup } from './CarPanelMockup'

export function PublicStudio(){
  const [artwork,setArtwork]=useState('/api/placeholder/Your%20Brand/1a56db')
  const [name,setName]=useState('Sample artwork')
  const [localUrl,setLocalUrl]=useState<string|null>(null)
  useEffect(()=>()=>{if(localUrl)URL.revokeObjectURL(localUrl)},[localUrl])
  return <div className="grid gap-5 lg:grid-cols-[300px_1fr]"><aside className="card p-5"><h2 className="font-bold">Try your artwork</h2><p className="mt-1 text-sm muted">Choose an image from your device. This public preview stays in your browser and is not uploaded or saved.</p><label className="mt-4 block"><span className="label">PNG, JPEG or WebP</span><input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(localUrl)URL.revokeObjectURL(localUrl);const url=URL.createObjectURL(file);setLocalUrl(url);setArtwork(url);setName(file.name)}}/></label><button className="btn btn-secondary mt-3" type="button" onClick={()=>{if(localUrl)URL.revokeObjectURL(localUrl);setLocalUrl(null);setArtwork('/api/placeholder/Your%20Brand/1a56db');setName('Sample artwork')}}>Reset sample</button><div className="mt-6 border-t pt-4 text-sm" style={{borderColor:'var(--line)'}}><h3 className="font-semibold">For drivers</h3><p className="mt-1 muted">Explore which part of your car you are comfortable offering.</p><h3 className="mt-4 font-semibold">For brands</h3><p className="mt-1 muted">Compare visibility before creating a campaign or placing a bid.</p></div></aside><section className="card p-5"><div className="mb-4"><span className="badge badge-brand">Public preview</span><h2 className="mt-2 text-xl font-bold">{name}</h2><p className="text-sm muted">Select each panel below the vehicle.</p></div><CarPanelMockup artworkUrl={artwork} artworkName={name}/></section></div>
}
