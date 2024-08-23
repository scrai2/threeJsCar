import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadModel } from './loadModel';
import { AnimationManager } from '../entity-models/customAnimation';
import { createLights } from './light';
import * as dat from 'dat.gui';

export class ThreeJSComponent {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private camera2: THREE.PerspectiveCamera; // Second camera
  private activeCamera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private controls2: OrbitControls; 
  private animationManager: AnimationManager | null = null;
  private canvas: HTMLCanvasElement;
  private isAnimationPlaying: boolean = false;
  private moveSpeed: number = 0.1;  // Speed of camera movement

  public interiorCameraPosition = new THREE.Vector3(5, 2, 5);
  public interiorCameraTarget = new THREE.Vector3(0, 0, 0);

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
    this.camera2 = new THREE.PerspectiveCamera(
      25,
      (window.innerWidth * 0.75) / window.innerHeight,
      0.01,
      100
    );

    this.activeCamera = this.camera;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls2 = new OrbitControls(this.camera2, this.renderer.domElement); 
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 20;
    this.controls.screenSpacePanning = false;

    this.addLighting();
    this.addFloor();
    createLights(this.scene)

    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this)); // Add keydown event listener

    this.loadCarModel();
    this.animate();
  }

  private setSize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  private addLighting() {
    const spotLight = new THREE.SpotLight(0xffffff, 3, 100, 0.344, 0.1, 1);
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
  private positionSecondCamera(boundary: THREE.Box3) {
    const center = new THREE.Vector3();
    boundary.getCenter(center);
    this.camera2.position.copy(center);
    this.camera2.position.z += boundary.getSize(new THREE.Vector3()).length() / 2; // Offset to view the model
    this.controls2.target.copy(center); // Ensure the second camera looks at the center of the model
  }

  private loadCarModel() {
    loadModel(this.scene, '../models/Ford_f150_baked.gltf')
      .then(({ model, animations }) => {
        this.animationManager = new AnimationManager(model);
        this.animationManager.loadAnimations(animations);
        this.animationManager.setAnimationCompleteCallback(this.onAnimationComplete.bind(this));

        // Get the bounding box of the model and position the second camera
        const boundary = new THREE.Box3().setFromObject(model);
        this.positionSecondCamera(boundary);
      })
      .catch((error) => {
        console.error('Error loading car model:', error);
      });
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = 0.10;
    this.animationManager?.update(deltaTime);

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
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.scene, this.activeCamera); 

    this.controls.update();
    this.controls2.update()
  }

  public switchCamera() {
    this.activeCamera = this.activeCamera === this.camera ? this.camera2 : this.camera;
  }

  private onWindowResize() {
    this.camera.aspect = (window.innerWidth * 0.75) / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.setSize();
  }

  private onAnimationComplete() {
    this.isAnimationPlaying = false;
  }

  // Method to handle keydown events
  private onKeyDown(event: KeyboardEvent) {
    const direction = new THREE.Vector3();
  
    switch (event.key) {
      case 'w':
        this.activeCamera.getWorldDirection(direction);
        this.activeCamera.position.add(direction.multiplyScalar(this.moveSpeed));
        break;
      case 's':
        this.activeCamera.getWorldDirection(direction);
        this.activeCamera.position.add(direction.multiplyScalar(-this.moveSpeed));
        break;
      case 'a':
        this.activeCamera.position.x -= this.moveSpeed;
        break;
      case 'd':
        this.activeCamera.position.x += this.moveSpeed;
        break;
      case 'c': // Press 'c' to switch cameras
        this.switchCamera();
        break;
    }
    
    this.controls.update();
    this.controls2.update(); // Update controls for the second camera
    this.logCameraPositionAndOrientation();
  }

  // Method to log the camera's position and orientation
private logCameraPositionAndOrientation() {
  console.log('Camera Position:', this.camera.position);
  console.log('Camera Direction:', this.camera.getWorldDirection(new THREE.Vector3()));
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
    this.camera.position.copy(position);
    this.camera.lookAt(target);
    this.controls.target.copy(target);
    this.controls.update();
  }
}
