import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {C1_ScanHidesGreetingScenario} from "./C1_ScanHidesGreetingScenario"
import {C2_GhostDoorScenario} from "./C2_GhostDoorScenario"
import {C3_StepPanelStep1Scenario} from "./C3_StepPanelStep1Scenario"
import {C4_DoneAdvancesStepScenario} from "./C4_DoneAdvancesStepScenario"
import {C5_FixedDoorSquareScenario} from "./C5_FixedDoorSquareScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "c1-scan-hides-greeting", typename: C1_ScanHidesGreetingScenario.getTypeName()},
    {id: "c2-ghost-door", typename: C2_GhostDoorScenario.getTypeName()},
    {id: "c3-step-panel-step1", typename: C3_StepPanelStep1Scenario.getTypeName()},
    {id: "c4-done-advances-step", typename: C4_DoneAdvancesStepScenario.getTypeName()},
    {id: "c5-fixed-door-square", typename: C5_FixedDoorSquareScenario.getTypeName()},
  ]
}
