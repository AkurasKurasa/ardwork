/**
 * HingeHelperMain — orchestrates the Hinge Helper flow.
 *
 * Flow (phase): greeting → scanning (fake, scanDurationSec) → results (all broken parts red,
 * resultOverviewSec) → step 1..5 (only the current part red) → checking (fake, checkDurationSec)
 * → part green + next step … → fixed (door snaps square, panel says "Fixed!").
 *
 * Owns: the single source of truth for phase + current step. Pushes state into the UI modules
 *       via setters and into the cabinet via HingeHelperCabinetController.
 * Expects (@input): greeting, scanStatus, stepPanel (UI modules), cabinet, audio, camera.
 * Must not: build UI or text (UI modules do) or touch cabinet meshes directly.
 *
 * Read-only state for tests: phase, currentStep (1-based, 0 before steps), totalSteps,
 * isChecking, isFixed, partState(part), and restart() to return to the greeting.
 */
import {HingeHelperGreetingUI} from "./HingeHelperGreetingUI"
import {HingeHelperScanStatusUI} from "./HingeHelperScanStatusUI"
import {HingeHelperStepPanelUI} from "./HingeHelperStepPanelUI"
import {HingeHelperCabinetController, PartState} from "./HingeHelperCabinetController"
import {HingeHelperAudioController} from "./HingeHelperAudioController"
import {ALL_PARTS, BROKEN_PARTS, DEFAULT_SCAN_RESULT, DEFAULT_STEPS, HingePart, RepairStep} from "./HingeHelperSteps"

export type HingePhase = "greeting" | "scanning" | "results" | "step" | "checking" | "fixed"

