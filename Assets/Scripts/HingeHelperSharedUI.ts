/**
 * HingeHelperSharedUI — shared UIKit composition helpers for the Hinge Helper UI modules.
 *
 * Owns: the type scale, deferred show/hide, and small builders (panel surface, flex column,
 * text row, icon, big button) used by HingeHelperGreetingUI / HingeHelperScanStatusUI /
 * HingeHelperStepPanelUI. Not a component. Holds no state and makes no game decisions.
 */
import {FlexLayout} from "UIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "UIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "UIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {BackPlate} from "UIKit.lspkg/Scripts/BackPlate"
import {Button} from "UIKit.lspkg/Scripts/Components/Button/Button"
import {ElementContent} from "UIKit.lspkg/Scripts/Components/Content/ElementContent"

const IMAGE_MATERIAL: Material = requireAsset("../Materials/ImageMaterial.mat") as Material

// ── Type scale — single source of truth (specs-build-ui patterns → Typography)
const FONT_SIZE_SCALE = 1.0
export type TextRole =
  | "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
  | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700}, Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700}, Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700}, Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500}, Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500}, Caption: {size: 38, weight: 500},
}
export function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}
export function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

/** Content sits +0.6 cm in front of the BackPlate to avoid z-fighting. */
export const CONTENT_Z = 0.6
const BUTTON_LABEL_Z = 0.08

export function makeObj(parent: SceneObject, name: string, pos?: vec3): SceneObject {
  const so = global.scene.createSceneObject(name)
  so.setParent(parent)
  if (pos) so.getTransform().setLocalPosition(pos)
  return so
}

/** Static panel surface sized exactly to (w, h). */
export function makeBackPlate(host: SceneObject, w: number, h: number): BackPlate {
  const plate = host.createComponent(BackPlate.getTypeName()) as BackPlate
  plate.size = new vec2(w, h)
  return plate
}

/** Column FlexLayout on a Content child lifted in front of the plate. */
export function makeColumn(
  parent: SceneObject, name: string, w: number, h: number,
  opts: {gap: number; padX: number; padY: number; justify?: FlexJustify; align?: FlexAlign},
): SceneObject {
  const so = makeObj(parent, name, new vec3(0, 0, CONTENT_Z))
  const flex = so.createComponent(FlexLayout.getTypeName()) as FlexLayout
  flex.width = w
  flex.height = h
  flex.direction = FlexDirection.Column
  flex.rowGap = opts.gap
  flex.paddingLeft = opts.padX
  flex.paddingRight = opts.padX
  flex.paddingTop = opts.padY
  flex.paddingBottom = opts.padY
  flex.justifyContent = opts.justify ?? FlexJustify.Center
  flex.alignItems = opts.align ?? FlexAlign.Center
  return so
}

/** Row FlexLayout child of a column. */
export function makeRow(parent: SceneObject, name: string, w: number, h: number, gap: number): SceneObject {
  const so = makeObj(parent, name)
  const flex = so.createComponent(FlexLayout.getTypeName()) as FlexLayout
  flex.width = w
  flex.height = h
  flex.direction = FlexDirection.Row
  flex.columnGap = gap
  flex.justifyContent = FlexJustify.Center
  flex.alignItems = FlexAlign.Center
  const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
  item.overrideWidth = w
  item.overrideHeight = h
  return so
}

/** Raw Text placed by the parent FlexLayout (fixed cell size, optional wrapping). */
export function makeText(
  parent: SceneObject, name: string, text: string, role: TextRole, w: number, h: number,
  opts?: {wrap?: boolean; color?: vec4; align?: HorizontalAlignment; distanceCm?: number},
): Text {
  const so = makeObj(parent, name)
  const t = so.createComponent("Component.Text") as Text
  t.text = text
  t.depthTest = true
  applyTextRole(t, role, opts?.distanceCm ?? 110)
  t.horizontalAlignment = opts?.align ?? HorizontalAlignment.Center
  t.verticalAlignment = VerticalAlignment.Center
  t.horizontalOverflow = opts?.wrap ? HorizontalOverflow.Wrap : HorizontalOverflow.Overflow
  t.verticalOverflow = VerticalOverflow.Overflow
  t.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
  if (opts?.color) t.textFill.color = opts.color
  const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
  item.overrideWidth = w
  item.overrideHeight = h
  item.alignSelf = FlexAlignSelf.Center
  return t
}

/** Icon image in a fixed square cell (material cloned per instance). */
export function makeIcon(parent: SceneObject, name: string, tex: Texture, sizeCm: number): Image {
  const so = makeObj(parent, name)
  so.getTransform().setLocalScale(new vec3(sizeCm, sizeCm, 1))
  const img = so.createComponent("Component.Image") as Image
  const mat = IMAGE_MATERIAL.clone()
  mat.mainPass.baseTex = tex
  mat.mainPass.depthTest = true
  mat.mainPass.depthWrite = false
  img.clearMaterials()
  img.addMaterial(mat)
  const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
  item.overrideWidth = sizeCm
  item.overrideHeight = sizeCm
  return img
}

/** Big UIKit Button whose whole face is an ElementContent (label + leading icon). */
export function makeBigButton(
  parent: SceneObject, name: string, label: string, icon: Texture | null, w: number, h: number,
): Button {
  const so = makeObj(parent, name)
  const btn = so.createComponent(Button.getTypeName()) as Button
  btn.size = new vec3(w, h, 1) // BEFORE init
  const ec = so.createComponent(ElementContent.getTypeName()) as ElementContent
  ec.text = label
  ec.textSize = roleSize("Headline2")
  if (icon) {
    ec.leadingIcon = icon
    ec.leadingIconSize = h * 0.55
  }
  ec.zOffset = BUTTON_LABEL_Z
  const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
  item.overrideWidth = w
  item.overrideHeight = h
  return btn
}

/**
 * Deferred visibility: UIKit Elements initialize on OnStartEvent, so a host disabled before
 * its first frame never initializes. Panels build in onAwake, then apply the requested
 * visibility one frame later (after every child has initialized).
 */
export class DeferredVisibility {
  private ready = false
  private wanted: boolean

  constructor(private readonly script: BaseScriptComponent, private readonly host: SceneObject, startVisible: boolean) {
    this.wanted = startVisible
    // Shrink the host while children initialize so a start-hidden panel never flashes on frame 1.
    const t = host.getTransform()
    const scale = t.getLocalScale()
    t.setLocalScale(scale.uniformScale(0.0001))
    script.createEvent("OnStartEvent").bind(() => {
      const delay = script.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
      delay.bind(() => {
        this.ready = true
        t.setLocalScale(scale)
        this.host.enabled = this.wanted
      })
      delay.reset(0)
    })
  }

  set(visible: boolean): void {
    this.wanted = visible
    if (this.ready) this.host.enabled = visible
  }

  get visible(): boolean {
    return this.wanted
  }
}
