import { describe,expect,it } from 'vitest'
import { artworkDpi,uniformScaleForLength } from './vehicle3d'
describe('3D normalization',()=>{it('uses a uniform target-length scale',()=>expect(uniformScaleForLength(2,4.6)).toBe(2.3));it('rejects invalid bounds',()=>expect(uniformScaleForLength(0,4.6)).toBeNull())})
describe('print DPI',()=>{it('calculates both axes and limiting DPI',()=>expect(artworkDpi(2400,1200,92,43)).toMatchObject({widthDpi:66,heightDpi:71,effectiveDpi:66}));it('returns 100 DPI recommendations',()=>expect(artworkDpi(1,1,92,43)).toMatchObject({recommendedWidthPx:3623,recommendedHeightPx:1693}))})