@component
export class HingeHelperMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">HingeHelperMain – scan → steps → fixed flow</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Greeting + Scan button panel")
  greeting!: HingeHelperGreetingUI

  @input
  @hint("'Scanning…' card")
  scanStatus!: HingeHelperScanStatusUI

  @input
  @hint("Step panel beside the hinge")
  stepPanel!: HingeHelperStepPanelUI

  @input
  @hint("Virtual cabinet controller (door, ghost, highlights)")
  cabinet!: HingeHelperCabinetController

  @input
  @hint("Sound cues")
  @allowUndefined
  audio: HingeHelperAudioController | undefined

  @input
  @hint("Main camera; used to place the experience in front of the user at start")
  @allowUndefined
  camera: SceneObject | undefined
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Timing</span>')
  @ui.group_start("Timing")
  @input
  @hint("Length of the fake 'scanning…' (seconds)")
  @widget(new SliderWidget(0.5, 6, 0.1))
  scanDurationSec: number = 2.0

  @input
  @hint("How long every broken part stays lit after the scan, before step 1 (seconds)")
  @widget(new SliderWidget(0, 6, 0.1))
  resultOverviewSec: number = 2.5

  @input
  @hint("Length of the fake 'checking…' after Done (seconds)")
  @widget(new SliderWidget(0.3, 4, 0.1))
  checkDurationSec: number = 1.5

  @input
  @hint("Time for the door to snap square at the end (seconds)")
  @widget(new SliderWidget(0, 2, 0.05))
  doorSnapSec: number = 0.6
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Placement</span>')
  @ui.group_start("Placement")
  @input
  @hint("At start, move the cabinet + panels in front of the user (eye level, facing them)")
  placeInFrontAtStart: boolean = true

  @input
  @hint("Distance from the user to the cabinet door at start (cm)")
  @widget(new SliderWidget(50, 150, 1))
  startDistanceCm: number = 80
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Text</span>')
  @ui.group_start("Text")
  @input
  @hint("Panel header right after the scan")
  scanResultTitle: string = "Scan result"

  @input
  @hint("What the (fake) scan found")
  scanResultText: string = "Top hinge is loose: 2 screws backed out, 1 stripped screw hole. The door hangs crooked."

  @input
  @hint("Status line while Done is being checked")
  checkingText: string = "Checking…"

  @input
  @hint("Panel header after the last step")
  fixedTitle: string = "Fixed!"

  @input
  @hint("Panel text after the last step")
  fixedText: string = "The door hangs square again and the hinge is tight."

  @input
  @hint("Step 1 instruction")
  step1Text: string = "Look at the door: the top hinge is loose and the door hangs crooked."
  @input
  @hint("Step 2 instruction")
  step2Text: string = "Hold the door up and tighten the loose hinge screws."
  @input
  @hint("Step 3 instruction")
  step3Text: string = "Fix the stripped hole (wooden toothpicks + glue, or a slightly bigger screw), then drive the screw back in."
  @input
  @hint("Step 4 instruction")
  step4Text: string = "Line the door up with the ghost door and tighten everything."
  @input
  @hint("Step 5 instruction")
  step5Text: string = "Close the door to test it. Done."
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Highlights</span>')
  @ui.group_start("Highlights")
  @input
  @hint("Keep finished parts glowing green (off = finished parts go dark)")
  keepFixedPartsGreen: boolean = true
  @ui.group_end

  private _phase: HingePhase = "greeting"
  private _stepIndex = -1
  private timer = 0
  private steps: RepairStep[] = []
  private frames = 0
  private placed = false

  onAwake(): void {
    const texts = [this.step1Text, this.step2Text, this.step3Text, this.step4Text, this.step5Text]
    this.steps = DEFAULT_STEPS.map((s, i) => ({text: texts[i] || s.text, parts: s.parts}))
    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onStart(): void {
    if (!this.greeting || !this.scanStatus || !this.stepPanel || !this.cabinet) {
      print("[HingeHelperMain] ERROR: greeting / scanStatus / stepPanel / cabinet not wired")
      return
    }
    this.greeting.onScan.add(() => this.onScanPressed())
    this.stepPanel.onDone.add(() => this.onDonePressed())
    this.enterGreeting()
  }

  // ── read-only state ──
  get phase(): HingePhase {
    return this._phase
  }
  /** 1-based current step; 0 before the steps start; totalSteps once fixed. */
  get currentStep(): number {
    return this._stepIndex + 1
  }
  get totalSteps(): number {
    return this.steps.length
  }
  get isChecking(): boolean {
    return this._phase === "checking"
  }
  get isFixed(): boolean {
    return this._phase === "fixed"
  }
  /** Parts highlighted (red) for a 1-based step number. */
  partsForStep(stepNumber: number): HingePart[] {
    const s = this.steps[stepNumber - 1]
    return s ? s.parts.slice() : []
  }
  partState(part: HingePart): PartState {
    return this.cabinet.getPartState(part)
  }
  /** Back to the greeting with the door broken again (demo / test reset). */
  restart(): void {
    this.enterGreeting()
  }

  // ── flow ──
  private enterGreeting(): void {
    this._phase = "greeting"
    this._stepIndex = -1
    this.timer = 0
    this.greeting.setVisible(true)
    this.scanStatus.setVisible(false)
    this.stepPanel.setVisible(false)
    this.cabinet.stopScanSweep()
    this.cabinet.setAllParts("off")
    this.cabinet.setGhostVisible(false)
    this.cabinet.resetDoor()
  }

  private onScanPressed(): void {
    if (this._phase !== "greeting") return
    this._phase = "scanning"
    this.timer = this.scanDurationSec
    this.greeting.setVisible(false)
    this.scanStatus.setVisible(true)
    this.cabinet.playScanSweep(this.scanDurationSec)
    if (this.audio) this.audio.playScan()
  }

  private enterResults(): void {
    this._phase = "results"
    this.timer = this.resultOverviewSec
    this.scanStatus.setVisible(false)
    this.cabinet.stopScanSweep()
    if (this.audio) this.audio.stopScan()
    this.cabinet.setGhostVisible(true)
    for (const p of BROKEN_PARTS) this.cabinet.setPartState(p, "red")
    this.stepPanel.showScanResult(this.scanResultTitle, this.scanResultText || DEFAULT_SCAN_RESULT, "Starting step 1…")
    this.stepPanel.setVisible(true)
  }

  private enterStep(index: number): void {
    this._phase = "step"
    this._stepIndex = index
    const step = this.steps[index]!
    for (const p of ALL_PARTS) {
      const s = this.cabinet.getPartState(p)
      if (s === "red") this.cabinet.setPartState(p, "off")
      if (s === "green" && !this.keepFixedPartsGreen) this.cabinet.setPartState(p, "off")
    }
    for (const p of step.parts) this.cabinet.setPartState(p, "red")
    this.stepPanel.showStep(index + 1, this.steps.length, step.text)
  }

  private onDonePressed(): void {
    if (this._phase !== "step") return
    this._phase = "checking"
    this.timer = this.checkDurationSec
    this.stepPanel.showChecking(this.checkingText)
  }

  private finishCheck(): void {
    const step = this.steps[this._stepIndex]!
    for (const p of step.parts) this.cabinet.setPartState(p, "green")
    if (this._stepIndex >= this.steps.length - 1) {
      this._phase = "fixed"
      this.cabinet.snapDoorSquare(this.doorSnapSec)
      this.stepPanel.showFixed(this.fixedTitle, this.fixedText)
      if (this.audio) this.audio.playFixed()
    } else {
      if (this.audio) this.audio.playCheck()
      this.enterStep(this._stepIndex + 1)
    }
  }

  private onUpdate(): void {
    this.frames++
    if (!this.placed && this.frames >= 3) this.placeInFront()

    if (this.timer <= 0) return
    this.timer -= getDeltaTime()
    if (this.timer > 0) return
    this.timer = 0
    if (this._phase === "scanning") this.enterResults()
    else if (this._phase === "results") this.enterStep(0)
    else if (this._phase === "checking") this.finishCheck()
  }

  private placeInFront(): void {
    this.placed = true
    if (!this.placeInFrontAtStart || !this.camera) return
    const camT = this.camera.getTransform()
    const camPos = camT.getWorldPosition()
    const fwd = camT.forward // camera looks along -forward
    let look = new vec3(-fwd.x, 0, -fwd.z)
    if (look.length < 0.001) look = new vec3(0, 0, -1)
    look = look.normalize()
    const pos = camPos.add(look.uniformScale(this.startDistanceCm))
    const t = this.sceneObject.getTransform()
    t.setWorldPosition(new vec3(pos.x, camPos.y, pos.z))
    t.setWorldRotation(quat.lookAt(look.uniformScale(-1), vec3.up()))
    print("[HingeHelperMain] placed at " + t.getWorldPosition() + " (camera " + camPos + ")")
  }
}
