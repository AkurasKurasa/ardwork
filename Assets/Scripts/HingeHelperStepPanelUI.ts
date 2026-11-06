/**
 * HingeHelperStepPanelUI — the step panel beside the hinge (30 x 20 cm by default).
 *
 * Owns: its UIKit surface, StepNumber / StepText / StatusText labels, and the DoneButton.
 * Emits: onDone when the Done button is pinched.
 * Exposes: setVisible, showScanResult, showStep, showChecking, showFixed, and read-only
 *          getters (stepNumberText, stepText, statusText, doneButtonVisible) for tests.
 * Must not: track which step is current or decide what Done does (HingeHelperMain does).
 */
import Event, {PublicApi} from "InteractionKit.lspkg/Utils/Event"
import {Button} from "UIKit.lspkg/Scripts/Components/Button/Button"
import {
  DeferredVisibility,
  makeBackPlate,
  makeBigButton,
  makeColumn,
  makeIcon,
  makeRow,
  makeText,
} from "./HingeHelperSharedUI"

const ICON_STEP: Texture = requireAsset("../Icons/build.png") as Texture
const ICON_RESULT: Texture = requireAsset("../Icons/document_scanner.png") as Texture
const ICON_FIXED: Texture = requireAsset("../Icons/task_alt.png") as Texture
const ICON_DONE: Texture = requireAsset("../Icons/check.png") as Texture

@component
export class HingeHelperStepPanelUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">HingeHelperStepPanelUI – step number, instruction, Done</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Label on the Done button")
  doneLabel: string = "Done"

  @input
  @hint("Panel width in cm")
  @widget(new SliderWidget(20, 40, 1))
  panelWidth: number = 30

  @input
  @hint("Panel height in cm")
  @widget(new SliderWidget(14, 30, 1))
  panelHeight: number = 20

  @input("vec4", "{0.6, 0.95, 1.0, 1.0}")
  @hint("Color of the 'checking…' status line")
  @widget(new ColorWidget())
  statusColor: vec4 = new vec4(0.6, 0.95, 1.0, 1.0)

  @input("vec4", "{0.45, 1.0, 0.55, 1.0}")
  @hint("Color of the header when the repair is finished")
  @widget(new ColorWidget())
  fixedColor: vec4 = new vec4(0.45, 1.0, 0.55, 1.0)
  @ui.group_end

  private readonly _onDone = new Event<void>()
  /** Fires when the user pinches Done. */
  get onDone(): PublicApi<void> {
    return this._onDone.publicApi()
  }

  private visibility!: DeferredVisibility
  private headerIcon!: Image
  private stepNumber!: Text
  private stepTextC!: Text
  private statusTextC!: Text
  private doneButton!: Button

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    makeBackPlate(this.sceneObject, this.panelWidth, this.panelHeight)
    const innerW = this.panelWidth - 3
    const col = makeColumn(this.sceneObject, "StepContent", this.panelWidth, this.panelHeight, {
      gap: 0.7,
      padX: 1.5,
      padY: 1.4,
    })
    const header = makeRow(col, "StepHeader", innerW, 3, 0.8)
    this.headerIcon = makeIcon(header, "StepIcon", ICON_STEP, 2.6)
    this.stepNumber = makeText(header, "StepNumber", "Step 1 of 5", "Headline2", innerW - 4, 3, {
      align: HorizontalAlignment.Left,
    })
    this.stepTextC = makeText(
      col,
      "StepText",
      "Fix the stripped hole (wooden toothpicks + glue, or a slightly bigger screw), then drive the screw back in.",
      "Subheadline",
      innerW,
      7.2,
      {wrap: true, align: HorizontalAlignment.Left},
    )
    this.statusTextC = makeText(col, "StatusText", "", "Body", innerW, 1.8, {color: this.statusColor})
    this.doneButton = makeBigButton(col, "DoneButton", this.doneLabel, ICON_DONE, 14, 4.4)
    this.doneButton.onTriggerUp.add(() => this._onDone.invoke())

    this.visibility = new DeferredVisibility(this, this.sceneObject, false)
  }

  setVisible(visible: boolean): void {
    this.visibility.set(visible)
  }

  /** Overview right after the scan: what was found, no Done button. */
  showScanResult(title: string, text: string, status: string): void {
    this.setHeader(ICON_RESULT, title, new vec4(1, 1, 1, 1))
    this.stepTextC.text = text
    this.statusTextC.text = status
    this.setDoneVisible(false)
  }

  /** A repair step (1-based) with the Done button ready. */
  showStep(stepNumber: number, total: number, text: string): void {
    this.setHeader(ICON_STEP, "Step " + stepNumber + " of " + total, new vec4(1, 1, 1, 1))
    this.stepTextC.text = text
    this.statusTextC.text = ""
    this.setDoneVisible(true)
    this.doneButton.inactive = false
  }

  /** Fake verification in progress: Done is locked, status line shows the message. */
  showChecking(message: string): void {
    this.statusTextC.text = message
    this.doneButton.inactive = true
  }

  /** Final state after the last step. */
  showFixed(title: string, text: string): void {
    this.setHeader(ICON_FIXED, title, this.fixedColor)
    this.stepTextC.text = text
    this.statusTextC.text = ""
    this.setDoneVisible(false)
  }

  // ── read-only view state (for tests) ──
  get isVisible(): boolean {
    return this.visibility.visible
  }
  get stepNumberText(): string {
    return this.stepNumber ? this.stepNumber.text : ""
  }
  get stepText(): string {
    return this.stepTextC ? this.stepTextC.text : ""
  }
  get statusText(): string {
    return this.statusTextC ? this.statusTextC.text : ""
  }
  get doneButtonVisible(): boolean {
    return this.doneButton ? this.doneButton.sceneObject.enabled : false
  }

  private setHeader(icon: Texture, text: string, color: vec4): void {
    this.headerIcon.mainMaterial.mainPass.baseTex = icon
    this.stepNumber.text = text
    this.stepNumber.textFill.color = color
  }

  private setDoneVisible(v: boolean): void {
    this.doneButton.sceneObject.enabled = v
  }
}
