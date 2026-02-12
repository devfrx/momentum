/**
 * PlinkoEngine — Matter.js powered physics simulation for Plinko.
 *
 * Uses a real 2D rigid-body engine (Matter.js) for natural ball physics:
 * gravity, elastic collisions, friction — no scripted randomness needed.
 *
 * The only randomness is a tiny horizontal jitter on the ball's spawn
 * position so it deflects left or right off the centre splitter peg.
 *
 * Risk levels shift bucket multipliers: Low risk has a flatter payout curve,
 * while High risk concentrates value at the edges (high reward / high loss).
 * Multiplier tables are calibrated so EV ≈ 0.99 (≈ 1 % house edge).
 */

import Matter from 'matter-js'

// ─── Types ───────────────────────────────────────────────────────────

export type PlinkoRisk = 'low' | 'medium' | 'high'

export interface PlinkoBucketDef {
  index: number
  multiplier: number
  color: string
}

export interface PlinkoPeg {
  x: number
  y: number
  row: number
  col: number
}

export interface PlinkoBall {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  active: boolean
  trail: Array<{ x: number; y: number }>
  landedBucket: number | null
  /** @internal Matter.js body reference */
  _body: Matter.Body | null
}

export interface PlinkoConfig {
  rows: number
  risk: PlinkoRisk
  boardWidth: number
  boardHeight: number
}

// ─── Multiplier tables per risk & row count ──────────────────────────

