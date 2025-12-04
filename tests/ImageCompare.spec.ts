import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import ImageCompare from '../src/components/ImageCompare.vue'

describe('ImageCompare.vue', () => {
  test('el componente se monta correctamente', () => {
    const wrapper = mount(ImageCompare, {
      props: {
        beforeSrc: 'img-antes.jpg',
        afterSrc: 'img-despues.jpg'
      }
    })

    expect(wrapper.exists()).toBe(true)
    
    const images = wrapper.findAll('img')
    expect(images.length).toBeGreaterThanOrEqual(2)
  })
})