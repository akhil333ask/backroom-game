import * as THREE from 'three'
import { mulberry32, type Rng } from './rng'

type Ctx = CanvasRenderingContext2D

function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

function toTexture(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
  }
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

/** Per-pixel multiplicative grain. */
function grain(ctx: Ctx, w: number, h: number, rng: Rng, amount: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = 1 + (rng() - 0.5) * amount
    d[i] = Math.min(255, d[i] * n)
    d[i + 1] = Math.min(255, d[i + 1] * n)
    d[i + 2] = Math.min(255, d[i + 2] * n)
  }
  ctx.putImageData(img, 0, 0)
}

/** Soft irregular blotches (wraps horizontally). */
function blotches(ctx: Ctx, w: number, h: number, rng: Rng, count: number, color: string, alpha: number, minR: number, maxR: number, yBias?: [number, number]) {
  ctx.save()
  for (let i = 0; i < count; i++) {
    const x = rng() * w
    const y = yBias ? (yBias[0] + rng() * (yBias[1] - yBias[0])) * h : rng() * h
    const r = minR + rng() * (maxR - minR)
    for (const ox of [-w, 0, w]) {
      const g = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, r)
      g.addColorStop(0, color)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = alpha * (0.5 + rng() * 0.5)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(x + ox, y, r, r * (0.6 + rng() * 0.8), rng() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Water stains: a tide-line blotch near the top with drips running down. */
function waterStains(ctx: Ctx, w: number, h: number, rng: Rng, count: number) {
  ctx.save()
  for (let i = 0; i < count; i++) {
    const x = rng() * w
    const r = 40 + rng() * 90
    const g = ctx.createRadialGradient(x, 0, r * 0.2, x, 0, r)
    g.addColorStop(0, 'rgba(110,90,40,0.0)')
    g.addColorStop(0.75, 'rgba(110,90,40,0.18)')
    g.addColorStop(1, 'rgba(110,90,40,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, 0, r * 2, r)
    const drips = 2 + Math.floor(rng() * 4)
    for (let k = 0; k < drips; k++) {
      const dx = x + (rng() - 0.5) * r
      const len = h * (0.15 + rng() * 0.45)
      const lg = ctx.createLinearGradient(0, 0, 0, len)
      lg.addColorStop(0, 'rgba(100,80,35,0.22)')
      lg.addColorStop(1, 'rgba(100,80,35,0)')
      ctx.fillStyle = lg
      ctx.fillRect(dx, 0, 2 + rng() * 5, len)
    }
  }
  ctx.restore()
}

function bottomGrime(ctx: Ctx, w: number, h: number, alpha: number) {
  const g = ctx.createLinearGradient(0, h * 0.8, 0, h)
  g.addColorStop(0, 'rgba(60,50,20,0)')
  g.addColorStop(1, `rgba(60,50,20,${alpha})`)
  ctx.fillStyle = g
  ctx.fillRect(0, h * 0.8, w, h * 0.2)
}

/** Zone A: yellow-green wallpaper with a faint dotted diamond print. */
function wallpaperA(): THREE.CanvasTexture {
  const W = 1024
  const H = 512
  const rng = mulberry32(11)
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#c4bf72'
  ctx.fillRect(0, 0, W, H)
  blotches(ctx, W, H, rng, 30, 'rgba(230,225,150,1)', 0.25, 60, 180)
  blotches(ctx, W, H, rng, 20, 'rgba(120,115,50,1)', 0.12, 50, 160)
  // Faint vertical stripes
  const step = W / 24
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = 'rgba(150,145,70,0.10)'
    ctx.fillRect(i * step, 0, step * 0.18, H)
  }
  // Dotted diamond print
  ctx.fillStyle = 'rgba(130,125,60,0.35)'
  const px = W / 48
  for (let y = 0; y < H; y += px) {
    for (let x = 0; x < W; x += px) {
      const off = (Math.round(y / px) % 2) * (px / 2)
      ctx.beginPath()
      ctx.arc(x + off, y, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  waterStains(ctx, W, H, rng, 3)
  bottomGrime(ctx, W, H, 0.25)
  grain(ctx, W, H, rng, 0.08)
  return toTexture(c)
}

/** Zone B: pale yellow wallpaper with vertical chevron bands. */
function wallpaperB(): THREE.CanvasTexture {
  const W = 1024
  const H = 512
  const rng = mulberry32(23)
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#d6cc93'
  ctx.fillRect(0, 0, W, H)
  blotches(ctx, W, H, rng, 25, 'rgba(240,232,180,1)', 0.25, 60, 180)
  const bands = 12
  const bw = W / bands
  for (let b = 0; b < bands; b++) {
    const x0 = b * bw
    ctx.fillStyle = 'rgba(170,158,100,0.22)'
    ctx.fillRect(x0 + bw * 0.08, 0, 2, H)
    ctx.fillRect(x0 + bw * 0.92, 0, 2, H)
    ctx.strokeStyle = 'rgba(150,138,85,0.55)'
    ctx.lineWidth = 3
    const cx = x0 + bw / 2
    const ch = bw * 0.35
    for (let y = -ch; y < H + ch; y += ch * 1.6) {
      ctx.beginPath()
      ctx.moveTo(cx - bw * 0.28, y + ch)
      ctx.lineTo(cx, y)
      ctx.lineTo(cx + bw * 0.28, y + ch)
      ctx.stroke()
    }
  }
  waterStains(ctx, W, H, rng, 2)
  bottomGrime(ctx, W, H, 0.3)
  grain(ctx, W, H, rng, 0.07)
  return toTexture(c)
}

function carpet(base: string, light: string, dark: string, seed: number): THREE.CanvasTexture {
  const S = 512
  const rng = mulberry32(seed)
  const [c, ctx] = canvas(S, S)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  blotches(ctx, S, S, rng, 25, light, 0.18, 30, 110)
  blotches(ctx, S, S, rng, 18, dark, 0.2, 20, 90)
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rng() > 0.5 ? light : dark
    ctx.globalAlpha = 0.25
    ctx.fillRect(rng() * S, rng() * S, 1 + rng() * 2, 1 + rng() * 2)
  }
  ctx.globalAlpha = 1
  grain(ctx, S, S, rng, 0.22)
  return toTexture(c)
}

function ceiling(base: string, grid: string, speck: string, seed: number, stains: boolean): THREE.CanvasTexture {
  const S = 512
  const rng = mulberry32(seed)
  const [c, ctx] = canvas(S, S)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = speck
    ctx.globalAlpha = 0.4 * rng()
    ctx.fillRect(rng() * S, rng() * S, 1.5, 1.5)
  }
  ctx.globalAlpha = 1
  if (stains) blotches(ctx, S, S, rng, 3, 'rgba(140,110,50,1)', 0.18, 20, 60)
  ctx.fillStyle = grid
  const half = S / 2
  for (const p of [0, half]) {
    ctx.fillRect(p, 0, 5, S)
    ctx.fillRect(0, p, S, 5)
  }
  grain(ctx, S, S, rng, 0.1)
  return toTexture(c)
}

function brushedMetal(): THREE.CanvasTexture {
  const W = 256
  const H = 256
  const rng = mulberry32(5)
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#9ea2a3'
  ctx.fillRect(0, 0, W, H)
  for (let y = 0; y < H; y++) {
    const v = 140 + rng() * 50
    ctx.fillStyle = `rgba(${v},${v + 3},${v + 5},0.5)`
    ctx.fillRect(0, y, W, 1)
  }
  grain(ctx, W, H, rng, 0.06)
  return toTexture(c)
}

function concrete(): THREE.CanvasTexture {
  const S = 512
  const rng = mulberry32(9)
  const [c, ctx] = canvas(S, S)
  ctx.fillStyle = '#8f8c82'
  ctx.fillRect(0, 0, S, S)
  blotches(ctx, S, S, rng, 30, 'rgba(70,68,60,1)', 0.15, 20, 100)
  blotches(ctx, S, S, rng, 20, 'rgba(180,176,165,1)', 0.15, 20, 100)
  grain(ctx, S, S, rng, 0.25)
  return toTexture(c)
}

function exitSign(): THREE.CanvasTexture {
  const [c, ctx] = canvas(256, 96)
  ctx.fillStyle = '#0d6b2c'
  ctx.fillRect(0, 0, 256, 96)
  ctx.fillStyle = '#e9ffe9'
  ctx.font = 'bold 64px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('EXIT', 128, 52)
  return toTexture(c, false)
}

function digit(n: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128)
  ctx.fillStyle = '#120a05'
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = '#ff9a2e'
  ctx.font = 'bold 92px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(n, 64, 70)
  return toTexture(c, false)
}

function floorLabel(n: string): THREE.CanvasTexture {
  const [c, ctx] = canvas(64, 64)
  ctx.fillStyle = '#d9d6cc'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = '#222'
  ctx.font = 'bold 44px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(n, 32, 35)
  return toTexture(c, false)
}

export interface TextureSet {
  wallA: THREE.Texture
  wallB: THREE.Texture
  carpetA: THREE.Texture
  carpetB: THREE.Texture
  ceilA: THREE.Texture
  ceilB: THREE.Texture
  metal: THREE.Texture
  concrete: THREE.Texture
  exit: THREE.Texture
  digits: THREE.Texture[]
  labels: THREE.Texture[]
}

let cache: TextureSet | null = null

export function getTextures(): TextureSet {
  if (cache) return cache
  cache = {
    wallA: wallpaperA(),
    wallB: wallpaperB(),
    carpetA: carpet('#6e7f45', '#8b9b5a', '#4e5c2e', 31),
    carpetB: carpet('#b19e70', '#c8b78a', '#8a7a52', 37),
    ceilA: ceiling('#cdc99c', '#b9b48a', '#8d8865', 41, true),
    ceilB: ceiling('#2a2a26', '#57574f', '#6a6a60', 43, false),
    metal: brushedMetal(),
    concrete: concrete(),
    exit: exitSign(),
    digits: ['1', '2', '3'].map(digit),
    labels: ['1', '2', '3'].map(floorLabel),
  }
  return cache
}
