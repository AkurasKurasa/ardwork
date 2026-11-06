/**
 * Criterion 3: After the scan, the step panel appears beside the hinge with step 1,
 * and only that step's part is highlighted.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {
  check, getMain, obj, pressScanAndWaitForStep1, redParts, resetToGreeting, sameSet,
} from "./HingeHelperTestUtils"

@component
export class C3_StepPanelStep1Scenario extends Scenario {
  async run(): Promise<void> {
    const main = getMain()
    const interactor = new DefaultLeafInteractor()
    await resetToGreeting(main)
    check(!obj("StepPanel").enabled, "StepPanel visible before scan")

    await pressScanAndWaitForStep1(interactor, main)

    // Panel visible.
    const panel = obj("StepPanel")
    expect(main.stepPanel.isVisible).toBe(true)
    check(panel.isEnabledInHierarchy, "StepPanel SceneObject not enabled at step 1")
    check(panel.getTransform().getWorldScale().x > 0.5, "StepPanel still scaled near zero")

    // Step 1 content.
    expect(main.stepPanel.stepNumberText).toBe("Step 1 of " + main.totalSteps)
    expect(main.stepPanel.stepText).toBe(main.step1Text)
    expect(main.stepPanel.doneButtonVisible).toBe(true)

    // Beside the hinge: roughly level with it, to its side, within arm's length.
    const hinge = obj("TopHinge").getTransform().getWorldPosition()
    const p = panel.getTransform().getWorldPosition()
    const d = p.sub(hinge)
    const horiz = Math.sqrt(d.x * d.x + d.z * d.z)
    check(Math.abs(d.y) < 20, `Panel is ${d.y.toFixed(1)} cm above/below the hinge`)
    check(horiz > 8 && horiz < 45, `Panel horizontal distance to hinge ${horiz.toFixed(1)} cm (expected beside, 8–45 cm)`)

    // Only step 1's part(s) highlighted.
    const expected = main.partsForStep(1)
    const red = redParts(main)
    check(sameSet(red, expected), `Red parts at step 1 = [${red}] expected [${expected}]`)
    for (const part of expected) check(obj("Highlight_" + part).isEnabledInHierarchy, `Highlight_${part} not visible`)
    for (const part of ["ScrewA", "ScrewB", "StrippedHole", "DoorAlign", "Handle"]) {
      if (expected.indexOf(part as any) < 0)
        check(!obj("Highlight_" + part).isEnabledInHierarchy, `Highlight_${part} still visible at step 1`)
    }
    print(`[C3] PASS: header="${main.stepPanel.stepNumberText}", red=[${red}], panel offset from hinge=${d}`)
  }
}
