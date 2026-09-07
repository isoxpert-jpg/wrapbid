import { describe, expect, it } from 'vitest'
import { MAX_VEHICLE_AGE_YEARS } from './constants'
import { vehicleSchema } from './validation'

const valid = {
  make: 'Toyota', model: 'Corolla', color: 'White', bodyType: 'SEDAN',
  plateNumber: 'ABC-123', homeLabel: 'Kabul', homeLat: 34.5, homeLng: 69.2,
  workLabel: 'Kabul', workLat: 34.6, workLng: 69.1, commuteDaysPerWeek: 5,
  areaType: 'URBAN', parkingType: 'LOT',
}

describe('vehicle age eligibility', () => {
  it('accepts a vehicle exactly 15 years old', () => {
    expect(vehicleSchema.safeParse({ ...valid, year: new Date().getFullYear() - MAX_VEHICLE_AGE_YEARS }).success).toBe(true)
  })
  it('rejects a vehicle older than 15 years', () => {
    expect(vehicleSchema.safeParse({ ...valid, year: new Date().getFullYear() - MAX_VEHICLE_AGE_YEARS - 1 }).success).toBe(false)
  })
})
