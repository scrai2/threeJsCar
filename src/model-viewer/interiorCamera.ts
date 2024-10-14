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
  private rotationSpeed: number = 0.0025; // Reduced rotation speed for smoother movement
  private dampingFactor: number = 0.1;
  private currentTarget: THREE.Vector3;
  private desiredTarget: THREE.Vector3;
  private maxVerticalAngle: number = Math.PI / 4; // Limit vertical angle (up/down movement)
  
  constructor(canvas: HTMLCanvasElement, scene: THREE.Scene) {
    this.canvas = canvas;
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(75, 1.8, 0.01, 100);
    this.position = new THREE.Vector3(-0.1, 0.8, 0);

    this.target = new THREE.Vector3(-0.6223, 0.617, 0.8330);

    this.camera.position.copy(this.position);
    this.currentTarget = this.target.clone();
    this.desiredTarget = this.target.clone();

    this.updateCamera();

    this.gui = new dat.GUI();
    // this.addGUIControls();

    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    // Change to document for mouse move
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mouseleave', this.onMouseUp.bind(this));

    window.addEventListener('resize', this.resizeCamera.bind(this));

    this.animate();
  }

  public resizeCamera() {
    this.camera.aspect = (window.innerWidth ) / window.innerHeight;
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
    this.canvas.style.cursor = 'none'; 
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.prevMousePosition.x;
    const deltaY = event.clientY - this.prevMousePosition.y;

    this.prevMousePosition = { x: event.clientX, y: event.clientY };

    const rotationSpeed = this.rotationSpeed;

    const direction = new THREE.Vector3().subVectors(this.desiredTarget, this.position).normalize();

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      const newY = direction.y - deltaY * rotationSpeed;
      const clampedY = THREE.MathUtils.clamp(newY, -this.maxVerticalAngle, this.maxVerticalAngle);
      direction.y = clampedY;
    } else {
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
    this.canvas.style.cursor = 'default'; // Restore the cursor when not dragging
  }

  public animate() {
    requestAnimationFrame(() => this.animate());
    this.updateCamera();
  }

  public resetCamera() {
    this.setCameraPosition(this.position, this.target);
  }


}
