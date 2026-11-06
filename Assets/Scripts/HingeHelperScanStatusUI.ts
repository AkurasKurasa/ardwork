/**
 * HingeHelperScanStatusUI — small "Scanning…" card shown while the fake scan runs.
 *
 * Owns: its UIKit surface and the ScanStatusText label (with animated dots, view-only).
 * Exposes: setVisible(v), setMessage(msg).
 * Must not: time the scan or decide when it ends (HingeHelperMain does).
 */
import {DeferredVisibility, makeBackPlate, makeColumn, makeIcon, makeRow, makeText} from "./HingeHelperSharedUI"

const ICON_SCAN: Texture = requireAsset("../Icons/document_scanner.png") as Texture

@component
export class HingeHelperScanStatusUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">HingeHelperScanStatusUI – "Scanning…" card</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Message shown while scanning (dots animate after it)")
  scanningText: string = "Scanning"

  @input("vec4", "{0.6, 0.95, 1.0, 1.0}")
  @hint("Text color of the scanning message")
  @widget(new ColorWidget())
  textColor: vec4 = new vec4(0.6, 0.95, 1.0, 1.0)
  @ui.group_end

  private visibility!: DeferredVisibility
  private label!: Text
  private message = ""
  private t = 0

  onAwake(): void {
    this.message = this.scanningText
    this.sceneObject.createComponent("Component.Canvas")
    const w = 24
    const h = 7
    makeBackPlate(this.sceneObject, w, h)
    const col = makeColumn(this.sceneObject, "ScanStatusContent", w, h, {gap: 0, padX: 1.5, padY: 1})
    const row = makeRow(col, "ScanStatusRow", w - 3, 4, 1.0)
    makeIcon(row, "ScanStatusIcon", ICON_SCAN, 3.2)
    this.label = makeText(row, "ScanStatusText", this.message + "…", "Headline1", 14, 4, {
      color: this.textColor,
      align: HorizontalAlignment.Left,
    })

    this.createEvent("UpdateEvent").bind(() => {
      this.t += getDeltaTime()
      const dots = 1 + (Math.floor(this.t * 3) % 3)
      this.label.text = this.message + ".".repeat(dots)
    })
    this.visibility = new DeferredVisibility(this, this.sceneObject, false)
  }

  setVisible(visible: boolean): void {
    this.visibility.set(visible)
  }

  setMessage(msg: string): void {
    this.message = msg
  }
}
