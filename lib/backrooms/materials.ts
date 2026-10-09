import * as THREE from 'three'
import { MAT_COLORS, type MatKey } from './props'
import { getTextures } from './textures'

export interface MaterialSet {
  wall: [THREE.Material, THREE.Material]
  baseboard: [THREE.Material, THREE.Material]
  carpet: [THREE.Material, THREE.Material]
  ceiling: [THREE.Material, THREE.Material]
  props: Record<MatKey, THREE.Material>
  panel: THREE.MeshBasicMaterial
  metalTex: THREE.Material
  concrete: THREE.Material
  paintedConcrete: THREE.Material
  rail: THREE.Material
  fireDoor: THREE.Material
  exit: THREE.Material
}

let cache: MaterialSet | null = null

export function getMaterials(): MaterialSet {
  if (cache) return cache
  const t = getTextures()
  const lambert = (opts: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(opts)
  const props = {} as Record<MatKey, THREE.Material>
  for (const key of Object.keys(MAT_COLORS) as MatKey[]) {
    props[key] =
      key === 'led'
        ? new THREE.MeshBasicMaterial({ color: MAT_COLORS.led, toneMapped: false })
        : lambert({ color: MAT_COLORS[key] })
  }
  cache = {
    wall: [lambert({ map: t.wallA }), lambert({ map: t.wallB })],
    baseboard: [lambert({ color: '#b9ac3a' }), lambert({ color: '#a8946a' })],
    carpet: [lambert({ map: t.carpetA }), lambert({ map: t.carpetB })],
    ceiling: [lambert({ map: t.ceilA }), lambert({ map: t.ceilB })],
    props,
    panel: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    metalTex: lambert({ map: t.metal }),
    concrete: lambert({ map: t.concrete }),
    paintedConcrete: lambert({ map: t.concrete, color: '#d8d3b4' }),
    rail: lambert({ color: '#9c3a2a' }),
    fireDoor: lambert({ color: '#8a3b2c' }),
    exit: new THREE.MeshBasicMaterial({ map: t.exit, toneMapped: false }),
  }
  return cache
}
