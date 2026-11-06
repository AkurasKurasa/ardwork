/**
 * Criterion 4: Pinching Done shows "checking…", turns that part green, and moves the panel to the
 * next step with its part highlighted. Checked for every step transition 1→2 … 4→5.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {nextFrame} from "Leaf.lspkg/Utils/common/Utils"
import {
  check, getMain, obj, pressScanAndWaitForStep1, redParts, resetToGreeting, sameSet, tap, waitFor,
} from "./HingeHelperTestUtils"

@component
export class C4_DoneAdvancesStepScenario extends Scenario {
  async run(): Promise<void> {
    const main = getMain()
    const interactor = new DefaultLeafInteractor()
    await resetToGreeting(main)
    await pressScanAndWaitForStep1(interactor, main)

    for (let step = 1; step < main.totalSteps; step++) {
      expect(main.currentStep).toBe(step)
      const parts = main.partsForStep(step)

      await tap(interactor, "DoneButton")
      await waitFor(() => main.phase === "checking" || main.currentStep !== step, 2000, `Done press received on step ${step}`)
      check(main.phase === "checking", `Step ${step}: Done skipped the checking phase (phase=${main.phase})`)
      const status = main.stepPanel.statusText
      check(status.toLowerCase().indexOf("checking") >= 0, `Step ${step}: status text "${status}" lacks "checking…"`)

      await waitFor(() => main.phase === "step" && main.currentStep === step + 1, 4000, `advance to step ${step + 1}`)
      await nextFrame()

      for (const p of parts) {
        check(main.partState(p) === "green", `Step ${step}: part ${p} is ${main.partState(p)}, expected green`)
        check(obj("Highlight_" + p).isEnabledInHierarchy, `Step ${step}: green Highlight_${p} not visible`)
      }
      const next = main.partsForStep(step + 1)
      const red = redParts(main)
      check(sameSet(red, next), `Step ${step + 1}: red parts [${red}] expected [${next}]`)
      expect(main.stepPanel.stepNumberText).toBe(`Step ${step + 1} of ${main.totalSteps}`)
      check(main.stepPanel.statusText.toLowerCase().indexOf("checking") < 0, `Step ${step + 1}: "checking" text not cleared`)
      expect(main.stepPanel.doneButtonVisible).toBe(true)
      print(`[C4] step ${step}->${step + 1}: status="${status}", green=[${parts}], red=[${red}]`)
    }
    print("[C4] PASS")
  }
}
