export type PlotterProfile={id:string;label:string;nominalMediaWidthMm:number;configuredPrintableWidthMm:number;head:string;inkFamily:string;colorChannels:string}

export const DEFAULT_PLOTTER:PlotterProfile={
  id:'MYJET_1800_I3200_E1_1H',label:'MYJET 1.8 m · single Epson i3200-E1',
  nominalMediaWidthMm:1800,configuredPrintableWidthMm:1750,
  head:'1 × Epson i3200-E1',inkFamily:'Eco-solvent',colorChannels:'CMYK',
}

export function checkPlotterFit(widthCm:number,heightCm:number,bleedCm=.5,profile=DEFAULT_PLOTTER){
  const totalWidthMm=(widthCm+bleedCm*2)*10,totalHeightMm=(heightCm+bleedCm*2)*10
  const crossRollMm=Math.min(totalWidthMm,totalHeightMm),feedLengthMm=Math.max(totalWidthMm,totalHeightMm)
  return {fits:crossRollMm<=profile.configuredPrintableWidthMm,crossRollMm,feedLengthMm,headroomMm:profile.configuredPrintableWidthMm-crossRollMm}
}
