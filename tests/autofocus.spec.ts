import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'

import { vAutofocus } from '../src/directives/autofocus'

const TestComponent = {
  template: `<input v-autofocus />`
}

describe('autofocus directive', () => {
  test('el input tiene método focus', () => {
    const wrapper = mount(TestComponent, {
      global: { 
        directives: { 
          autofocus: vAutofocus 
        } 
      }
    })

    const input = wrapper.find('input').element
    expect(typeof (input as HTMLInputElement).focus).toBe('function')
  })
})