import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import { vAuthVisible } from '../src/directives/authVisible'

const TestComponent = {
  template: `<div v-authVisible="true">Hola</div>`
}

describe('authVisible directive', () => {
  test('monta la directiva sin errores', () => {
    const wrapper = mount(TestComponent, {
      global: { 
        directives: { 
          authVisible: vAuthVisible 
        } 
      }
    })

    expect(wrapper.exists()).toBe(true)
  })
})