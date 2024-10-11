import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadModel } from './loadModel';
import { AnimationManager } from '../entity-models/customAnimation';
import { createLights } from './light';
import { InteriorCamera } from './interiorCamera';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';


const colorCorrectionShader = {
  uniforms: {
    tDiffuse: { value: null },
    brightness: { value: 0 },
    contrast: { value: 1 },
    saturation: { value: 1 },
    temperature: { value: 0 },  // Added temperature control
    tint: { value: 0 },         // Added tint control
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float temperature;  // Added temperature uniform
    uniform float tint;         // Added tint uniform
    varying vec2 vUv;

    vec3 applySaturation(vec3 color, float saturationFactor) {
      float intensity = dot(color, vec3(0.2126, 0.7152, 0.0722));
      return mix(vec3(intensity), color, saturationFactor);
    }

    vec3 applyTemperature(vec3 color, float temp) {
      // Increase red for warmer temperature, blue for cooler
      color.r += temp;
      color.b -= temp;
      return color;
    }

    vec3 applyTint(vec3 color, float tintValue) {
      // Adjust the green-magenta balance
      color.g += tintValue;
      color.b -= tintValue;
      return color;
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);

      // Apply brightness
      texel.rgb += brightness;

      // Apply contrast
      texel.rgb = (texel.rgb - 0.5) * contrast + 0.5;

      // Apply saturation
      texel.rgb = applySaturation(texel.rgb, saturation);

      // Apply temperature
      texel.rgb = applyTemperature(texel.rgb, temperature);

      // Apply tint
      texel.rgb = applyTint(texel.rgb, tint);

      gl_FragColor = texel;
    }
  `,
};





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
  private composer: EffectComposer;

  private glassGuiControls: { [key: string]: any } = {};
  private glassMaterialName: string = 'MT_Glass';
  private minCameraHeight: number = 2;

  private envMap: THREE.Texture | null = null;
  private envMapIntensity = 1.0;
  private envMapRotation = 0;
  private pmremGenerator: THREE.PMREMGenerator;
  private envMapGroup: THREE.Group;

  private keysPressed: { [key: string]: boolean } = {};

  public interiorCamera: InteriorCamera | null = null;
  public currentCamera: 'exterior' | 'interior' = 'exterior';
  public isDoorOpen: boolean = false;
  public isInterior: boolean = false;

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

    this.renderer.toneMapping = THREE.CineonToneMapping;
    this.renderer.toneMappingExposure = 0.8; 

    this.camera = new THREE.PerspectiveCamera(
      15,
      (window.innerWidth) / window.innerHeight,
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
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const colorCorrectionPass = new ShaderPass(colorCorrectionShader);
    this.composer.addPass(colorCorrectionPass);

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
      // this.envMapIntensity = 0.65;

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
      'Env Map Intensity': 0.25,
      'Exposure': 1.5,
      'Env Map Rotation': 0,
      'Enable Env Map': true,
      'Brightness': 0.0,
      'Contrast': 1.0,
      'Saturation': 1.0,
      'Temperature': 0.0,  // New control for temperature
      'Tint': 0.0,         // New control for tint
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
  
    gui.add(envControls, 'Brightness', -1, 1, 0.01).onChange((value: number) => {
      this.updatePostProcessing(value, 'brightness');
    });
  
    gui.add(envControls, 'Contrast', 0, 2, 0.01).onChange((value: number) => {
      this.updatePostProcessing(value, 'contrast');
    });
  
    gui.add(envControls, 'Saturation', 0, 2, 0.01).onChange((value: number) => {
      this.updatePostProcessing(value, 'saturation');
    });
  
    // Add GUI control for temperature
    gui.add(envControls, 'Temperature', -1, 1, 0.01).onChange((value: number) => {
      this.updatePostProcessing(value, 'temperature');
    });
  
    // Add GUI control for tint
    gui.add(envControls, 'Tint', -1, 1, 0.01).onChange((value: number) => {
      this.updatePostProcessing(value, 'tint');
    });
  }
  
  private updatePostProcessing(value: number, type: string): void {
    const colorCorrectionPass = this.composer.passes[1] as ShaderPass;
    if (type === 'brightness') colorCorrectionPass.uniforms.brightness.value = value;
    if (type === 'contrast') colorCorrectionPass.uniforms.contrast.value = value;
    if (type === 'saturation') colorCorrectionPass.uniforms.saturation.value = value;
    if (type === 'temperature') colorCorrectionPass.uniforms.temperature.value = value;  // Update temperature
    if (type === 'tint') colorCorrectionPass.uniforms.tint.value = value;                // Update tint
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
    const floorPath = 'https://d7to0drpifvba.cloudfront.net/3d-models/f-150/base3/Base.gltf';

    loader.load(floorPath, (gltf) => {
      const floor = gltf.scene;

      floor.scale.set(1.5, 1.5, 1.5);
      floor.position.set(0, -0.5, 0);
      floor.rotation.set(0, 0, 0);

      floor.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshPhysicalMaterial;

          if (material.name === 'MT_BGBase_Main') {
            material.color.set("#C4C4C4");
            material.roughness = 0;
            material.metalness = 0.8;
            material.reflectivity = 0.9;
            // material.envMapIntensity = 
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
    }, undefined, (error) => {
      console.error('An error occurred while loading the GLTF model:', error);
    });
  }




  private loadCarModel() {
    loadModel(this.scene, 'https://d7to0drpifvba.cloudfront.net/3d-models/f-150v4/Ford_f150.gltf')
      .then(({ model, animations }) => {
        this.animationManager = new AnimationManager(model);
        this.animationManager.loadAnimations(animations);
        this.animationManager.setAnimationCompleteCallback(this.onAnimationComplete.bind(this));
        this.playAllDoorsOpening();
        this.playAllDoorsClosing(); 
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

    if (this.currentCamera === 'exterior' && this.camera.position.y < 2) {
      this.camera.position.y = 2;
    }


    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setClearColor('#020202');
    this.renderer.clear();

    if (this.currentCamera === 'interior' && this.interiorCamera) {
      this.composer.render();
    } else {
      this.controls.update();
      this.composer.render();
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
    this.camera.aspect = (window.innerWidth) / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.setSize();
    this.interiorCamera?.resizeCamera();
  }

  private onAnimationComplete() {
    this.isAnimationPlaying = false;
  }

  public playAllDoorsOpening() {
    if (this.animationManager) {
      this.animationManager.playAnimation('All_Doors_Opening');
      this.isDoorOpen = true;
    }
  }

  public playAllDoorsClosing() {
    if (this.animationManager) {
      this.animationManager.playAnimation('All_doors_closing');
      this.isDoorOpen = false;
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
        if (alloyMeshNames.includes(child.name)) {
          child.visible = (child.name === visibleMeshName);
        }
      }
    });
  }
}
