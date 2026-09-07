import { PDFDocument, degrees, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { getVehicleTemplate } from '@/lib/vehicleTemplates'
import { checkPlotterFit, DEFAULT_PLOTTER } from '@/lib/plotterProfiles'
import { downloadPrivateObject } from '@/lib/storage'

const ptPerCm=72/2.54
export async function GET(request:Request,{params}:{params:Promise<{placementId:string}>}){
 const user=await requireRole('ADVERTISER','ADMIN')
 const placement=await prisma.creativePlacement.findUnique({where:{id:(await params).placementId},include:{creative:{include:{campaign:true}},listing:{include:{panelType:true,vehicle:true,installation:true}}}})
 if(!placement||(user.role!=='ADMIN'&&placement.creative.campaign.advertiserId!==user.id))return new Response('Not found',{status:404})
 const resolved=getVehicleTemplate({make:placement.listing.vehicle.make,model:placement.listing.vehicle.model,year:placement.listing.vehicle.year,bodyType:placement.listing.vehicle.bodyType});const panel=resolved.template?.panels.find(p=>p.code===placement.listing.panelTypeCode)
 if(!panel)return new Response('No printable panel definition',{status:422})
 let artwork:Buffer
 if(placement.creative.filePath.startsWith('/')){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1200"><rect width="100%" height="100%" fill="${placement.creative.dominantHex??'#e84b18'}"/><text x="1200" y="650" text-anchor="middle" font-family="Arial" font-size="96" font-weight="bold" fill="white">${placement.creative.campaign.name.replace(/[<>&]/g,'')}</text></svg>`;artwork=await sharp(Buffer.from(svg)).png().toBuffer()}else artwork=await sharp(await downloadPrivateObject(placement.creative.filePath)).png().toBuffer()
 const qrValue=placement.listing.installation?`${new URL(request.url).origin}/q/${placement.listing.installation.qrSlug}`:`${new URL(request.url).origin}/listing/${placement.listing.id}`
 const qr=await QRCode.toBuffer(qrValue,{type:'png',width:600,margin:2,errorCorrectionLevel:'H'})
 const plotterFit=checkPlotterFit(panel.safeAreaCm.width,panel.safeAreaCm.height);if(!plotterFit.fits)return new Response(`Panel does not fit ${DEFAULT_PLOTTER.configuredPrintableWidthMm} mm printable width`,{status:422})
 const pdf=await PDFDocument.create();pdf.setTitle(`${placement.creative.fileName} - ${panel.label}`);pdf.setSubject(`${DEFAULT_PLOTTER.label}; ${plotterFit.crossRollMm} mm across roll; ${plotterFit.feedLengthMm} mm feed; verify media, ICC profile, passes and heater settings before printing`);pdf.setKeywords(['Wrapbid','MYJET 1.8m','Epson i3200-E1','eco-solvent','vehicle wrap']);pdf.setProducer('Wrapbid Studio')
 const bleedCm=.5,trimW=panel.safeAreaCm.width,trimH=panel.safeAreaCm.height,pageW=(trimW+bleedCm*2)*ptPerCm,pageH=(trimH+bleedCm*2)*ptPerCm;const page=pdf.addPage([pageW,pageH]);const image=await pdf.embedPng(artwork);const qrImage=await pdf.embedPng(qr)
 const boxW=trimW*placement.scale*ptPerCm,boxH=trimH*placement.scale*ptPerCm;const fit=Math.min(boxW/image.width,boxH/image.height);const drawW=image.width*fit,drawH=image.height*fit;const centerX=(bleedCm+trimW/2+placement.offsetX*100)*ptPerCm,centerY=(bleedCm+trimH/2+placement.offsetY*100)*ptPerCm
 page.drawRectangle({x:bleedCm*ptPerCm,y:bleedCm*ptPerCm,width:trimW*ptPerCm,height:trimH*ptPerCm,color:rgb(1,1,1)})
 page.drawImage(image,{x:centerX-drawW/2,y:centerY-drawH/2,width:drawW,height:drawH,rotate:degrees(placement.rotation*180/Math.PI)})
 const qrCm=Math.min(trimW,trimH)*.15,qrX=(bleedCm+trimW-qrCm-1)*ptPerCm,qrY=(bleedCm+1)*ptPerCm;page.drawRectangle({x:qrX-2,y:qrY-2,width:qrCm*ptPerCm+4,height:qrCm*ptPerCm+4,color:rgb(1,1,1)});page.drawImage(qrImage,{x:qrX,y:qrY,width:qrCm*ptPerCm,height:qrCm*ptPerCm})
 const mark=bleedCm*.75*ptPerCm,trimX=bleedCm*ptPerCm,trimY=bleedCm*ptPerCm,trimXP=(bleedCm+trimW)*ptPerCm,trimYP=(bleedCm+trimH)*ptPerCm;for(const [x1,y1,x2,y2] of [[trimX-mark,trimY,trimX-2,trimY],[trimX,trimY-mark,trimX,trimY-2],[trimXP+2,trimY,trimXP+mark,trimY],[trimXP,trimY-mark,trimXP,trimY-2],[trimX-mark,trimYP,trimX-2,trimYP],[trimX,trimYP+2,trimX,trimYP+mark],[trimXP+2,trimYP,trimXP+mark,trimYP],[trimXP,trimYP+2,trimXP,trimYP+mark]])page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},thickness:.5,color:rgb(0,0,0)})
 const bytes=await pdf.save();const inline=new URL(request.url).searchParams.get('mode')==='inline';const safe=placement.creative.fileName.replace(/[^a-z0-9.-]+/gi,'-')
 return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`${inline?'inline':'attachment'}; filename="${safe}-${panel.code}.pdf"`,'Cache-Control':'private, no-store'}})
}
