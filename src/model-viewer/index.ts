import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadModel } from './loadModel';
import { AnimationManager } from '../entity-models/customAnimation';
import { createLights } from './light';
import { InteriorCamera } from './interiorCamera';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { controlsEnabled } from '../container/chat/chat';
import * as dat from 'dat.gui';

export class ThreeJSComponent {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private currentProgress: number = 0;
  private animationManager: AnimationManager | null = null;
  private canvas: HTMLCanvasElement;
  private isAnimationPlaying: boolean = false;
  private materialGuiControls: { [key: string]: any } = {};
  private materialType: string = 'MeshPhysicalMaterial';
  private minCameraHeight: number = 2;
  private loaderElement: HTMLElement | null = null;
  private visLoaderElement: HTMLElement | null = null;
  private progressBarElement: HTMLElement | null = null;
  private progressTextElement: HTMLElement | null = null;
  private glassGuiControls: { [key: string]: any } = {};
  private glassMaterialName: string = 'MT_Glass';
  private gui: dat.GUI | undefined;
  private materialColors: { [key: string]: string } = {
    'Red': '#FF0000',
    'Green': '#00FF00',
  };

  private envMap: THREE.Texture | null = null;
  private envMapIntensity = 1.0;
  private envMapRotation = 0;
  private pmremGenerator: THREE.PMREMGenerator;
  private envMapGroup: THREE.Group;

  private keysPressed: { [key: string]: boolean } = {};

  public interiorCamera: InteriorCamera | null = null;
  public currentCamera: 'exterior' | 'interior' = 'exterior';
  public isDoorOpen: boolean = false;
  public isSunroff:boolean = false;
  public isInterior: boolean = false;

