/**
 * HingeHelperAudioController — plays the three Hinge Helper sound cues.
 *
 * Owns: one AudioComponent per cue (LowLatency for snappy feedback) and their volume.
 * Expects (@input): scanSweep, checkBlip, fixedChime audio tracks (swappable in the Inspector).
 * Must not: decide when cues play (HingeHelperMain calls playScan / playCheck / playFixed).
 */
@component
export class HingeHelperAudioController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">HingeHelperAudioController – scan / check / fixed cues</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Plays while the fake scan runs")
  @allowUndefined
  scanSweep: AudioTrackAsset | undefined

  @input
  @hint("Plays when a step checks out and turns green")
  @allowUndefined
  checkBlip: AudioTrackAsset | undefined

  @input
  @hint("Plays when the repair is finished (Fixed!)")
  @allowUndefined
  fixedChime: AudioTrackAsset | undefined
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Volume for all cues")
  @widget(new SliderWidget(0, 1, 0.05))
  volume: number = 0.8
  @ui.group_end

  private players = new Map<string, AudioComponent>()

  onAwake(): void {
    this.make("scan", this.scanSweep)
    this.make("check", this.checkBlip)
    this.make("fixed", this.fixedChime)
  }

  playScan(): void {
    this.play("scan")
  }
  stopScan(): void {
    const a = this.players.get("scan")
    if (a && a.isPlaying()) a.stop(false)
  }
  playCheck(): void {
    this.play("check")
  }
  playFixed(): void {
    this.play("fixed")
  }

  private make(key: string, track: AudioTrackAsset | undefined): void {
    if (!track) return
    const so = global.scene.createSceneObject("Audio_" + key)
    so.setParent(this.sceneObject)
    const a = so.createComponent("Component.AudioComponent") as AudioComponent
    a.audioTrack = track
    a.playbackMode = Audio.PlaybackMode.LowLatency
    a.volume = this.volume
    this.players.set(key, a)
  }

  private play(key: string): void {
    const a = this.players.get(key)
    if (!a) return
    if (a.isPlaying()) a.stop(false)
    a.play(1)
  }
}
