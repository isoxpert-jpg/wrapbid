import {describe,expect,it} from 'vitest'
import {checkPlotterFit,DEFAULT_PLOTTER} from './plotterProfiles'
describe('MYJET plotter profile',()=>{
  it('includes 5 mm bleed on every edge',()=>expect(checkPlotterFit(92,43)).toMatchObject({fits:true,crossRollMm:440,feedLengthMm:930}))
  it('rejects oversized art in both orientations',()=>expect(checkPlotterFit(200,180,0,DEFAULT_PLOTTER).fits).toBe(false))
})
