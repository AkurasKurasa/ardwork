---
status: approved
---

# Design brief: Hinge Helper (default name)

## The one spatial moment
Standing at a cabinet whose door is completely loose and hanging off-angle, I see a faint ghost of the door "how it should be" over the real one, the broken hinge screw highlighted, and a step panel on the side telling me what to do. I keep my eyes on the problem, fix that part, pinch Done, and it turns green as the next part lights up.

## Why it belongs on glasses
- Uses: draws in the world, leaves your body free (and, on real glasses, shares your view)
- Why it's better than the phone or laptop version: the highlights and the ghost door sit right on the hinge at real size, so you never compare a video to your cabinet, and both hands stay free for the door and the screwdriver.

## Product or overlay
- Type: overlay (it responds to a real broken cabinet)
- What the real version would sense: the camera sees the cabinet and an AI vision model works out what's wrong with the hinge.
- Stand-in for the preview: a real-size **virtual cabinet** in the room with a known fault (a completely loose hinge), plus a **Scan** button that fakes the scan with a short "scanning…" and then shows a hard-coded result. The steps are hard-coded too, so the demo never depends on AI.

## Where things live
- Where the user is looking during the main task: at the loose hinge on the cabinet door.
- Virtual cabinet: wall-mounted, about 80 cm in front of the user at start (default). Door about 40 cm wide x 60 cm tall, spanning about 110 to 170 cm off the floor (default). Hinges on the left edge, top and bottom (default).
- The fault: the top hinge is completely loose. Its screws have backed out, one screw hole is stripped, and the door hangs off-angle (default details).
- Ghost door: an overlay on the actual door, in the correct closed, square position. Faint and see-through (light cyan, about 25% opacity, default) so it never hides the highlighted screw.
- Highlights: on the broken parts themselves (screws, screw hole, hinge plate). Red for "needs fixing", green for "fixed" (default colors).
- Step panel: "somewhere on the side". It sits beside the cabinet on the hinge side, about 25 cm to the left of the hinge, at hinge height, about 30 x 20 cm, facing the user (default). It shows the step number, one short instruction, and the Done button.
- Greeting ("What should I help you with today?") and Scan button: in the step panel's spot before the scan (default).

## Hands and input
- Start the scan: pinch the big **Scan** button.
- Finish a step: pinch the big **Done** button on the step panel. A short "checking…" plays (faked), then the part turns green and the next step appears.
- Targets are big and highlight when aimed at.
- Voice: none in this version. Scan replaces "speak to start".

## When things show
- Greeting + Scan button: show at start, hide as soon as Scan is pressed.
- Ghost door: shows after the scan and stays up the whole time as a visual guide.
- Highlights: right after the scan, every broken part lights up at once. Once the steps start, only the part for the current step is highlighted. It turns green when Done is pressed.
- Step panel: shows after the scan and updates with each step. At the end it shows "Fixed!" (default).
- Steps (default, edit freely):
  1. Look at the door: the top hinge is loose and the door hangs crooked.
  2. Hold the door up and tighten the loose hinge screws.
  3. Fix the stripped hole (wooden toothpicks + glue, or a slightly bigger screw), then drive the screw back in.
  4. Line the door up with the ghost door and tighten everything.
  5. Close the door to test it. Done.
- If something needs attention out of view: none needed. Everything is on one cabinet in front of you.

## Done criteria
Each one can be checked in Lens Studio's preview. (1 is in the learner's words; 2–5 are drafted from their answers.)
1. Pressing Scan makes the greeting disappear and highlights the loose screws in red.
2. After the scan, a faint ghost door appears over the real door, in the correct position, and stays visible through every step.
3. After the scan, the step panel appears beside the hinge with step 1, and only that step's part is highlighted.
4. Pinching Done shows "checking…", turns that part green, and moves the panel to the next step with its part highlighted.
5. After the last step, the door snaps square to match the ghost door and the panel says "Fixed!".

## Out of scope
- Real scanning or recognizing a real cabinet (needs glasses + camera + AI vision or SnapML).
- Voice commands and a live AI conversation.
- Custom gestures (e.g. a "finished" gesture). Pinch Done does that job.
- Other repairs (light bulb, etc.) until this one works.

## Risks and open questions
- The learner originally wanted a live AI that you speak to and that scans the problem continuously. In this version, scanning and checking are faked and the steps are hard-coded. Real recognition is a possible future step on real glasses.
- The ghost door stays on the whole time. That's the learner's choice. Watch that it doesn't clutter the view or hide highlights. Feel unproven.
- Comfort of working at a wall cabinet with raised arms on real glasses: feel unproven.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
