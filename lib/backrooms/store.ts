import { useSyncExternalStore } from 'react'
import { FLOOR_H, FLOORS, LOBBY, CELL } from './constants'
import { generateBuilding, type FloorData } from './world-generator'

/** Mutable per-frame state (read/written inside useFrame, never triggers React renders). */
export const game = {
  floors: [] as FloorData[],
  player: { x: 0, z: 0, feet: 0, yaw: Math.PI, pitch: 0, bob: 0, speed: 0 },
  input: {
    keys: new Set<string>(),
    joyX: 0,
    joyY: 0,
    lookDX: 0,
    lookDY: 0,
    interactQueued: false,
  },
  shake: 0,
}

export const floorOf = (feet: number) => Math.max(0, Math.min(FLOORS - 1, Math.floor((feet + FLOOR_H * 0.3) / FLOOR_H)))

/** UI-facing state with subscriptions. */
export interface UiState {
  seed: number
  floor: number
  muted: boolean
  started: boolean
  locked: boolean
  isTouch: boolean
  target: string | null
}

let ui: UiState = {
  seed: 0,
  floor: 0,
  muted: false,
  started: false,
  locked: false,
  isTouch: false,
  target: null,
}
const listeners = new Set<() => void>()

export function setUi(patch: Partial<UiState>) {
  let changed = false
  for (const k in patch) {
    const key = k as keyof UiState
    if (ui[key] !== patch[key]) changed = true
  }
  if (!changed) return
  ui = { ...ui, ...patch }
  listeners.forEach((l) => l())
}

export const getUi = () => ui

export function useUi<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => selector(ui),
    () => selector(ui),
  )
}

export function resetPlayer() {
  const p = game.player
  p.x = ((LOBBY.cx0 + LOBBY.cx1 + 1) / 2) * CELL
  p.z = (LOBBY.cz0 + 1.2) * CELL
  p.feet = 0
  p.yaw = Math.PI
  p.pitch = 0
}

export function loadSeed(seed: number) {
  game.floors = generateBuilding(seed, FLOORS)
  resetPlayer()
  setUi({ seed, floor: 0 })
}

export const randomSeed = () => 1000 + Math.floor(Math.random() * 9000)
