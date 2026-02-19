/**
 * IsometricEngine — PixiJS-based 2.5D city map renderer
 *
 * Renders an isometric city grid with:
 * - District zones as colored terrain blocks
 * - Building sprites for owned properties
 * - Opportunity markers pulsing on the map
 * - Activity particle effects per district
 * - Hover/click interactions for district selection
 * - Smooth pan & zoom via mouse/touch
 * - D3-powered heatmap overlay for economic data
 *
 * All rendering is done on a WebGL canvas via PixiJS v8.
 * The engine exposes a reactive interface that Vue components drive.
 */
import {
  Application,
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from 'pixi.js'
// Pre-compiled shaders — avoids unsafe-eval in Electron's CSP
import 'pixi.js/unsafe-eval'
import type { District } from '@renderer/data/realestate/types'
import type { ZoneActivity, MarketTrend } from '@renderer/data/realestate/types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface DistrictRenderData {
  district: District
  unlocked: boolean
  ownedCount: number
  opportunityCount: number
  hotDealCount: number
  activity: ZoneActivity
  trend: MarketTrend
  activeEventName: string | null
  activeEventIcon: string | null
}

export interface BuildingSprite {
  id: string
  districtId: string
  name: string
  kind: 'owned' | 'opportunity' | 'hot'
  /** Grid column within district */
  col: number
  /** Grid row within district */
  row: number
}

export interface MapCallbacks {
  onDistrictClick: (districtId: string) => void
  onDistrictHover: (districtId: string | null) => void
  onBuildingClick: (id: string, kind: 'owned' | 'opportunity' | 'hot') => void
}

// ═══════════════════════════════════════════════════════════════════
// ISOMETRIC MATH
// ═══════════════════════════════════════════════════════════════════

/** Single isometric tile size in pixels */
const TILE_W = 64
const TILE_H = 32

/** Convert grid (col, row) → screen (x, y) in isometric projection */
export function gridToIso(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  }
}

/** Convert screen (x, y) → grid (col, row) */
export function isoToGrid(x: number, y: number): { col: number; row: number } {
  return {
    col: (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2,
    row: (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2,
  }
}

// ═══════════════════════════════════════════════════════════════════
// COLOR UTILS
// ═══════════════════════════════════════════════════════════════════

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

/** Deterministic hash for stable per-building values */
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function darken(hex: string, factor: number): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dr = Math.round(r * factor)
  const dg = Math.round(g * factor)
  const db = Math.round(b * factor)
  return (dr << 16) | (dg << 8) | db
}

export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY VISUALS
// ═══════════════════════════════════════════════════════════════════

const ACTIVITY_PARTICLE_RATE: Record<ZoneActivity, number> = {
  dormant: 0,
  quiet: 0.002,
  active: 0.008,
  booming: 0.02,
  overheated: 0.04,
}

const ACTIVITY_GLOW_ALPHA: Record<ZoneActivity, number> = {
  dormant: 0,
  quiet: 0.03,
  active: 0.06,
  booming: 0.12,
  overheated: 0.18,
}

const TREND_BORDER_COLORS: Record<MarketTrend, string> = {
  declining: '#ef4444',
  stagnant: '#71717a',
  growing: '#22c55e',
  booming: '#3b82f6',
  bubble: '#eab308',
}

// ═══════════════════════════════════════════════════════════════════
// DISTRICT LAYOUT — isometric grid placement
// ═══════════════════════════════════════════════════════════════════

/** Each district occupies a region of the isometric grid */
interface DistrictLayout {
  id: string
  /** Grid start column */
  col: number
  /** Grid start row */
  row: number
  /** Width in tiles */
  w: number
  /** Height in tiles */
  h: number
}

/**
 * 9 districts laid out on a ~16×12 isometric grid.
 * Arranged to feel like a real city: residential edges, downtown center, waterfront bottom
 */
const DISTRICT_LAYOUTS: DistrictLayout[] = [
  // Row 1: top of city
  { id: 'uptown',          col: 0,  row: 0, w: 5, h: 4 },
  { id: 'skyline_heights', col: 5,  row: 0, w: 5, h: 4 },
  { id: 'tech_quarter',    col: 10, row: 0, w: 5, h: 4 },

  // Row 2: middle of city
  { id: 'midtown',         col: 0,  row: 4, w: 5, h: 4 },
  { id: 'downtown',        col: 5,  row: 4, w: 5, h: 4 },
  { id: 'industrial',      col: 10, row: 4, w: 5, h: 4 },

  // Row 3: bottom of city
  { id: 'old_town',        col: 0,  row: 8, w: 5, h: 4 },
  { id: 'waterfront',      col: 5,  row: 8, w: 5, h: 4 },
  { id: 'harbor',          col: 10, row: 8, w: 5, h: 4 },
]

function getDistrictLayout(id: string): DistrictLayout | undefined {
  return DISTRICT_LAYOUTS.find((dl) => dl.id === id)
}

// ═══════════════════════════════════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════════

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: number
}

