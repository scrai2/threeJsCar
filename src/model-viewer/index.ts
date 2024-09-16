import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadModel } from './loadModel';
import { AnimationManager } from '../entity-models/customAnimation';
import { createLights } from './light';
import { InteriorCamera } from './interiorCamera';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GUI } from 'dat.gui';

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
  private envMapRotation = 0; // Store rotation angle
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
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer); // Initialize here
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
    this.addMaterialGUI();
    this.addGlassMaterialGUI();


    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    this.loadCarModel();
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
      this.envMapGroup.rotation.set(0, this.envMapRotation, 0); // Apply rotation

      this.scene.environment = this.envMap;
      this.scene.background = this.envMap;

      texture.dispose();
      this.pmremGenerator.dispose();

      this.updateEnvMapIntensity(); // Apply initial intensity
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
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
  }

  private addMaterialGUI(): void {
    const gui = new GUI();
    const materialControls = {
      'Material Type': this.materialType,
      'Color': '#ffffff',
      'Roughness': 0.5,
      'Metalness': 0.5
    };

    gui.add(materialControls, 'Material Type', ['MeshBasicMaterial', 'MeshStandardMaterial', 'MeshPhysicalMaterial'])
      .onChange((type: string) => {
        this.materialType = type;
        this.updateMaterialType(type);
      });

    gui.addColor(materialControls, 'Color').onChange((color: string) => {
      this.updateMaterialProperties('color', color);
    });

    gui.add(materialControls, 'Roughness', 0, 1, 0.01).onChange((value: number) => {
      this.updateMaterialProperties('roughness', value);
    });

    gui.add(materialControls, 'Metalness', 0, 1, 0.01).onChange((value: number) => {
      this.updateMaterialProperties('metalness', value);
    });

    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '500px';
    gui.domElement.style.right = '10px';

    this.materialGuiControls = materialControls;
  }

  private updateMaterialType(type: string): void {
    if (!this.animationManager) return;

    this.animationManager.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material: THREE.Material) => {
          if (material.name === 'Car_paint_Original') {
            let newMaterial: THREE.Material;

            switch (type) {
              case 'MeshBasicMaterial':
                newMaterial = new THREE.MeshBasicMaterial();
                break;
              case 'MeshStandardMaterial':
                newMaterial = new THREE.MeshStandardMaterial();
                break;
              case 'MeshPhysicalMaterial':
                newMaterial = new THREE.MeshPhysicalMaterial();
                break;
              default:
                newMaterial = new THREE.MeshPhysicalMaterial();
            }

            newMaterial.name = 'Car_paint_Original';
            child.material = newMaterial;
          }
        });
      }
    });

    this.updateMaterialProperties('color', this.materialGuiControls['Color']);
    this.updateMaterialProperties('roughness', this.materialGuiControls['Roughness']);
    this.updateMaterialProperties('metalness', this.materialGuiControls['Metalness']);
  }

  private updateMaterialProperties(property: string, value: any): void {
    if (!this.animationManager) return;

    this.animationManager.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material: THREE.Material) => {
          if (material.name === 'Car_paint_Original') {
            const mat = material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
            if (property === 'color' && mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              mat.color.set(value);
            }
            if (property === 'roughness' && mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              mat.roughness = value;
            }
            if (property === 'metalness' && mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              mat.metalness = value;
            }
          }
        });
      }
    });
  }

  private addGlassMaterialGUI(): void {
    const gui = new GUI();
    const glassControls = {
      'Color': '#ffffff',
      'Transparency': 0.5,
      'Reflectivity': 0.5,
      'Refraction': 1.5
    };

    gui.addColor(glassControls, 'Color').onChange((color: string) => {
      this.updateGlassMaterialProperties('color', color);
    });

    gui.add(glassControls, 'Transparency', 0, 1, 0.01).onChange((value: number) => {
      this.updateGlassMaterialProperties('transparency', value);
    });

    gui.add(glassControls, 'Reflectivity', 0, 1, 0.01).onChange((value: number) => {
      this.updateGlassMaterialProperties('reflectivity', value);
    });

    gui.add(glassControls, 'Refraction', 1, 2, 0.01).onChange((value: number) => {
      this.updateGlassMaterialProperties('refraction', value);
    });

    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.left = '200px';

    this.glassGuiControls = glassControls;
  }

  private updateGlassMaterialProperties(property: string, value: any): void {
    if (!this.animationManager) return;

    this.animationManager.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material: THREE.Material) => {
          if (material.name === this.glassMaterialName) {
            const mat = material as THREE.MeshPhysicalMaterial; // Use MeshPhysicalMaterial for glass

            if (property === 'color') {
              mat.color.set(value);
            }
            if (property === 'transparency') {
              mat.transmission = value; // Glass-like transparency
              mat.opacity = value;
              mat.transparent = value < 1;
            }
            if (property === 'reflectivity') {
              mat.roughness = 1 - value; // Inverse of reflectivity for simplicity
            }
            if (property === 'refraction') {
              mat.ior = value; // Index of refraction
            }
          }
        });
      }
    });
  }





  private updateRendererExposure(exposure: number): void {
    this.renderer.toneMappingExposure = exposure;
    this.renderer.render(this.scene, this.camera); // Re-render the scene with updated exposure
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
    this.renderer.render(this.scene, this.camera); // Re-render the scene with updated tone mapping
  }



  private updateHDRILightingIntensity(intensity: number): void {
    if (this.envMap) {
      this.scene.environment = this.envMap; // Re-apply the environment map
      this.scene.background = this.envMap;  // Also set the background if desired

      this.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.envMap) {
            material.envMapIntensity = intensity; // Update the intensity
          }
        }
      });
    }
  }




  private addLighting() {
    const spotLight = new THREE.SpotLight(0xffffff, 12, 100, 0.344, 0.1, 1);
    spotLight.position.set(0, 10, 0);
    spotLight.castShadow = true;
    spotLight.target.position.set(0, 0, 0);
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 100;
    // this.scene.add(spotLight);
    // this.scene.add(spotLight.target);
  }

  private addFloor() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('images/floor.jpg');
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: texture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -1.8, 0);
    this.scene.add(floor);
  }

  private loadCarModel() {
    loadModel(this.scene, 'https://d7to0drpifvba.cloudfront.net/3d-models/f-150/Ford_f150.gltf')
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
    // this.renderer.setScissorTest(true);
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
    this.camera.aspect = (window.innerWidth * 0.75) / window.innerHeight;
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
