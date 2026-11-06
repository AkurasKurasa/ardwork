/**
 * Criterion 2: After the scan, a faint ghost door appears over the real door, in the correct
 * position, and stays visible through every step (and after Fixed).
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {
  check, firstBaseColor, getMain, obj, pressDoneAndWaitForNext, pressScanAndWaitForStep1, resetToGreeting, waitFor,
} from "./HingeHelperTestUtils"

@component
export class C2_GhostDoorScenario extends Scenario {
  async run(): Promise<void> {
    const main = getMain()
    const interactor = new DefaultLeafInteractor()
    await resetToGreeting(main)

    const ghost = obj("GhostDoor")
    const ghostPanel = obj("GhostDoorPanel")
    const pivot = obj("DoorPivot")
    const door = obj("Door")
    check(!ghost.isEnabledInHierarchy, "Ghost door visible before the scan")

    const ghostVisible = (where: string) => {
      check(main.cabinet.ghostVisible && ghost.isEnabledInHierarchy && ghostPanel.isEnabledInHierarchy,
        `Ghost door not visible at ${where}`)
    }

    await pressScanAndWaitForStep1(interactor, main)

    // Position: ghost hinge pivot == real door pivot, ghost panel == door panel offset.
    const dp = ghost.getTransform().getWorldPosition().distance(pivot.getTransform().getWorldPosition())
    check(dp < 0.5, `GhostDoor pivot is ${dp.toFixed(2)} cm from DoorPivot`)
    const dl = ghostPanel.getTransform().getLocalPosition().distance(door.getTransform().getLocalPosition())
    check(dl < 0.5, `GhostDoorPanel local offset differs from Door by ${dl.toFixed(2)} cm`)
    const ws = ghostPanel.getTransform().getWorldScale()
    const ds = door.getTransform().getWorldScale()
    check(Math.abs(ws.x - ds.x) < 2 && Math.abs(ws.y - ds.y) < 2, `Ghost size ${ws} does not match door ${ds}`)
    // Ghost is the square pose: upright (no tilt relative to the cabinet).
    const cabRot = obj("VirtualCabinet").getTransform().getWorldRotation()
    const ghostTilt = (quat.angleBetween(ghost.getTransform().getWorldRotation(), cabRot) * 180) / Math.PI
    check(ghostTilt < 0.5, `Ghost door is tilted ${ghostTilt.toFixed(2)}° from square`)
    const startAngle = main.cabinet.doorAngleToGhostDeg
    check(startAngle > 1, `Real door should start crooked vs ghost, angle=${startAngle.toFixed(2)}°`)

    // Faint: ~25% alpha light cyan.
    const c = firstBaseColor(ghostPanel)
    check(!!c, "GhostDoorPanel has no material color")
    check(c!.a > 0.1 && c!.a < 0.45, `Ghost alpha not faint: ${c!.a}`)
    check(c!.b > 0.7 && c!.g > 0.7 && c!.r < c!.g, `Ghost color not light cyan: ${c}`)

    // Visible at every step 1..5 and after fixed.
    for (let step = 1; step <= main.totalSteps; step++) {
      expect(main.currentStep).toBe(step)
      ghostVisible(`step ${step}`)
      await pressDoneAndWaitForNext(interactor, main)
    }
    await waitFor(() => main.isFixed, 3000, "fixed")
    await sleep(900) // door snap 0.6 s
    ghostVisible("Fixed")
    check(main.cabinet.doorAngleToGhostDeg < 0.5,
      `Door does not match ghost at end: ${main.cabinet.doorAngleToGhostDeg.toFixed(2)}°`)
    print(`[C2] PASS: ghost alpha=${c!.a.toFixed(2)} color=${c}, pivot offset=${dp.toFixed(2)}cm, start angle=${startAngle.toFixed(2)}°, end angle=${main.cabinet.doorAngleToGhostDeg.toFixed(2)}°`)
  }
}
