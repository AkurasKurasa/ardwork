/**
 * Criterion 5: After the last step, the door snaps square to match the ghost door and the panel
 * says "Fixed!".
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {
  check, getMain, obj, pressDoneAndWaitForNext, pressScanAndWaitForStep1, resetToGreeting, waitFor,
} from "./HingeHelperTestUtils"

@component
export class C5_FixedDoorSquareScenario extends Scenario {
  async run(): Promise<void> {
    const main = getMain()
    const interactor = new DefaultLeafInteractor()
    await resetToGreeting(main)
    await pressScanAndWaitForStep1(interactor, main)

    while (main.currentStep < main.totalSteps) await pressDoneAndWaitForNext(interactor, main)
    expect(main.currentStep).toBe(main.totalSteps)
    const before = main.cabinet.doorAngleToGhostDeg
    check(before > 1, `Door already square before the last Done (${before.toFixed(2)}°)`)
    check(!main.isFixed, "Fixed before the last Done")

    await pressDoneAndWaitForNext(interactor, main)
    await waitFor(() => main.isFixed, 3000, "fixed phase after last Done")
    await waitFor(() => main.cabinet.isDoorSquare, 2000, "door square (<0.5° to ghost) within snap time")
    await sleep(200)

    const after = main.cabinet.doorAngleToGhostDeg
    check(after < 0.5, `Door not square: ${after.toFixed(2)}° from ghost`)
    expect(main.stepPanel.stepNumberText).toBe("Fixed!")
    check(obj("StepPanel").isEnabledInHierarchy, "StepPanel hidden at Fixed")
    expect(main.stepPanel.doneButtonVisible).toBe(false)
    print(`[C5] PASS: door ${before.toFixed(2)}° -> ${after.toFixed(3)}°, header="${main.stepPanel.stepNumberText}"`)
  }
}
