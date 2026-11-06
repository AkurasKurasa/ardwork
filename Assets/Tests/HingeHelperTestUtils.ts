/**
 * Shared helpers for the Hinge Helper LEAF scenarios.
 * Drives the real UI Kit buttons through LEAF's SIK interactor (same input path as a user pinch)
 * and reads state through HingeHelperMain's read-only test getters.
 */
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {findSceneObjectByName, nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {HingeHelperMain} from "../Scripts/HingeHelperMain"
import {HingePart, ALL_PARTS} from "../Scripts/HingeHelperSteps"

export function getMain(): HingeHelperMain {
  const root = findSceneObjectByName("HingeHelper")
  if (!root) throw new Error('Scene object "HingeHelper" not found')
  const main = root.getComponent(HingeHelperMain.getTypeName()) as HingeHelperMain
  if (!main) throw new Error("HingeHelperMain component not found on HingeHelper")
  return main
}

export function obj(name: string): SceneObject {
  const so = findSceneObjectByName(name)
  if (!so) throw new Error(`Scene object "${name}" not found`)
  return so
}

/** Poll until cond() is true; throws with `what` on timeout. */
export async function waitFor(cond: () => boolean, timeoutMs: number, what: string): Promise<void> {
  const start = getTime()
  while (!cond()) {
    if ((getTime() - start) * 1000 > timeoutMs) throw new Error(`Timed out after ${timeoutMs} ms waiting for: ${what}`)
    await sleep(50)
  }
}

/** Reset the shared Lens state to the greeting and wait for the panels to settle. */
export async function resetToGreeting(main: HingeHelperMain): Promise<void> {
  await waitFor(() => main.cabinet && main.cabinet.isReady, 5000, "cabinet ready")
  await sleep(500) // deferred panel visibility + placement (3 frames)
  main.restart()
  await nextFrame()
  await nextFrame()
  if (main.phase !== "greeting") throw new Error("restart() did not return to greeting, phase=" + main.phase)
  await waitFor(() => obj("Greeting").enabled, 2000, "Greeting enabled after restart")
}

function findButton(name: string) {
  const b = findInteractablesByName(name, undefined, true)[0]
  if (!b) throw new Error(`Interactable "${name}" not found or not enabled`)
  return b
}

/** Pinch a UI Kit button through LEAF's SIK interactor. */
export async function tap(interactor: DefaultLeafInteractor, buttonName: string): Promise<void> {
  await interactor.trigger(findButton(buttonName))
}

export async function pressScanAndWaitForStep1(interactor: DefaultLeafInteractor, main: HingeHelperMain): Promise<void> {
  await tap(interactor, "ScanButton")
  await waitFor(() => main.phase !== "greeting", 2000, "phase leaves greeting after Scan tap (Scan press not received)")
  await waitFor(() => main.phase === "step" && main.currentStep === 1, 8000, "step 1 after scan")
  await nextFrame()
}

/** Press Done on the current step and wait for the next step (or fixed). */
export async function pressDoneAndWaitForNext(interactor: DefaultLeafInteractor, main: HingeHelperMain): Promise<void> {
  const step = main.currentStep
  await tap(interactor, "DoneButton")
  await waitFor(() => main.phase === "checking" || main.currentStep !== step || main.isFixed, 2000,
    `Done press received on step ${step}`)
  await waitFor(() => main.isFixed || (main.phase === "step" && main.currentStep === step + 1), 5000,
    `advance past step ${step}`)
  await nextFrame()
}

/** Parts currently red. */
export function redParts(main: HingeHelperMain): HingePart[] {
  return ALL_PARTS.filter((p) => main.partState(p) === "red")
}

export function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.indexOf(x) >= 0)
}

/** Base color of the first RenderMeshVisual at or under a SceneObject. */
export function firstBaseColor(so: SceneObject): vec4 | null {
  const rmv = so.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
  if (rmv && rmv.mainMaterial) return rmv.mainMaterial.mainPass.baseColor
  for (let i = 0; i < so.getChildrenCount(); i++) {
    const c = firstBaseColor(so.getChild(i))
    if (c) return c
  }
  return null
}

export function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg)
}
