import * as THREE from "three";
import * as dat from 'dat.gui';
// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
// import { CSM } from 'https://cdn.jsdelivr.net/npm/three-csm@3.1.0/build/CSM.js';


function createLights(scene: THREE.Scene): { directionalLight: THREE.DirectionalLight } {

  const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
  directionalLight.position.set(10, 10, 10); // Position the light above the scene
  directionalLight.castShadow = true; // Enable shadows
  directionalLight.shadow.mapSize.width = 2048; // Set shadow quality
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  // directionalLight.shadow.bias = 0.0001;

  scene.add(directionalLight);

  const gui = new dat.GUI({ autoPlace: false }); // autoPlace false to manually position GUI
  
  const guiContainer = document.createElement('div');
  guiContainer.style.position = 'absolute';
  guiContainer.style.left = '300px'; // Position on the left
  guiContainer.style.top = '10px';
  document.body.appendChild(guiContainer);
  gui.domElement.style.position = 'relative'; 
  guiContainer.appendChild(gui.domElement);

  const directionalLightFolder = gui.addFolder('Directional Light');
  directionalLightFolder.add(directionalLight, 'intensity', 0, 10).name('Intensity');
  directionalLightFolder.add(directionalLight.position, 'x', -100, 100).name('Position X');
  directionalLightFolder.add(directionalLight.position, 'y', -100, 100).name('Position Y');
  directionalLightFolder.add(directionalLight.position, 'z', -100, 100).name('Position Z');


  const shadowFolder = gui.addFolder('Shadows');
  shadowFolder.add(directionalLight.shadow.mapSize, 'width', 512, 4096).name('Shadow Map Width');
  shadowFolder.add(directionalLight.shadow.mapSize, 'height', 512, 4096).name('Shadow Map Height');
  // shadowFolder.add(directionalLight.shadow.camera, 'near', 0.1, 100).name('Shadow Camera Near');
  // shadowFolder.add(directionalLight.shadow.camera, 'far', 10, 500).name('Shadow Camera Far');
 

  return { directionalLight };
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
