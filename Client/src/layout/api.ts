import type { LayoutDefinition } from './schema'

export async function fetchCurrentLayout(): Promise<LayoutDefinition> {
  const response = await fetch('/api/layout')

  if (!response.ok) {
    throw new Error(`Layout request failed with status ${response.status}.`)
  }

  return await response.json() as LayoutDefinition
}