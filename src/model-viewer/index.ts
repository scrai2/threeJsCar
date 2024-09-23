import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadModel } from './loadModel';
import { AnimationManager } from '../entity-models/customAnimation';
import { createLights } from './light';
import { InteriorCamera } from './interiorCamera';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ThreeJSComponent {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationManager: AnimationManager | null = null;
  private canvas: HTMLCanvasElement;
  private isAnimationPlaying: boolean = false;
  private materialGuiControls: { [key: string]: any } = {};
  private materialType: string = 'MeshPhysicalMaterial';

  private glassGuiControls: { [key: string]: any } = {};
  private glassMaterialName: string = 'MT_Glass';

  private envMap: THREE.Texture | null = null;
  private envMapIntensity = 1.0;
  private envMapRotation = 0; 
  private pmremGenerator: THREE.PMREMGenerator;
  private envMapGroup: THREE.Group;

  private keysPressed: { [key: string]: boolean } = {};

  public interiorCamera: InteriorCamera | null = null;
  public currentCamera: 'exterior' | 'interior' = 'exterior';
  public isDoorOpen: boolean = false;

  public exteriorCameraPosition = new THREE.Vector3(0, 5, 15);
  public exteriorCameraTarget = new THREE.Vector3(0, 0, 0);

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas element with id ${canvasId} not found`);


    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });

    this.setSize();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor('#020202');

    this.camera = new THREE.PerspectiveCamera(
      25,
      (window.innerWidth ) / window.innerHeight,
      0.01,
      100
    );
    this.camera.position.set(0, 5, 15);
    this.interiorCamera = new InteriorCamera(this.canvas, this.scene);
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer); 
    this.pmremGenerator.compileEquirectangularShader();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 0;
    this.controls.maxDistance = 20;
    this.controls.screenSpacePanning = false;

    this.envMapGroup = new THREE.Group();
    this.scene.add(this.envMapGroup);
    this.loadHDRI();
    this.addGUI();
    createLights(this.scene);



    
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    this.loadCarModel();
    this.addFloor();
    this.animate();
  }

  private setSize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  private loadHDRI(): void {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('images/backtest.hdr', (texture) => {
      this.envMap = this.pmremGenerator.fromEquirectangular(texture).texture;

      this.scene.environment = this.envMap;
      this.scene.background = this.envMap;

      texture.dispose();
      this.pmremGenerator.dispose();

      this.updateEnvMapIntensity(); 
    });
  }

  private updateEnvMapIntensity(): void {
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.envMap) {
          material.envMapIntensity = this.envMapIntensity;
        }
      }
    });
  }


  private addGUI(): void {
    const gui = new GUI();
    const envControls = {
      'Env Map Intensity': 1.0,
      'Exposure': 1.0,
      'Env Map Rotation': 0,
      'Enable Env Map': true,
      'Car Paint Color': '#ffffff',
      'Tone Mapping': 'Linear',
    };

    gui.add(envControls, 'Env Map Intensity', 0, 2, 0.01).onChange((value: number) => {
      this.updateHDRILightingIntensity(value);
    });

    gui.add(envControls, 'Exposure', 0, 2, 0.01).onChange((value: number) => {
      this.updateRendererExposure(value);
    });

    gui.add(envControls, 'Env Map Rotation', 0, Math.PI * 2, 0.01).onChange((value: number) => {
      this.envMapRotation = value;
      this.envMapGroup.rotation.set(0, value, 0);
    });

    gui.add(envControls, 'Enable Env Map').onChange((enabled: boolean) => {
      this.scene.environment = enabled ? this.envMap : null;
      this.scene.background = enabled ? this.envMap : null;
    });

    gui.addColor(envControls, 'Car Paint Color').onChange((color: string) => {
      this.updateColor(color);
    });

    gui.add(envControls, 'Tone Mapping', ['Linear', 'Reinhard', 'Cineon', 'ACESFilmic']).onChange((value: string) => {
      this.updateToneMapping(value);
    });

    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '500px';
    gui.domElement.style.right = '10px';
  }

  private updateRendererExposure(exposure: number): void {
    this.renderer.toneMappingExposure = exposure;
    this.renderer.render(this.scene, this.camera); 
  }

  private updateToneMapping(toneMapping: string): void {
    switch (toneMapping) {
      case 'Linear':
        this.renderer.toneMapping = THREE.LinearToneMapping;
        break;
      case 'Reinhard':
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        break;
      case 'Cineon':
        this.renderer.toneMapping = THREE.CineonToneMapping;
        break;
      case 'ACESFilmic':
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        break;
      default:
        this.renderer.toneMapping = THREE.LinearToneMapping;
    }
    this.renderer.render(this.scene, this.camera); 
  }



  private updateHDRILightingIntensity(intensity: number): void {
    if (this.envMap) {
      this.scene.environment = this.envMap; 
      this.scene.background = this.envMap;  

      this.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.envMap) {
            material.envMapIntensity = intensity; 
          }
        }
      });
    }
  }

  private addFloor(): void {
    const loader = new GLTFLoader();
    const floorPath = 'https://d7to0drpifvba.cloudfront.net/3d-models/f-150/base/Ford_BG.gltf';
  
    loader.load(floorPath, (gltf) => {
      const floor = gltf.scene;
  
      floor.scale.set(1, 1, 1);
      floor.position.set(0, -1.500, 0);
      floor.rotation.set(0, 0, 0);
  
      floor.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshPhysicalMaterial;
  
          if (material.name === 'MT_BGBase_Main') {
            material.color.set("#C4C4C4"); 
            material.roughness = 0; 
            material.metalness = 0.8; 
            material.reflectivity = 0.9;
            material.needsUpdate = true; 
            child.receiveShadow = true;
          }
  
          if (material.name === 'MT_BGBase_Emission') {
            material.emissive.set(0x00ff00); 
            material.emissiveIntensity = 10; 
            material.needsUpdate = true; 
          }
        }
      });
  
      console.log("floor", floor);
      this.scene.add(floor);
    }, undefined, (error) => {
      console.error('An error occurred while loading the GLTF model:', error);
    });
  }
  
  
  

  private loadCarModel() {
    loadModel(this.scene, 'https://d7to0drpifvba.cloudfront.net/3d-models/f-150/Ford_F150.gltf')
      .then(({ model, animations }) => {
        this.animationManager = new AnimationManager(model);
        this.animationManager.loadAnimations(animations);
        this.animationManager.setAnimationCompleteCallback(this.onAnimationComplete.bind(this));
      })
      .catch((error) => {
        console.error('Error loading car model:', error);
      });
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = 0.10;
    this.animationManager?.update(deltaTime);

    this.handleCameraMovement(deltaTime);

    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setClearColor('#020202');
    this.renderer.clear();

    if (this.currentCamera === 'interior' && this.interiorCamera) {
      this.renderer.render(this.scene, this.interiorCamera.camera);
    } else {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }


  private handleCameraMovement(deltaTime: number) {
    const moveSpeed = 1 * deltaTime;

    if (this.keysPressed['w']) {
      this.camera.translateZ(-moveSpeed);
    }
    if (this.keysPressed['s']) {
      this.camera.translateZ(moveSpeed);
    }
    if (this.keysPressed['a']) {
      this.camera.translateX(-moveSpeed);
    }
    if (this.keysPressed['d']) {
      this.camera.translateX(moveSpeed);
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    this.keysPressed[event.key.toLowerCase()] = true;
  }

  private onKeyUp(event: KeyboardEvent) {
    this.keysPressed[event.key.toLowerCase()] = false;
  }

  private onWindowResize() {
    this.camera.aspect = (window.innerWidth ) / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.setSize();
    this.interiorCamera?.resizeCamera();
  }

  private onAnimationComplete() {
    this.isAnimationPlaying = false;
  }

  public playAnimation(animationName: string) {
    if (this.animationManager) {
      this.animationManager.setAnimationCompleteCallback(() => {
        if (animationName === 'All_Doors_Opening') {
          this.isDoorOpen = true;
          this.playAnimation('All_doors_closing');
        } else if (animationName === 'All_doors_closing') {
          this.isDoorOpen = false;
        }
      });
      this.animationManager.playAnimation(animationName);
    }
  }

  public setCameraPosition(position: THREE.Vector3, target: THREE.Vector3) {
    if (this.currentCamera === 'interior' && this.interiorCamera) {
      this.interiorCamera.setCameraPosition(position, target);
    } else {
      this.camera.position.copy(position);
      this.camera.lookAt(target);
      if (this.controls) {
        this.controls.target.copy(target);
        this.controls.update();
      }
    }
  }

  public switchToInteriorCamera() {
    this.currentCamera = 'interior';
    if (this.interiorCamera) {
      this.interiorCamera.resetCamera();
      this.controls.enabled = false;
      this.renderer.render(this.scene, this.interiorCamera.camera);
    }
  }

  public switchToExteriorCamera() {
    this.currentCamera = 'exterior';
    if (this.controls) {
      this.controls.enabled = true;
    }
    this.renderer.render(this.scene, this.camera);
  }

  public updateColor(colorCode: string) {
    console.log("this and that")
    this.changeCarPaintColor(colorCode);
  }

  public changeCarPaintColor(colorCode: string) {
    if (!this.animationManager) {
      console.error('AnimationManager is not initialized.');
      return;
    }
    this.animationManager.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material: THREE.Material) => {
          if (material.name === 'Car_paint_Original') {
            (material as THREE.MeshPhysicalMaterial).color.set(colorCode);
          }
        });
      }
    });
  }

  public getCurrentCarColor(): string | null {
    let currentColor: string | null = null;

    this.animationManager?.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material: THREE.Material) => {
          if (material.name === 'Car_paint_Original') {
            currentColor = (material as THREE.MeshPhysicalMaterial).color.getHexString();
          }
        });
      }
    });

    return currentColor;
  }

  public getCurrentIsDoorStatus(): boolean {
    return this.isDoorOpen;
  }
}
