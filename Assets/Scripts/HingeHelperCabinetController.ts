/**
 * HingeHelperCabinetController — drives the virtual (stand-in) cabinet.
 *
 * Owns: the door pose (crooked → square snap), the ghost door look/visibility, the red/green
 *       state of every Highlight_<part> object, and the scan-beam sweep visual.
 * Expects (@input): doorPivot, ghostDoor, ghostPivot, highlightsRoot, optional scanBeam.
 * Finds highlights by name: `Highlight_<part>` anywhere under highlightsRoot.
 * Must not: know about steps, timing, or UI (HingeHelperMain sequences everything).
 */
import {HingePart, ALL_PARTS} from "./HingeHelperSteps"

export type PartState = "off" | "red" | "green"

// Correctness invariants: translucent layers must draw after the opaque cabinet (default 0).
const GHOST_RENDER_ORDER = 10
const HIGHLIGHT_RENDER_ORDER = 20

interface HighlightEntry {
  so: SceneObject
  mat: Material
  state: PartState
}

@component
export class HingeHelperCabinetController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">HingeHelperCabinetController – door pose, ghost, highlights</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Pivot at the bottom hinge; its authored rotation is the broken, off-angle pose")
  doorPivot!: SceneObject

  @input
  @hint("Ghost door root (shown after the scan)")
  ghostDoor!: SceneObject

  @input
  @hint("Ghost door pivot: its rotation is the correct, square door pose")
  ghostPivot!: SceneObject

  @input
  @hint("Parent that contains every Highlight_<part> object")
  highlightsRoot!: SceneObject

  @input
  @hint("Optional thin plane that sweeps over the cabinet while scanning")
  @allowUndefined
  scanBeam: SceneObject | undefined
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input("vec4", "{1.0, 0.2, 0.16, 0.65}")
  @hint("Highlight color for parts that need fixing")
  @widget(new ColorWidget())
  needsFixColor: vec4 = new vec4(1.0, 0.2, 0.16, 0.65)

  @input("vec4", "{0.3, 1.0, 0.4, 0.6}")
  @hint("Highlight color for parts that are fixed")
  @widget(new ColorWidget())
  fixedColor: vec4 = new vec4(0.3, 1.0, 0.4, 0.6)

  @input("vec4", "{0.6, 0.95, 1.0, 0.25}")
  @hint("Ghost door color; alpha is the opacity (brief: light cyan, ~25%)")
  @widget(new ColorWidget())
  ghostColor: vec4 = new vec4(0.6, 0.95, 1.0, 0.25)

  @input
  @hint("Red highlights pulse at this rate (pulses per second, 0 = steady)")
  @widget(new SliderWidget(0, 3, 0.1))
  pulseRate: number = 1.2

  @input
  @hint("Scan beam travel (cm) from top to bottom of the cabinet")
  @widget(new SliderWidget(20, 120, 1))
  scanBeamTravel: number = 70
  @ui.group_end

  private highlights = new Map<HingePart, HighlightEntry>()
  private crookedRotation!: quat
  private doorAnim: {from: quat; to: quat; t: number; dur: number} | null = null
  private beamAnim: {t: number; dur: number; startY: number} | null = null
  private time = 0
  private ready = false

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onStart(): void {
    if (!this.doorPivot || !this.ghostDoor || !this.ghostPivot || !this.highlightsRoot) {
      print("[HingeHelperCabinetController] ERROR: doorPivot / ghostDoor / ghostPivot / highlightsRoot not wired")
      return
    }
    this.crookedRotation = this.doorPivot.getTransform().getLocalRotation()
    this.setupGhost()
    for (const part of ALL_PARTS) {
      const so = this.findByName(this.highlightsRoot, "Highlight_" + part)
      if (!so) {
        print("[HingeHelperCabinetController] WARN: missing Highlight_" + part)
        continue
      }
      const mat = this.makeHighlightMaterial(so)
      this.highlights.set(part, {so, mat, state: "off"})
      so.enabled = false
    }
    if (this.scanBeam) this.scanBeam.enabled = false
    this.ready = true
  }

  // ── public API ──

  get isReady(): boolean {
    return this.ready
  }

  setPartState(part: HingePart, state: PartState): void {
    const h = this.highlights.get(part)
    if (!h) return
    h.state = state
    h.so.enabled = state !== "off"
    this.applyColor(h)
  }

  getPartState(part: HingePart): PartState {
    const h = this.highlights.get(part)
    return h ? h.state : "off"
  }

  setAllParts(state: PartState): void {
    for (const part of ALL_PARTS) this.setPartState(part, state)
  }

  setGhostVisible(v: boolean): void {
    if (this.ghostDoor) this.ghostDoor.enabled = v
  }

  get ghostVisible(): boolean {
    return !!this.ghostDoor && this.ghostDoor.enabled
  }

  /** Animate the door from its current pose to the ghost's square pose. */
  snapDoorSquare(durationSec: number): void {
    const from = this.doorPivot.getTransform().getLocalRotation()
    const to = this.ghostPivot.getTransform().getLocalRotation()
    if (durationSec <= 0) {
      this.doorPivot.getTransform().setLocalRotation(to)
      this.doorAnim = null
      return
    }
    this.doorAnim = {from, to, t: 0, dur: durationSec}
  }

  /** Put the door back to its broken, off-angle pose. */
  resetDoor(): void {
    this.doorAnim = null
    if (this.crookedRotation) this.doorPivot.getTransform().setLocalRotation(this.crookedRotation)
  }

  /** Angle in degrees between the real door and the ghost door. */
  get doorAngleToGhostDeg(): number {
    const a = this.doorPivot.getTransform().getWorldRotation()
    const b = this.ghostPivot.getTransform().getWorldRotation()
    return (quat.angleBetween(a, b) * 180) / Math.PI
  }

  get isDoorSquare(): boolean {
    return this.doorAngleToGhostDeg < 0.5
  }

  playScanSweep(durationSec: number): void {
    if (!this.scanBeam) return
    this.scanBeam.enabled = true
    const startY = this.beamAnim ? this.beamAnim.startY : this.scanBeam.getTransform().getLocalPosition().y
    this.beamAnim = {t: 0, dur: Math.max(0.1, durationSec), startY}
  }

  stopScanSweep(): void {
    if (!this.scanBeam) return
    if (this.beamAnim) {
      const p = this.scanBeam.getTransform().getLocalPosition()
      this.scanBeam.getTransform().setLocalPosition(new vec3(p.x, this.beamAnim.startY, p.z))
    }
    this.beamAnim = null
    this.scanBeam.enabled = false
  }

  // ── internals ──

  private onUpdate(): void {
    if (!this.ready) return
    const dt = getDeltaTime()
    this.time += dt

    if (this.pulseRate > 0) {
      this.highlights.forEach((h) => {
        if (h.state === "red") this.applyColor(h)
      })
    }

    if (this.doorAnim) {
      const a = this.doorAnim
      a.t += dt
      const k = Math.min(1, a.t / a.dur)
      const e = 1 - Math.pow(1 - k, 3) // ease-out cubic
      this.doorPivot.getTransform().setLocalRotation(quat.slerp(a.from, a.to, e))
      if (k >= 1) this.doorAnim = null
    }

    if (this.beamAnim && this.scanBeam) {
      const b = this.beamAnim
      b.t += dt
      const k = (b.t / b.dur) % 1
      const p = this.scanBeam.getTransform().getLocalPosition()
      this.scanBeam.getTransform().setLocalPosition(new vec3(p.x, b.startY - k * this.scanBeamTravel, p.z))
    }
  }

  private applyColor(h: HighlightEntry): void {
    if (h.state === "off") return
    const base = h.state === "red" ? this.needsFixColor : this.fixedColor
    let s = 1
    if (h.state === "red" && this.pulseRate > 0) {
      s = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(this.time * this.pulseRate * Math.PI * 2))
    }
    h.mat.mainPass.baseColor = new vec4(base.x * s, base.y * s, base.z * s, base.w)
  }

  private makeHighlightMaterial(root: SceneObject): Material {
    let mat: Material | null = null
    this.forEachVisual(root, (rmv) => {
      if (!mat) {
        mat = rmv.mainMaterial.clone()
        mat.mainPass.blendMode = BlendMode.Normal // reads as true red/green, not washed-out additive
        mat.mainPass.depthWrite = false
        mat.mainPass.depthTest = false // a highlighted part must never be hidden by the tilted door
        mat.mainPass.twoSided = true
      }
      rmv.mainMaterial = mat
      rmv.setRenderOrder(HIGHLIGHT_RENDER_ORDER) // glow draws after the door and the ghost
    })
    if (!mat) throw new Error("Highlight " + root.name + " has no RenderMeshVisual")
    return mat
  }

  private setupGhost(): void {
    this.forEachVisual(this.ghostDoor, (rmv) => {
      const mat = rmv.mainMaterial.clone()
      mat.mainPass.blendMode = BlendMode.Normal
      mat.mainPass.depthWrite = false
      mat.mainPass.depthTest = false // overlay ON the real door, even where the crooked door tilts in front
      mat.mainPass.baseColor = this.ghostColor
      rmv.mainMaterial = mat
      rmv.setRenderOrder(GHOST_RENDER_ORDER) // after the opaque door so it tints it, before highlights
    })
    this.ghostDoor.enabled = false
  }

  private forEachVisual(root: SceneObject, fn: (rmv: RenderMeshVisual) => void): void {
    const rmv = root.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (rmv) fn(rmv)
    for (let i = 0; i < root.getChildrenCount(); i++) this.forEachVisual(root.getChild(i), fn)
  }

  private findByName(root: SceneObject, name: string): SceneObject | null {
    if (root.name === name) return root
    for (let i = 0; i < root.getChildrenCount(); i++) {
      const hit = this.findByName(root.getChild(i), name)
      if (hit) return hit
    }
    return null
  }
}
