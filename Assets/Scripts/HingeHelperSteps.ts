/**
 * HingeHelperSteps — hard-coded repair data for the Hinge Helper demo.
 *
 * Owns: the fake scan result text, the five repair steps, and which highlight
 * part each step points at. Pure data, no scene access.
 *
 * Part names map 1:1 to authored SceneObjects named `Highlight_<part>` under the
 * VirtualCabinet (see HingeHelperCabinetController).
 */

export type HingePart = "HingePlate" | "ScrewA" | "ScrewB" | "StrippedHole" | "DoorAlign" | "Handle"

/** Every broken / to-check part, in the order they light up after the scan. */
export const ALL_PARTS: HingePart[] = ["HingePlate", "ScrewA", "ScrewB", "StrippedHole", "DoorAlign", "Handle"]

/** Parts that are actually broken (the scan overview lights these red). */
export const BROKEN_PARTS: HingePart[] = ["HingePlate", "ScrewA", "ScrewB", "StrippedHole"]

export interface RepairStep {
  /** One short instruction (from the approved design brief). */
  text: string
  /** Parts highlighted while this step is current. */
  parts: HingePart[]
}

export const DEFAULT_STEPS: RepairStep[] = [
  {text: "Look at the door: the top hinge is loose and the door hangs crooked.", parts: ["HingePlate"]},
  {text: "Hold the door up and tighten the loose hinge screws.", parts: ["ScrewA", "ScrewB"]},
  {
    text: "Fix the stripped hole (wooden toothpicks + glue, or a slightly bigger screw), then drive the screw back in.",
    parts: ["StrippedHole"],
  },
  {text: "Line the door up with the ghost door and tighten everything.", parts: ["DoorAlign"]},
  {text: "Close the door to test it. Done.", parts: ["Handle"]},
]

export const DEFAULT_SCAN_RESULT =
  "Top hinge is loose: 2 screws backed out, 1 stripped screw hole. The door hangs crooked."
