import { describe, test, expect } from 'vitest'

import * as projectService from '../src/services/projects'

describe('projects service', () => {
  test('existe getAllProjects', () => {
    expect(typeof projectService.getAllProjects).toBe('function')
  })

  test('existe createProject', () => {
    expect(typeof projectService.createProject).toBe('function')
  })
})