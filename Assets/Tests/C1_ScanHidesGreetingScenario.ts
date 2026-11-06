/**
 * Criterion 1: Pressing Scan makes the greeting disappear and highlights the loose screws in red.
 */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {nextFrame} from "Leaf.lspkg/Utils/common/Utils"
import {check, firstBaseColor, getMain, obj, resetToGreeting, tap, waitFor} from "./HingeHelperTestUtils"

@component
export class C1_ScanHidesGreetingScenario extends Scenario {
  async run(): Promise<void> {
    const main = getMain()
    const interactor = new DefaultLeafInteractor()
    await resetToGreeting(main)

    // Before Scan: greeting shown, screws not highlighted.
    expect(obj("Greeting").enabled).toBe(true)
    expect(main.partState("ScrewA")).toBe("off")
    expect(main.partState("ScrewB")).toBe("off")
    expect(obj("Highlight_ScrewA").enabled).toBe(false)

    // Press the real Scan button.
    await tap(interactor, "ScanButton")
    await waitFor(() => main.phase !== "greeting", 2000, "Scan press received (phase leaves greeting)")
    await nextFrame()

    // Greeting is gone.
    check(!obj("Greeting").enabled, "Greeting SceneObject still enabled after Scan")
    expect(main.greeting.isVisible).toBe(false)

    // Scan finishes (2 s) -> results overview: screws red.
    await waitFor(() => main.phase === "results", 4000, "results overview after scan")
    await nextFrame()
    for (const part of ["ScrewA", "ScrewB"] as const) {
      expect(main.partState(part)).toBe("red")
      const so = obj("Highlight_" + part)
      check(so.isEnabledInHierarchy, `Highlight_${part} not visible (enabled in hierarchy) during results`)
      const c = firstBaseColor(so)
      check(!!c, `Highlight_${part} has no material color`)
      check(c!.r > 0.3 && c!.r > c!.g * 1.5 && c!.r > c!.b * 1.5, `Highlight_${part} color not red: ${c}`)
    }
    check(!obj("Greeting").enabled, "Greeting reappeared during results")
    print("[C1] PASS: greeting hidden, ScrewA/ScrewB red, color=" + firstBaseColor(obj("Highlight_ScrewA")))
  }
}
