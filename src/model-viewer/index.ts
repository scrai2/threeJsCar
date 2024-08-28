// ThreeJSComponent.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadModel } from './loadModel';
import { AnimationManager } from '../entity-models/customAnimation';
import { createLights } from './light';
import * as dat from 'dat.gui';
import { InteriorCamera } from './interiorCamera';

export class ThreeJSComponent {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationManager: AnimationManager | null = null;
  private canvas: HTMLCanvasElement;
  private isAnimationPlaying: boolean = false;

  private keysPressed: { [key: string]: boolean } = {};

  public interiorCamera: InteriorCamera | null = null;
  public currentCamera: 'exterior' | 'interior' = 'exterior';

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
      (window.innerWidth * 0.75) / window.innerHeight,
      0.01,
      100
    );
    this.camera.position.set(0, 5, 15);
    this.interiorCamera = new InteriorCamera(this.canvas, this.scene);

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

    this.addLighting();
    this.addFloor();
    createLights(this.scene);



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

  private addLighting() {
    const spotLight = new THREE.SpotLight(0xffffff, 12, 100, 0.344, 0.1, 1);
    spotLight.position.set(0, 10, 0);
    spotLight.castShadow = true;
    spotLight.target.position.set(0, 0, 0);
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 100;
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
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
    loadModel(this.scene, '../models/new/Ford_F150_animated.gltf')
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
  
    this.renderer.setViewport(0, 0, window.innerWidth * 0.25, window.innerHeight);
    this.renderer.setScissor(0, 0, window.innerWidth * 0.25, window.innerHeight);
    this.renderer.setScissorTest(true);
    this.renderer.setClearColor('#020202');
    this.renderer.clear();
  
    this.renderer.setViewport(window.innerWidth * 0.25, 0, window.innerWidth * 0.75, window.innerHeight);
    this.renderer.setScissor(window.innerWidth * 0.25, 0, window.innerWidth * 0.75, window.innerHeight);
    this.renderer.setScissorTest(true);
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
    this.interiorCamera?.resizeCamera(); // Ensure interior camera resizes as well
  }

  private onAnimationComplete() {
    this.isAnimationPlaying = false;
  }

  public playAnimation(animationName: string) {
    if (this.animationManager) {
      this.animationManager.setAnimationCompleteCallback(() => {
        if (animationName === "All_Doors_Opening") {
          this.playAnimation("All_doors_closing");
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
          console.log("mat0", material)
          if (material.name === 'Car_paint_Original') {
            (material as THREE.MeshPhysicalMaterial).color.set(colorCode);
          }
        });
      }
    });
  }
  
  
}
