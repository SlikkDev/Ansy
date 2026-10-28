/**
 * The guided tasks: three things every visitor tries to do on a site, each
 * with a goal, steps, and the experiences that show where it breaks. The text
 * lives in the string tables; this is the table itself.
 */

import type { ExperienceId } from './experiences'

export type TaskId = 'contact' | 'form' | 'purchase'

export interface TaskInfo {
  id: TaskId
  /** The experiences worth trying the task with, in the order they are offered. */
  experiences: readonly ExperienceId[]
}

export const tasks: readonly TaskInfo[] = [
  { id: 'contact', experiences: ['keyboard', 'zoom', 'blurLowContrast', 'scan'] },
  { id: 'form', experiences: ['keyboard', 'largeText', 'highContrast', 'scan'] },
  { id: 'purchase', experiences: ['keyboard', 'colorBlindness', 'zoom', 'motion'] },
]

export const taskIds: readonly TaskId[] = tasks.map((task) => task.id)

export function isTaskId(value: unknown): value is TaskId {
  return typeof value === 'string' && (taskIds as readonly string[]).includes(value)
}