// ═══════════════════════════════════════════════════════════════════
// ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════

export class IsometricEngine {
  private app: Application | null = null
  private worldContainer!: Container
  private groundLayer!: Container
  private buildingLayer!: Container
  private overlayLayer!: Container
  private uiLayer!: Container
  private particleLayer!: Container

  private districtGraphics = new Map<string, Graphics>()
  private districtLabels = new Map<string, Text>()
  private districtGlows = new Map<string, Graphics>()
  private buildingGraphics = new Map<string, Graphics>()
  private particles: Particle[] = []

  private _hoveredDistrict: string | null = null
  private callbacks: MapCallbacks | null = null
  private _boundWheel: ((e: WheelEvent) => void) = () => {}

  private isPanning = false
  private isDragging = false
  private panStart = { x: 0, y: 0 }
  private panOrigin = { x: 0, y: 0 }
  private panOffset = { x: 0, y: 0 }
  private zoomLevel = 1
  private static readonly DRAG_THRESHOLD = 5

  /** Current data snapshot — updated by Vue reactivity */
  private districtData = new Map<string, DistrictRenderData>()

  // Grid dimensions
  private readonly GRID_COLS = 15
  private readonly GRID_ROWS = 12

  private _destroyed = false
  private _canvas: HTMLCanvasElement | null = null

  // ─── Lifecycle ────────────────────────────────────────────────

  async init(canvas: HTMLCanvasElement, callbacks: MapCallbacks): Promise<void> {
    // Guard against re-init on a destroyed engine
    if (this._destroyed) return
    this.callbacks = callbacks
    this._canvas = canvas

    const parent = canvas.parentElement!
    const w = parent.clientWidth || 800
    const h = parent.clientHeight || 520

    this.app = new Application()

    console.log('[IsometricEngine] Initializing PixiJS…', { w, h, dpr: window.devicePixelRatio })
    await this.app.init({
      canvas,
      width: w,
      height: h,
      antialias: true,
      background: 0x12121a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgl',
    })
    // If destroyed while awaiting init, clean up immediately
    if (this._destroyed) {
      this.app.destroy(false)
      this.app = null
      return
    }
    console.log('[IsometricEngine] PixiJS initialized, renderer:', this.app.renderer.type)

    // World container for pan/zoom
    this.worldContainer = new Container()
    this.app.stage.addChild(this.worldContainer)

    // Layers (z-order)
    this.groundLayer = new Container()
    this.buildingLayer = new Container()
    this.particleLayer = new Container()
    this.overlayLayer = new Container()
    this.uiLayer = new Container()

    this.worldContainer.addChild(this.groundLayer)
    this.worldContainer.addChild(this.buildingLayer)
    this.worldContainer.addChild(this.particleLayer)
    this.worldContainer.addChild(this.overlayLayer)
    this.worldContainer.addChild(this.uiLayer)

    // Center the world
    this.centerWorld()
    console.log('[IsometricEngine] World centered, offset:', this.panOffset, 'screen:', this.app.screen.width, 'x', this.app.screen.height)

    // Interaction events on the stage
    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen
    this.app.stage.on('pointerdown', this.onPanStart.bind(this))
    this.app.stage.on('pointermove', this.onPanMove.bind(this))
    this.app.stage.on('pointerup', this.onPanEnd.bind(this))
    this.app.stage.on('pointerupoutside', this.onPanEnd.bind(this))
    this._boundWheel = this.onWheel.bind(this)
    canvas.addEventListener('wheel', this._boundWheel, { passive: false })

    // Game loop for particles & animations
    this.app.ticker.add(this.tick.bind(this))
  }