  public exteriorCameraPosition = new THREE.Vector3(0, 2, 15);
  public exteriorCameraTarget = new THREE.Vector3(0, 0, 0);

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas element with id ${canvasId} not found`);
    this.loaderElement = document.getElementById('loader-container'); // Loading screen container
    this.visLoaderElement = document.querySelector('.vis_container-loader');
    this.progressBarElement = document.getElementById('progress-bar');
    this.progressTextElement = document.getElementById('progress-text');

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });

    this.setSize();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor('#020202');

    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 2.0; 

    this.camera = new THREE.PerspectiveCamera(
      15,
      (window.innerWidth) / window.innerHeight,
      0.01,
      100
    );
    this.camera.position.set(0, 2, 15);
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
    createLights(this.scene);
    this.setupGUI();
    
    
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    this.animate();
    this.loadAssets();
  }

  private loadAssets(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loadHDRI()
        .then(() => {
          this.updateLoaderProgress(40); // HDRI loaded
          return this.addFloor();
        })
        .then(() => {
          this.updateLoaderProgress(70); // Floor loaded
          return this.loadCarModel();
        })
        .then(() => {
          this.updateLoaderProgress(100); // Car model loaded
          resolve();
        })
        .catch((error) => {
          console.error('Error loading assets:', error);
          reject(error);
        });
    });
  }

  public playAllDoorsOpening() {
    if (this.animationManager) {
        this.animationManager.setAnimationCompleteCallback(() => {
            this.isDoorOpen = true; // Set the door state when the animation completes
        });
        this.animationManager.playAnimation('All_Doors_Opening');
    }
}


public playAllDoorsClosing() {
  if (this.animationManager) {
      this.animationManager.setAnimationCompleteCallback(() => {
          this.isDoorOpen = false; // Set the door state when the animation completes
      });
      this.animationManager.playAnimation('All_doors_closing');
  }
}

  private updateLoaderProgress(percentage: number): void {
    this.currentProgress = percentage;

    if (this.visLoaderElement) {
      const progressDegree = (percentage / 100) * 360; 
      this.visLoaderElement.style.setProperty('--progress', `${progressDegree}deg`);
      this.visLoaderElement.setAttribute('data-progress', `${Math.floor(percentage)}`);

      if (this.progressTextElement) {
        this.progressTextElement.innerText = `${Math.floor(percentage)}%`;
      }
    }

    if (percentage === 100) {
      setTimeout(() => {
        this.onAssetsLoaded();
      }, 500);
    }
  }

  private onAssetsLoaded(): void {
    if (this.loaderElement) {
      this.loaderElement.style.transition = 'opacity 0.5s ease';
      this.loaderElement.style.opacity = '0'; 
      setTimeout(() => {
        this.loaderElement!.style.display = 'none'; 
      }, 500); 
    }
  }


  private setSize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  private loadHDRI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load('images/table_mountain_4k.hdr', (texture) => {
        this.envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
  
        this.scene.environment = this.envMap;
        this.scene.background = this.envMap;
  
        texture.dispose();
        this.pmremGenerator.dispose();
  
        this.updateEnvMapIntensity();
        resolve()
      });
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

  private addFloor(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const loader = new GLTFLoader();
      const floorPath = 'https://d7to0drpifvba.cloudfront.net/3d-models/f-f150v6/base2/Base.gltf';

      loader.load(floorPath, (gltf) => {
        const floor = gltf.scene;
        floor.scale.set(1.5, 1.5, 1.5);
        floor.position.set(0, -0.750, 0);
        
        floor.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const material = child.material as THREE.MeshPhysicalMaterial;
            if (material.name === 'MT_BGBase_Main') {
              material.color.set("#C4C4C4");
              material.roughness = 0;
              material.metalness = 0.8;
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

        this.scene.add(floor);
        resolve();
      }, undefined, reject);
    });
  }

  private loadCarModel(): Promise<void> {
    return new Promise((resolve, reject) => {
      loadModel(this.scene, 'https://d7to0drpifvba.cloudfront.net/3d-models/f-f150v9/Ford_f150.gltf')
        .then(({ model, animations }) => {
          this.animationManager = new AnimationManager(model);
          this.animationManager.loadAnimations(animations);
          this.playAllDoorsClosing();
          this.isDoorOpen= false;
          resolve();
        });
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
    if (this.currentCamera === 'exterior' && this.camera.position.y < 2) {
      this.camera.position.y = 2;
    }

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
    if (!controlsEnabled) return;
    this.keysPressed[event.key.toLowerCase()] = true;
  }

  private onKeyUp(event: KeyboardEvent) {
    this.keysPressed[event.key.toLowerCase()] = false;
  }

  private onWindowResize() {
    this.camera.aspect = (window.innerWidth) / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.setSize();
    this.interiorCamera?.resizeCamera();
  }

  private onAnimationComplete() {
    this.isAnimationPlaying = false;
  }

  public playSunRoofOpening() {
    if (this.animationManager) {
      this.animationManager.playAnimation('Sunroof_anim');
      this.isSunroff = true;
    }
  }

  public playSunRoofClosing() {
    if (this.animationManager) {
      this.animationManager.playAnimationReverse('Sunroof_anim');
      this.isSunroff = false;
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
      this.isInterior = true;
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
    this.isInterior = false;
    this.renderer.render(this.scene, this.camera);
  }

  public updateColor(colorCode: string) {
    this.changeCarPaintColor(colorCode);
  }

  public setDoorStatus(status: boolean) {
    this.isDoorOpen = status;
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

  public isInteriorView() {
    return this.isInterior;
  }

  public getCurrentIsDoorStatus(): boolean {
    return this.isDoorOpen;
  }


  public toggleAlloyMeshesVisibility(visibleMeshName: string): void {
    const alloyMeshNames = ["SM-Aloy-Low_01", "SM_Alloy_002", "SM_Alloy_003", "SM_Alloy_004"];
  
    this.animationManager?.model.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        // Check if the child name is in the alloy mesh names list
        if (alloyMeshNames.includes(child.name)) {
          // Set visibility to true only for the specified visibleMeshName, others will be hidden
          child.visible = (child.name === visibleMeshName);
        }
      }
    });
  }

  private setupGUI() {
    this.gui = new dat.GUI({ autoPlace: false }); // Disable automatic placement
    
    const interiorFolder = this.gui.addFolder(''); // Empty title to hide the folder name
    interiorFolder.close(); // Close it initially to hide the controls
    
    type ColorName = 'White' | 'Red' | 'Brown'; 
    const colorSettings: Record<ColorName, boolean> = {
      'White': true, // Default color selected
      'Red': false,
      'Brown': false,
    };
  
    Object.keys(colorSettings).forEach((colorName) => {
      const checkbox = interiorFolder.add(colorSettings, colorName as ColorName).name(colorName).listen();
    
      checkbox.onChange((value: boolean) => {
        const colorToApply: string = value ? 
          (colorName === 'Red' ? '#7a0009' : (colorName === 'Brown' ? '#D2B48C' : '#FFFFFF')) 
          : '#FFFFFF';
        
        this.changeMaterialsColor(colorToApply, [
          'BackDoorMat-1004',
          'FrontDoorMat-1003',
          'FrontSeatBase-1003', 
          'FrontSeatBack-1002', 
          'FrontSeatHead-1001', 
          'DashBordMate-1010', 
          'BackSeatMat-1001', 
          'BackSeatMat-1002', 
          'BackSeatMat-1003', 
          'BackSeatMat-1004', 
          'BackSeatMat-1005', 
          'BackSeatMat-1006', 
          'BackSeatMat-1007', 
          'BackSeatMat-1008'
        ]);
  
        if (value) {
          Object.keys(colorSettings).forEach((otherColor) => {
            if (otherColor !== colorName) {
              colorSettings[otherColor as ColorName] = false;
            }
          });
        }
      });
    });
  
    const guiContainer = this.gui.domElement;
    guiContainer.classList.add('gui-container');
    document.body.appendChild(guiContainer);
  
    const button = document.createElement('button');
    button.innerText = 'Interior Color';
    button.classList.add('interior-color-btn');
    document.body.appendChild(button);
  
    let isFolderVisible = false;
    button.addEventListener('click', () => {
      const buttonRect = button.getBoundingClientRect();
      guiContainer.style.position = 'absolute';
      guiContainer.style.top = `${buttonRect.top - guiContainer.offsetHeight - 10}px`; // Place the GUI just above the button
      guiContainer.style.left = `${520}px`; // Align it horizontally with the button
  
      if (isFolderVisible) {
        interiorFolder.close(); // Hide the folder (color checkboxes)
        guiContainer.style.display = 'none'; // Hide the container
      } else {
        interiorFolder.open(); // Show the folder (color checkboxes)
        guiContainer.style.display = 'block'; // Show the container
      }
      isFolderVisible = !isFolderVisible; // Toggle the state
    });
  
    const folderElement = interiorFolder.domElement.querySelector('.title') as HTMLElement; // Cast to HTMLElement
    if (folderElement) {
      folderElement.style.display = 'none'; 
    }
  
    const closeButton = this.gui.domElement.querySelector('.close-button') as HTMLElement; // Cast to HTMLElement
    if (closeButton) {
      closeButton.style.display = 'none'; // Hide the close control
    }
  }

  
  public changeMaterialsColor(colorCode: string, materialNames: string[]) {
    if (!this.animationManager) {
      console.error('AnimationManager is not initialized.');
      return;
    }

    this.animationManager.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material: THREE.Material) => {
          if (materialNames.includes(material.name)) {
            (material as THREE.MeshPhysicalMaterial).color.set(colorCode);
          }
        });
      }
    });
  }



}
