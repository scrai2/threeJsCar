import * as THREE from 'three';

export class AnimationManager {
  private mixer: THREE.AnimationMixer | null = null;
  private animations: THREE.AnimationClip[] = [];
  private currentAction: THREE.AnimationAction | null = null;
  public onAnimationComplete: (() => void) | null = null;

  constructor(public model: THREE.Group) {
    this.mixer = new THREE.AnimationMixer(this.model);
  }

  public loadAnimations(animations: THREE.AnimationClip[]) {
    this.animations = animations;
  }

  public playAnimation(animationName: string, timeScale: number = 0.5) {
    if (!this.mixer) {
      console.error("Animation mixer is not initialized.");
      return;
    }

    const clip = this.animations.find((anim) => anim.name === animationName);
    if (clip) {
      const action = this.mixer.clipAction(clip);
      if (this.currentAction) {
        this.currentAction.stop();
      }
      this.currentAction = action;
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.setEffectiveTimeScale(timeScale)
      action.play();
    } else {
      console.warn(`Animation ${animationName} not found.`);
    }
  }

  public update(deltaTime: number) {
    if (!this.mixer) return;
  
    this.mixer.update(deltaTime);
  
    if (this.currentAction) {

  
      if (this.currentAction.isRunning() && this.currentAction.time >= this.currentAction.getClip().duration) {
        console.log('Animation complete');
        if (this.onAnimationComplete) {
          this.onAnimationComplete();
        }
        this.currentAction.stop(); 
        this.currentAction = null; 
      }
    }
  }
  
  public setAnimationCompleteCallback(callback: () => void) {
    this.onAnimationComplete = callback;
  }
}