  destroy(): void {
    this._destroyed = true
    if (!this.app) return

    // 1. Stop ticker immediately
    this.app.ticker.stop()

    // 2. Remove event listeners
    this.app.stage.removeAllListeners()
    if (this._canvas) {
      this._canvas.removeEventListener('wheel', this._boundWheel)
      this._canvas = null
    }

    // 3. Remove interaction listeners from tracked objects
    for (const [, g] of this.districtGraphics) g.removeAllListeners()
    for (const [, g] of this.buildingGraphics) g.removeAllListeners()

    // 4. Destroy all stage children WHILE the renderer is still alive.
    //    PixiJS v8 has a design issue: Application.destroy() tears down the
    //    renderer (sets gl = null) BEFORE destroying stage children.
    //    Text objects destroyed after the renderer is gone trigger texture
    //    source updates on the already-null GL context → crash.
    //    By destroying children first, their textures clean up properly.
    for (const child of [...this.app.stage.children]) {
      child.destroy({ children: true })
    }

    // 5. Clear tracking maps
    this.districtGraphics.clear()
    this.districtGlows.clear()
    this.districtLabels.clear()
    this.buildingGraphics.clear()
    this.particles = []
    this.districtData.clear()

    // 6. Destroy app — stage is now empty, so no children-related crashes.
    try {
      this.app.destroy(false, { children: false })
    } catch {
      // Swallow PixiJS internal cleanup race conditions
    }
    this.app = null
    this.callbacks = null
  }

  /** Pause rendering (e.g. when tab is hidden) */
  pause(): void {
    if (this.app && !this._destroyed) {
      this.app.ticker.stop()
    }
  }

  /** Resume rendering (e.g. when tab becomes visible again) */
  resume(): void {
    if (this.app && !this._destroyed) {
      this.app.ticker.start()
    }
  }

  // ─── World positioning ────────────────────────────────────────

  private centerWorld(): void {
    if (!this.app) return
    const centerIso = gridToIso(this.GRID_COLS / 2, this.GRID_ROWS / 2)
    this.panOffset.x = this.app.screen.width / 2 - centerIso.x
    this.panOffset.y = this.app.screen.height / 2 - centerIso.y + 40
    this.applyTransform()
  }

  private applyTransform(): void {
    this.worldContainer.x = this.panOffset.x
    this.worldContainer.y = this.panOffset.y
    this.worldContainer.scale.set(this.zoomLevel)
  }

  resetView(): void {
    this.zoomLevel = 1
    this.centerWorld()
  }

  // ─── Pan / Zoom handlers ──────────────────────────────────────

  private onPanStart(e: FederatedPointerEvent): void {
    this.isPanning = true
    this.isDragging = false
    this.panStart.x = e.global.x - this.panOffset.x
    this.panStart.y = e.global.y - this.panOffset.y
    this.panOrigin.x = e.global.x
    this.panOrigin.y = e.global.y
  }

  private onPanMove(e: FederatedPointerEvent): void {
    if (!this.isPanning) return
    const dx = e.global.x - this.panOrigin.x
    const dy = e.global.y - this.panOrigin.y
    if (!this.isDragging && Math.sqrt(dx * dx + dy * dy) < IsometricEngine.DRAG_THRESHOLD) return
    this.isDragging = true
    this.panOffset.x = e.global.x - this.panStart.x
    this.panOffset.y = e.global.y - this.panStart.y
    this.applyTransform()
  }

