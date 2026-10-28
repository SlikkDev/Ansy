import { describe, expect, it } from 'vitest'
import { isAvailableExperience } from '../../src/shared/experiences'
import { en } from '../../src/shared/i18n/en'
import { isTaskId, tasks } from '../../src/shared/tasks'

describe('tasks', () => {
  it('has a name, a goal and steps for every task', () => {
    for (const { id } of tasks) {
      expect(en).toHaveProperty(`task.${id}`)
      expect(en).toHaveProperty(`task.${id}.goal`)
      expect(en[`task.${id}.steps`].split('\n').length).toBeGreaterThanOrEqual(3)
    }
  })

  it('suggests only experiences that work today', () => {
    for (const { experiences } of tasks) {
      expect(experiences.length).toBeGreaterThan(0)
      for (const id of experiences) expect(isAvailableExperience(id)).toBe(true)
    }
  })

  it('knows its ids', () => {
    expect(isTaskId('form')).toBe(true)
    expect(isTaskId('nap')).toBe(false)
  })
})
