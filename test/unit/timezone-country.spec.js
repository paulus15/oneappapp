import { describe, expect, it } from 'vitest'
import tz from 'moment-timezone'
import { pickCountry } from '@/utils/timezoneCountry'

const ALL = ['BF', 'CI', 'SN', 'ML', 'GN', 'TG', 'NG', 'BJ', 'CM', 'FR', 'MC']

describe('country from the browser time zone', () => {
  it('picks the country that owns a shared zone', () => {
    // Africa/Abidjan also covers BF, SN, ML…: only CI has no other zone.
    expect(pickCountry('Africa/Abidjan', ['fr-FR'], ALL, tz)).toBe('CI')
    expect(pickCountry('Africa/Lagos', ['en'], ALL, tz)).toBe('NG')
    expect(pickCountry('Europe/Paris', ['fr'], ALL, tz)).toBe('FR')
  })

  it('lets the browser language region break the tie', () => {
    expect(pickCountry('Africa/Abidjan', ['fr-SN', 'fr'], ALL, tz)).toBe('SN')
    expect(pickCountry('Africa/Lagos', ['fr-BJ'], ALL, tz)).toBe('BJ')
  })

  it('ignores a language region the zone does not cover', () => {
    expect(pickCountry('Europe/Paris', ['fr-CI'], ALL, tz)).toBe('FR')
  })

  it('only returns active countries', () => {
    expect(pickCountry('Africa/Abidjan', ['fr'], ['SN', 'NG'], tz)).toBe('SN')
    expect(pickCountry('Europe/Paris', ['fr'], ['CI'], tz)).toBeNull()
  })

  it('returns null when ambiguous or unknown', () => {
    // CI inactive: BF, SN, ML… remain and none owns the zone alone.
    expect(
      pickCountry('Africa/Abidjan', ['fr'], ['BF', 'SN', 'ML'], tz)
    ).toBeNull()
    expect(pickCountry('Mars/Olympus', ['fr'], ALL, tz)).toBeNull()
    expect(pickCountry('', ['fr'], ALL, tz)).toBeNull()
  })
})
