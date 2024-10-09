import * as THREE from 'three';
import * as dat from 'dat.gui';

export class InteriorCamera {
  public camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  public position: THREE.Vector3;
  public target: THREE.Vector3;
  private isDragging: boolean = false;
  private prevMousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private gui: dat.GUI;
  private rotationSpeed: number = 0.0025;
  private dampingFactor: number = 0.1;
  private currentTarget: THREE.Vector3;
  private desiredTarget: THREE.Vector3;
  private maxVerticalAngle: number = Math.PI / 4;

  constructor(canvas: HTMLCanvasElement, scene: THREE.Scene) {
    this.canvas = canvas;
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(75, 1.8, 0.01, 100);
    this.position = new THREE.Vector3(-0.2, 0.8, 0);
    this.target = new THREE.Vector3(-5, -0.3, 0);

    this.camera.position.copy(this.position);
    this.currentTarget = this.target.clone();
    this.desiredTarget = this.target.clone();

    this.updateCamera();

    this.gui = new dat.GUI();
    this.addGUIControls();

    // Event listeners for pointer lock
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));

    window.addEventListener('resize', this.resizeCamera.bind(this));

    this.animate();
  }

  private requestPointerLock() {
    // Request pointer lock on mouse down
    if (this.canvas.requestPointerLock) {
      this.canvas.requestPointerLock();
    }
  }

  private exitPointerLock() {
    // Exit pointer lock on mouse up
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  private onPointerLockChange() {
    // Update dragging state when pointer lock changes
    if (document.pointerLockElement === this.canvas) {
      console.log('Pointer locked');
      this.isDragging = true;
    } else {
      console.log('Pointer unlocked');
      this.isDragging = false;
    }
  }

  public resizeCamera() {
    this.camera.aspect = (window.innerWidth * 0.75) / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  public setCameraPosition(position: THREE.Vector3, target: THREE.Vector3) {
    this.position.copy(position);
    this.target.copy(target);
    this.camera.position.copy(this.position);
    this.currentTarget.copy(this.target);
    this.desiredTarget.copy(this.target);
    this.updateCamera();
  }

  public updateControls() {
    this.camera.position.copy(this.position);
    this.updateCamera();
  }

  private updateCamera() {
    this.currentTarget.lerp(this.desiredTarget, this.dampingFactor);
    this.camera.lookAt(this.currentTarget);
  }

  private onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.prevMousePosition = { x: event.clientX, y: event.clientY };
    this.requestPointerLock(); // Request pointer lock when mouse is pressed
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.movementX || event.clientX - this.prevMousePosition.x;
    const deltaY = event.movementY || event.clientY - this.prevMousePosition.y;

    this.prevMousePosition = { x: event.clientX, y: event.clientY };

    const rotationSpeed = this.rotationSpeed;

    const direction = new THREE.Vector3().subVectors(this.desiredTarget, this.position).normalize();

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical movement (up/down) - Simulate human head movement (limited range)
      const newY = direction.y - deltaY * rotationSpeed;
      const clampedY = THREE.MathUtils.clamp(newY, -this.maxVerticalAngle, this.maxVerticalAngle);
      direction.y = clampedY;
    } else {
      // Horizontal movement (left/right) - Full 360 degrees
      let horizontalAngle = Math.atan2(direction.x, direction.z);
      horizontalAngle -= deltaX * rotationSpeed;

      direction.x = Math.sin(horizontalAngle);
      direction.z = Math.cos(horizontalAngle);
    }

    direction.normalize();
    this.desiredTarget.copy(this.position.clone().add(direction));
  }

  private onMouseUp() {
    this.isDragging = false;
    this.exitPointerLock(); // Release pointer lock when mouse is released
  }

  public animate() {
    requestAnimationFrame(() => this.animate());
    this.updateCamera();
  }

  public resetCamera() {
    this.setCameraPosition(this.position, this.target);
  }

  private addGUIControls() {
    const cameraFolder = this.gui.addFolder('Camera Properties');

    cameraFolder.add(this.camera, 'fov', 1, 150, 1).onChange(() => {
      this.camera.updateProjectionMatrix();
    });

    cameraFolder.add(this.camera, 'near', 0.01, 10, 0.01).onChange(() => {
      this.camera.updateProjectionMatrix();
    });

    cameraFolder.add(this.camera, 'far', 10, 1000, 1).onChange(() => {
      this.camera.updateProjectionMatrix();
    });

    cameraFolder.add(this.camera, 'aspect', 0.1, 3, 0.01).onChange(() => {
      this.camera.updateProjectionMatrix();
    });

    cameraFolder.open();
  }
}
