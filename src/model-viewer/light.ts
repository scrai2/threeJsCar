import * as THREE from "three";
import * as dat from 'dat.gui';

function createLights(scene: THREE.Scene): { ambientLight: THREE.AmbientLight; directionalLight: THREE.DirectionalLight; gui: dat.GUI } {
  const lightGroup = new THREE.Group();
  
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  lightGroup.add(ambientLight);

  // Directional Light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(24.2, 42, 5.8);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.mapSize.width = 2048; // Shadow resolution
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5; // Start distance of shadow
directionalLight.shadow.camera.far = 50;   // End distance of shadow
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

  const lightTarget = new THREE.Object3D();
  lightTarget.position.set(6, -0.5, -17);
  scene.add(lightTarget);

  directionalLight.target = lightTarget;

  lightGroup.add(directionalLight);

  scene.add(lightGroup);

  // Create GUI
  const gui = new dat.GUI();

  // GUI Controls for Ambient Light
  const ambientLightFolder = gui.addFolder('Ambient Light');
  ambientLightFolder.add(ambientLight, 'intensity', 0, 10).name('Intensity');
  
  // GUI Controls for Directional Light
  const directionalLightFolder = gui.addFolder('Directional Light');
  directionalLightFolder.add(directionalLight, 'intensity', 0, 10).name('Intensity');
  directionalLightFolder.add(directionalLight.position, 'x', -100, 100).name('Position X');
  directionalLightFolder.add(directionalLight.position, 'y', -100, 100).name('Position Y');
  directionalLightFolder.add(directionalLight.position, 'z', -100, 100).name('Position Z');
  directionalLightFolder.add(lightTarget.position, 'x', -100, 100).name('Target X');
  directionalLightFolder.add(lightTarget.position, 'y', -100, 100).name('Target Y');
  directionalLightFolder.add(lightTarget.position, 'z', -100, 100).name('Target Z');

  return { ambientLight, directionalLight, gui };
}

export { createLights };



declare module 'dat.gui' {
  export class gui {
    constructor();
    add(obj: any, prop: string, min?: number, max?: number): any;
    addColor(obj: any, prop: string): any;
    addFolder(name: string): GUI;
    open(): void;
    close(): void;
  }
}