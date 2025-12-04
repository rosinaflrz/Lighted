import { describe, test, expect } from 'vitest'

import * as editService from '../src/services/editSession'

describe('editSession service', () => {
  test('existe la función updateFilter', () => {
    expect(typeof editService.updateFilter).toBe('function')
  })

  test('existe la función resetSession', () => {
    expect(typeof editService.resetSession).toBe('function')
  })
})