  private onPanEnd(): void {
    this.isPanning = false
    // isDragging stays true until next pointerdown so pointertap knows
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.4, Math.min(3, this.zoomLevel * delta))

    // Zoom toward mouse position
    if (this.app) {
      const mouseX = e.offsetX
      const mouseY = e.offsetY
      const worldX = (mouseX - this.panOffset.x) / this.zoomLevel
      const worldY = (mouseY - this.panOffset.y) / this.zoomLevel

      this.zoomLevel = newZoom
      this.panOffset.x = mouseX - worldX * this.zoomLevel
      this.panOffset.y = mouseY - worldY * this.zoomLevel
      this.applyTransform()
    }
  }

  // ─── Data update (called by Vue reactivity) ──────────────────

  updateDistricts(data: DistrictRenderData[]): void {
    this.districtData.clear()
    for (const d of data) {
      this.districtData.set(d.district.id, d)
    }
    this.rebuildGround()
  }

  updateBuildings(buildings: BuildingSprite[]): void {
    // Clear old buildings
    for (const [, g] of this.buildingGraphics) {
      g.destroy()
    }
    this.buildingGraphics.clear()

    for (const b of buildings) {
      this.drawBuilding(b)
    }
  }

  // ─── Ground rendering ────────────────────────────────────────

  private rebuildGround(): void {
    // Clear tracked display objects
    for (const [, g] of this.districtGraphics) g.destroy()
    for (const [, g] of this.districtGlows) g.destroy()
    for (const [, t] of this.districtLabels) t.destroy()
    this.districtGraphics.clear()
    this.districtGlows.clear()
    this.districtLabels.clear()
    this.groundLayer.removeChildren()

    // Destroy all uiLayer children (event banners, stat labels, lock icons)
    // that drawDistrict() adds but doesn't track individually
    for (const child of [...this.uiLayer.children]) {
      child.destroy({ children: true })
    }

    console.log('[IsometricEngine] rebuildGround — districts:', this.districtData.size, 'layouts:', DISTRICT_LAYOUTS.length)

    // Draw road grid first
    this.drawRoads()

    // Draw each district
    for (const layout of DISTRICT_LAYOUTS) {
      const data = this.districtData.get(layout.id)
      if (!data) continue
      this.drawDistrict(layout, data)
    }

    console.log('[IsometricEngine] rebuildGround done — groundLayer children:', this.groundLayer.children.length)
  }

  private drawRoads(): void {
    const roads = new Graphics()

    // Horizontal road separators (between row blocks)
    for (const rowY of [4, 8]) {
      for (let c = 0; c < this.GRID_COLS; c++) {
        const pos = gridToIso(c, rowY)
        roads.moveTo(pos.x, pos.y)
        const next = gridToIso(c + 1, rowY)
        roads.lineTo(next.x, next.y)
        roads.stroke({ color: 0x2a2a3a, width: 2, alpha: 0.6 })
      }
    }

    // Vertical road separators (between column blocks)
    for (const colX of [5, 10]) {
      for (let r = 0; r < this.GRID_ROWS; r++) {
        const pos = gridToIso(colX, r)
        roads.moveTo(pos.x, pos.y)
        const next = gridToIso(colX, r + 1)
        roads.lineTo(next.x, next.y)
        roads.stroke({ color: 0x2a2a3a, width: 2, alpha: 0.6 })
      }
    }

    this.groundLayer.addChild(roads)
  }

  private drawDistrict(layout: DistrictLayout, data: DistrictRenderData): void {
    const { id, col, row, w, h } = layout
    const { district, unlocked, activity } = data
    const baseColor = hexToNum(district.color)
    const dimColor = darken(district.color, 0.3)
    const fillColor = unlocked ? baseColor : dimColor

    // Activity glow background
    const glowAlpha = ACTIVITY_GLOW_ALPHA[activity]
    if (glowAlpha > 0 && unlocked) {
      const glow = new Graphics()
      this.drawIsoRect(glow, col, row, w, h, baseColor, glowAlpha)
      this.groundLayer.addChild(glow)
      this.districtGlows.set(id, glow)
    }

    // District ground tiles
    const g = new Graphics()
    for (let dc = 0; dc < w; dc++) {
      for (let dr = 0; dr < h; dr++) {
        const tc = col + dc
        const tr = row + dr
        this.drawIsoTile(g, tc, tr, fillColor, unlocked ? 0.25 : 0.08)
      }
    }

    // Trend border
    if (unlocked) {
      const trendColor = hexToNum(TREND_BORDER_COLORS[data.trend])
      this.drawIsoBorder(g, col, row, w, h, trendColor, 2, 0.6)
    }

    g.eventMode = 'static'
    g.cursor = unlocked ? 'pointer' : 'not-allowed'
    g.hitArea = this.getIsoHitArea(col, row, w, h)

    g.on('pointerover', () => {
      this._hoveredDistrict = id
      this.callbacks?.onDistrictHover(id)
      if (unlocked) this.highlightDistrict(id, true)
    })
    g.on('pointerout', () => {
      this._hoveredDistrict = null
      this.callbacks?.onDistrictHover(null)
      this.highlightDistrict(id, false)
    })
    g.on('pointertap', (e: FederatedPointerEvent) => {
      if (!this.isDragging && unlocked) {
        e.stopPropagation()
        this.callbacks?.onDistrictClick(id)
      }
    })

    this.groundLayer.addChild(g)
    this.districtGraphics.set(id, g)

    // District label
    const center = gridToIso(col + w / 2, row + h / 2)
    const label = new Text({
      text: district.name,
      style: new TextStyle({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: unlocked ? 11 : 9,
        fontWeight: unlocked ? '600' : '400',
        fill: unlocked ? 0xffffff : 0x666666,
        align: 'center',
        dropShadow: unlocked ? {
          color: 0x000000,
          blur: 4,
          distance: 1,
          alpha: 0.8,
        } : undefined,
      }),
    })
    label.anchor.set(0.5, 0.5)
    label.x = center.x
    label.y = center.y - 8
    this.uiLayer.addChild(label)
    this.districtLabels.set(id, label)

    // Activity event banner
    if (data.activeEventName && unlocked) {
      const evtLabel = new Text({
        text: `⚡ ${data.activeEventName}`,
        style: new TextStyle({
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 8,
          fontWeight: '700',
          fill: 0xfbbf24,
          align: 'center',
        }),
      })
      evtLabel.anchor.set(0.5, 0.5)
      evtLabel.x = center.x
      evtLabel.y = center.y + 10
      this.uiLayer.addChild(evtLabel)
    }

    // Stats line under label
    if (unlocked) {
      const stats = `${data.ownedCount}🏠 ${data.opportunityCount}📋`
      const statLabel = new Text({
        text: stats,
        style: new TextStyle({
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 8,
          fill: 0x999999,
          align: 'center',
        }),
      })
      statLabel.anchor.set(0.5, 0.5)
      statLabel.x = center.x
      statLabel.y = center.y + (data.activeEventName ? 22 : 8)
      this.uiLayer.addChild(statLabel)
    }

    // Lock icon for locked districts
    if (!unlocked) {
      const lock = new Text({
        text: '🔒',
        style: new TextStyle({ fontSize: 16 }),
      })
      lock.anchor.set(0.5, 0.5)
      lock.x = center.x
      lock.y = center.y - 24
      this.uiLayer.addChild(lock)
    }
  }

  // ─── Building rendering ──────────────────────────────────────

  private rebuildBuildings(): void {
    for (const [, g] of this.buildingGraphics) g.destroy()
    this.buildingGraphics.clear()
    this.buildingLayer.removeChildren()
  }

  private drawBuilding(b: BuildingSprite): void {
    const layout = getDistrictLayout(b.districtId)
    if (!layout) return

    const tc = layout.col + b.col
    const tr = layout.row + b.row
    const pos = gridToIso(tc, tr)
    const g = new Graphics()

    // Building colors by kind
    let topColor: number, leftColor: number, rightColor: number
    let buildingH: number

    switch (b.kind) {
      case 'owned':
        topColor = 0x4ade80
        leftColor = 0x22c55e
        rightColor = 0x16a34a
        buildingH = 22 + (hashCode(b.id) % 16)
        break
      case 'hot':
        topColor = 0xfbbf24
        leftColor = 0xf59e0b
        rightColor = 0xd97706
        buildingH = 16
        break
      default: // opportunity
        topColor = 0x60a5fa
        leftColor = 0x3b82f6
        rightColor = 0x2563eb
        buildingH = 14
        break
    }

    const tw = TILE_W * 0.6
    const th = TILE_H * 0.6

    // Top face (roof)
    g.moveTo(pos.x, pos.y - buildingH)
    g.lineTo(pos.x + tw / 2, pos.y - buildingH + th / 2)
    g.lineTo(pos.x, pos.y - buildingH + th)
    g.lineTo(pos.x - tw / 2, pos.y - buildingH + th / 2)
    g.closePath()
    g.fill({ color: topColor, alpha: 0.95 })
    g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })

    // Left face
    g.moveTo(pos.x - tw / 2, pos.y - buildingH + th / 2)
    g.lineTo(pos.x, pos.y - buildingH + th)
    g.lineTo(pos.x, pos.y + th)
    g.lineTo(pos.x - tw / 2, pos.y + th / 2)
    g.closePath()
    g.fill({ color: leftColor, alpha: 0.9 })

    // Right face
    g.moveTo(pos.x + tw / 2, pos.y - buildingH + th / 2)
    g.lineTo(pos.x, pos.y - buildingH + th)
    g.lineTo(pos.x, pos.y + th)
    g.lineTo(pos.x + tw / 2, pos.y + th / 2)
    g.closePath()
    g.fill({ color: rightColor, alpha: 0.9 })

    // Interaction
    g.eventMode = 'static'
    g.cursor = 'pointer'
    g.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation()
      this.callbacks?.onBuildingClick(b.id, b.kind)
    })

    this.buildingLayer.addChild(g)
    this.buildingGraphics.set(b.id, g)
  }

  // ─── Highlight ────────────────────────────────────────────────

  private highlightDistrict(id: string, isHovered: boolean): void {
    try {
      const g = this.districtGraphics.get(id)
      if (g && !g.destroyed) {
        // Use alpha change instead of scale — scale from pivot (0,0) distorts
        // isometric tiles and causes overlaps with neighboring districts
        g.alpha = isHovered ? 1.0 : 0.85
      }
      const glow = this.districtGlows.get(id)
      if (glow && !glow.destroyed) {
        glow.alpha = isHovered ? 2.0 : 1.0
      }
      const label = this.districtLabels.get(id)
      if (label && !label.destroyed) {
        label.alpha = isHovered ? 1.0 : 0.8
      }
    } catch {
      // Ignore — graphics may be mid-rebuild
    }
  }

  // ─── Zoom to district ────────────────────────────────────────

  zoomToDistrict(districtId: string): void {
    if (!this.app) return
    const layout = getDistrictLayout(districtId)
    if (!layout) return

    const center = gridToIso(layout.col + layout.w / 2, layout.row + layout.h / 2)
    this.zoomLevel = 2.2

    this.panOffset.x = this.app.screen.width / 2 - center.x * this.zoomLevel
    this.panOffset.y = this.app.screen.height / 2 - center.y * this.zoomLevel
    this.applyTransform()
  }

  // ─── Isometric drawing helpers ────────────────────────────────

  /** Draw a single isometric tile */
  private drawIsoTile(g: Graphics, col: number, row: number, color: number, alpha: number): void {
    const pos = gridToIso(col, row)
    const hw = TILE_W / 2
    const hh = TILE_H / 2

    // Diamond shape
    g.moveTo(pos.x, pos.y - hh)
    g.lineTo(pos.x + hw, pos.y)
    g.lineTo(pos.x, pos.y + hh)
    g.lineTo(pos.x - hw, pos.y)
    g.closePath()
    g.fill({ color, alpha })

    // Tile border
    g.moveTo(pos.x, pos.y - hh)
    g.lineTo(pos.x + hw, pos.y)
    g.lineTo(pos.x, pos.y + hh)
    g.lineTo(pos.x - hw, pos.y)
    g.closePath()
    g.stroke({ color: 0x1a1a2e, width: 1, alpha: 0.3 })
  }

  /** Draw a filled isometric rectangle (for glow effects) */
  private drawIsoRect(g: Graphics, col: number, row: number, w: number, h: number, color: number, alpha: number): void {
    const tl = gridToIso(col, row)
    const tr = gridToIso(col + w, row)
    const br = gridToIso(col + w, row + h)
    const bl = gridToIso(col, row + h)

    g.moveTo(tl.x, tl.y)
    g.lineTo(tr.x, tr.y)
    g.lineTo(br.x, br.y)
    g.lineTo(bl.x, bl.y)
    g.closePath()
    g.fill({ color, alpha })
  }

  /** Draw an isometric border rectangle */
  private drawIsoBorder(g: Graphics, col: number, row: number, w: number, h: number, color: number, width: number, alpha: number): void {
    const tl = gridToIso(col, row)
    const tr = gridToIso(col + w, row)
    const br = gridToIso(col + w, row + h)
    const bl = gridToIso(col, row + h)

    g.moveTo(tl.x, tl.y)
    g.lineTo(tr.x, tr.y)
    g.lineTo(br.x, br.y)
    g.lineTo(bl.x, bl.y)
    g.closePath()
    g.stroke({ color, width, alpha })
  }

  /** Create a polygon hit area for an isometric rectangle */
  private getIsoHitArea(col: number, row: number, w: number, h: number) {
    const tl = gridToIso(col, row)
    const tr = gridToIso(col + w, row)
    const br = gridToIso(col + w, row + h)
    const bl = gridToIso(col, row + h)
    return {
      contains: (x: number, y: number) => {
        return this.pointInPolygon(x, y, [
          tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
        ])
      },
    }
  }

  private pointInPolygon(px: number, py: number, polygon: number[]): boolean {
    let inside = false
    const n = polygon.length / 2
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i * 2], yi = polygon[i * 2 + 1]
      const xj = polygon[j * 2], yj = polygon[j * 2 + 1]
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }
    return inside
  }

  // ─── Particle tick ────────────────────────────────────────────

  private tick(): void {
    if (!this.app || this._destroyed) return
    const dt = this.app.ticker.deltaMS / 1000

    // Spawn particles per district
    for (const [districtId, data] of this.districtData) {
      if (!data.unlocked) continue
      const rate = ACTIVITY_PARTICLE_RATE[data.activity]
      if (rate <= 0) continue

      const layout = getDistrictLayout(districtId)
      if (!layout) continue

      if (Math.random() < rate) {
        const col = layout.col + Math.random() * layout.w
        const row = layout.row + Math.random() * layout.h
        const pos = gridToIso(col, row)
        this.particles.push({
          x: pos.x,
          y: pos.y,
          vx: (Math.random() - 0.5) * 8,
          vy: -15 - Math.random() * 20,
          life: 0,
          maxLife: 1 + Math.random() * 1.5,
          size: 1.5 + Math.random() * 2,
          color: hexToNum(data.district.color),
        })
      }
    }

    // Update & render particles
    this.particleLayer.removeChildren()
    const pg = new Graphics()

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life += dt
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1)
        continue
      }

      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 5 * dt // slight gravity

      const alpha = 1 - p.life / p.maxLife
      pg.circle(p.x, p.y, p.size * alpha)
      pg.fill({ color: p.color, alpha: alpha * 0.7 })
    }

    this.particleLayer.addChild(pg)
  }
}
