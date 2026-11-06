/**
 * HingeHelperGreetingUI — the start panel: greeting question + big Scan button.
 *
 * Owns: its own UIKit surface (BackPlate + FlexLayout column), the ScanButton.
 * Emits: onScan when the Scan button is pinched.
 * Exposes: setVisible(v).
 * Must not: hold app state or decide what happens after a scan (HingeHelperMain does).
 */
import Event, {PublicApi} from "InteractionKit.lspkg/Utils/Event"
import {Button} from "UIKit.lspkg/Scripts/Components/Button/Button"
import {DeferredVisibility, makeBackPlate, makeBigButton, makeColumn, makeText} from "./HingeHelperSharedUI"

const ICON_SCAN: Texture = requireAsset("../Icons/document_scanner.png") as Texture

@component
export class HingeHelperGreetingUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">HingeHelperGreetingUI – greeting + Scan button</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Question shown before the scan")
  greetingText: string = "What should I help you with today?"

  @input
  @hint("Hint line under the greeting")
  hintText: string = "Look at the broken cabinet, then pinch Scan."

  @input
  @hint("Label on the scan button")
  scanLabel: string = "Scan"

  @input
  @hint("Panel width in cm")
  @widget(new SliderWidget(20, 40, 1))
  panelWidth: number = 30

  @input
  @hint("Panel height in cm")
  @widget(new SliderWidget(14, 30, 1))
  panelHeight: number = 20
  @ui.group_end

  private readonly _onScan = new Event<void>()
  /** Fires when the user pinches Scan. */
  get onScan(): PublicApi<void> {
    return this._onScan.publicApi()
  }

  private visibility!: DeferredVisibility
  private scanButton!: Button

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    makeBackPlate(this.sceneObject, this.panelWidth, this.panelHeight)
    const innerW = this.panelWidth - 4
    const col = makeColumn(this.sceneObject, "GreetingContent", this.panelWidth, this.panelHeight, {
      gap: 1.2,
      padX: 2,
      padY: 2,
    })
    makeText(col, "GreetingText", this.greetingText, "Headline1", innerW, 6.4, {wrap: true})
    makeText(col, "GreetingHint", this.hintText, "Body", innerW, 2.4, {color: new vec4(1, 1, 1, 0.75)})
    this.scanButton = makeBigButton(col, "ScanButton", this.scanLabel, ICON_SCAN, 16, 5.5)
    this.scanButton.onTriggerUp.add(() => this._onScan.invoke())

    this.visibility = new DeferredVisibility(this, this.sceneObject, true)
  }

  setVisible(visible: boolean): void {
    this.visibility.set(visible)
  }

  get isVisible(): boolean {
    return this.visibility.visible
  }
}