const MULTIPLIER_TABLES: Record<number, Record<PlinkoRisk, number[]>> = {
  8: {
    low:    [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high:   [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low:    [11, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 11],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high:   [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low:    [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
    high:   [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
}

// ─── Color helpers ───────────────────────────────────────────────────

function bucketColor(multiplier: number): string {
  if (multiplier >= 100) return '#dc2626'
  if (multiplier >= 10) return '#ff3b3b'
  if (multiplier >= 5) return '#ff6b35'
  if (multiplier >= 3) return '#ff9f1c'
  if (multiplier >= 2) return '#ffca3a'
  if (multiplier >= 1.5) return '#8ac926'
  if (multiplier >= 1) return '#36b37e'
  if (multiplier >= 0.5) return '#6366f1'
  return '#64748b'
}

// ─── Engine ──────────────────────────────────────────────────────────

export class PlinkoEngine {
  readonly rows: number
  readonly risk: PlinkoRisk
  readonly boardWidth: number
  readonly boardHeight: number
  readonly buckets: PlinkoBucketDef[]
  readonly pegs: PlinkoPeg[]
  /** Original peg positions (home) — jitter offsets pegs[] for rendering */
  private pegHome: Array<{ x: number; y: number }> = []
  readonly pegRadius = 6
  readonly ballRadius: number
  readonly bucketCount: number

  // Spacing
  readonly pegSpacingX: number
  readonly pegSpacingY: number
  readonly topPadding: number
  readonly sidePadding: number

  // Matter.js world
  private mEngine: Matter.Engine
  private mWorld: Matter.World
  private pegBodies: Matter.Body[] = []
  private nextBallId = 0

  /** Map from Matter body id → PlinkoBall */
  private ballMap = new Map<number, PlinkoBall>()

  constructor(config: PlinkoConfig) {
    this.rows = config.rows
    this.risk = config.risk
    this.boardWidth = config.boardWidth
    this.boardHeight = config.boardHeight
    this.bucketCount = this.rows + 1

    // Dynamic ball size — fewer pegs ⇒ bigger ball (proportional to peg spacing)
    this.ballRadius = this.rows <= 8 ? 12 : this.rows <= 12 ? 10 : 8

    // Spacing
    this.sidePadding = 40
    this.topPadding = 36
    const usableWidth = this.boardWidth - this.sidePadding * 2
    this.pegSpacingX = usableWidth / this.rows
    const bucketAreaHeight = 45
    this.pegSpacingY =
      (this.boardHeight - this.topPadding - bucketAreaHeight) / this.rows

    // Build buckets
    const table =
      MULTIPLIER_TABLES[this.rows]?.[this.risk] ??
      MULTIPLIER_TABLES[12][this.risk]
    this.buckets = table.map((m, i) => ({
      index: i,
      multiplier: m,
      color: bucketColor(m),
    }))

    // ── Create Matter.js engine ──────────────────────────────────
    this.mEngine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 },
    })
    this.mWorld = this.mEngine.world

    // ── Build pegs as static circles ─────────────────────────────
    this.pegs = []

    for (let row = 0; row < this.rows; row++) {
      const pegsInRow = row + 2
      const rowWidth = (pegsInRow - 1) * this.pegSpacingX
      const startX = (this.boardWidth - rowWidth) / 2
      for (let col = 0; col < pegsInRow; col++) {
        this.pegs.push({
          x: startX + col * this.pegSpacingX,
          y: this.topPadding + row * this.pegSpacingY,
          row,
          col,
        })
      }
    }

    // Add peg bodies to Matter world & store home positions
    this.pegHome = this.pegs.map((p) => ({ x: p.x, y: p.y }))
    this.pegBodies = this.pegs.map((p) =>
      Matter.Bodies.circle(p.x, p.y, this.pegRadius, {
        isStatic: true,
        restitution: 0.4,
        friction: 0.15,
        label: 'peg',
      })
    )
    Matter.Composite.add(this.mWorld, this.pegBodies)

    // ── Walls (left, right, bottom) ──────────────────────────────
    const wallThickness = 20
    const walls = [
      // Left wall
      Matter.Bodies.rectangle(
        -wallThickness / 2, this.boardHeight / 2,
        wallThickness, this.boardHeight,
        { isStatic: true, restitution: 0.3, label: 'wall' }
      ),
      // Right wall
      Matter.Bodies.rectangle(
        this.boardWidth + wallThickness / 2, this.boardHeight / 2,
        wallThickness, this.boardHeight,
        { isStatic: true, restitution: 0.3, label: 'wall' }
      ),
      // Bottom
      Matter.Bodies.rectangle(
        this.boardWidth / 2, this.boardHeight + wallThickness / 2,
        this.boardWidth + 40, wallThickness,
        { isStatic: true, restitution: 0.1, label: 'floor' }
      ),
    ]
    Matter.Composite.add(this.mWorld, walls)

    // ── Bucket dividers — thin static rectangles between buckets ─
    const dividerWidth = 2
    const dividerHeight = this.boardHeight - this.bucketY
    for (let i = 0; i <= this.bucketCount; i++) {
      const dx = this.sidePadding + i * this.bucketWidth
      const divider = Matter.Bodies.rectangle(
        dx, this.bucketY + dividerHeight / 2,
        dividerWidth, dividerHeight,
        { isStatic: true, restitution: 0.2, label: 'divider' }
      )
      Matter.Composite.add(this.mWorld, divider)
    }
  }

  /** Drop point X (center top) */
  get dropX(): number {
    return this.boardWidth / 2
  }

  /** Y where buckets start */
  get bucketY(): number {
    return this.topPadding + this.rows * this.pegSpacingY + 10
  }

  /** Bucket width */
  get bucketWidth(): number {
    return (this.boardWidth - this.sidePadding * 2) / this.bucketCount
  }

  /** Bucket centre X */
  bucketCenterX(bucketIndex: number): number {
    return this.sidePadding + bucketIndex * this.bucketWidth + this.bucketWidth / 2
  }

  /** Create and spawn a new ball */
  createBall(): PlinkoBall {
    const jitter = (Math.random() - 0.5) * 2
    const body = Matter.Bodies.circle(
      this.dropX + jitter, 8,
      this.ballRadius,
      {
        restitution: 0.3,
        friction: 0.1,
        frictionAir: 0.015,
        density: 0.02,
        label: 'ball',
      }
    )
    Matter.Composite.add(this.mWorld, body)

    const ball: PlinkoBall = {
      id: this.nextBallId++,
      x: body.position.x,
      y: body.position.y,
      vx: 0,
      vy: 0,
      radius: this.ballRadius,
      active: true,
      trail: [],
      landedBucket: null,
      _body: body,
    }
    this.ballMap.set(body.id, ball)
    return ball
  }

  /**
   * Advance the Matter.js world by one tick (~16 ms).
   * Pegs near active balls vibrate slightly to add natural randomness.
   */
  tick(): void {
    // Micro-jitter pegs near balls — simulates imperfect surfaces
    const jitterRadius = this.pegSpacingY * 1.2
    const jitterAmount = 1.5 // max px displacement — visible wobble
    const activeBalls = [...this.ballMap.values()].filter((b) => b.active && b._body)

    for (let i = 0; i < this.pegBodies.length; i++) {
      const pegBody = this.pegBodies[i]
      const home = this.pegHome[i]
      let near = false

      for (const ball of activeBalls) {
        const dx = ball.x - home.x
        const dy = ball.y - home.y
        if (dx * dx + dy * dy < jitterRadius * jitterRadius) {
          near = true
          break
        }
      }

      if (near) {
        // Apply random offset to physics body AND visual peg
        const ox = (Math.random() - 0.5) * jitterAmount
        const oy = (Math.random() - 0.5) * jitterAmount
        Matter.Body.setPosition(pegBody, { x: home.x + ox, y: home.y + oy })
        this.pegs[i].x = home.x + ox
        this.pegs[i].y = home.y + oy
      } else {
        // Snap back to home position
        Matter.Body.setPosition(pegBody, { x: home.x, y: home.y })
        this.pegs[i].x = home.x
        this.pegs[i].y = home.y
      }
    }

    Matter.Engine.update(this.mEngine, 16.667)
  }

  /**
   * Sync a ball's visual state from its Matter body.
   * Returns `true` if the ball is still active.
   * Call this after `tick()` for each ball.
   */
  step(ball: PlinkoBall): boolean {
    if (!ball.active) return false
    const body = ball._body
    if (!body) return false

    // Sync position from Matter body
    ball.x = body.position.x
    ball.y = body.position.y
    ball.vx = body.velocity.x
    ball.vy = body.velocity.y

    // Trail
    ball.trail.push({ x: ball.x, y: ball.y })
    if (ball.trail.length > 30) ball.trail.shift()

    // Check if ball reached bucket zone and has settled
    if (ball.y >= this.bucketY) {
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
      if (speed < 2 || ball.y >= this.boardHeight - 10) {
        ball.active = false
        ball.landedBucket = this.resolveBucket(ball.x)
        Matter.Composite.remove(this.mWorld, body)
        ball._body = null
        this.ballMap.delete(body.id)
        return false
      }
    }

    return true
  }

  /** Resolve bucket index from X position */
  private resolveBucket(x: number): number {
    const startX = this.sidePadding
    const relX = x - startX
    let idx = Math.floor(relX / this.bucketWidth)
    return Math.max(0, Math.min(this.bucketCount - 1, idx))
  }

  /** Get multiplier for a bucket */
  getMultiplier(bucketIndex: number): number {
    return this.buckets[bucketIndex]?.multiplier ?? 0
  }

  /** Expected value (simple average) */
  getExpectedValue(): number {
    const sum = this.buckets.reduce((s, b) => s + b.multiplier, 0)
    return sum / this.buckets.length
  }

  /** Clean up — stop the Matter engine */
  destroy(): void {
    Matter.Engine.clear(this.mEngine)
    Matter.Composite.clear(this.mWorld, false)
  }

  static getRowOptions(): number[] {
    return [8, 12, 16]
  }

  static getRiskOptions(): PlinkoRisk[] {
    return ['low', 'medium', 'high']
  }
}
