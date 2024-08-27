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
  private quaternion: THREE.Quaternion = new THREE.Quaternion();
  private rotationSpeed: number = 0.005;

  constructor(canvas: HTMLCanvasElement, scene: THREE.Scene) {
    this.canvas = canvas;
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(
      100,
      (window.innerWidth * 0.75) / window.innerHeight,
      0.01,
      100
    );

    this.position = new THREE.Vector3(-0.3, -0.2, 0);
    this.target = new THREE.Vector3(1, -1, 0);

    this.camera.position.copy(this.position);
    this.updateCamera();

    // Initialize dat.GUI
    this.gui = new dat.GUI();
    // this.gui.add(this, 'rotationSpeed', 0.001, 0.01);

    // Event listeners for mouse drag
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    window.addEventListener('resize', this.resizeCamera.bind(this));
  }

  public resizeCamera() {
    this.camera.aspect = (window.innerWidth * 0.75) / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  public setCameraPosition(position: THREE.Vector3, target: THREE.Vector3) {
    this.position.copy(position);
    this.target.copy(target);
    this.camera.position.copy(this.position);
    this.updateCamera();
  }

  public updateControls() {
    this.camera.position.copy(this.position);
    this.updateCamera();
  }

  private updateCamera() {
    this.camera.lookAt(this.target);
  }

  private onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.prevMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.prevMousePosition.x;
    const deltaY = event.clientY - this.prevMousePosition.y;

    this.prevMousePosition = { x: event.clientX, y: event.clientY };

    const rotationSpeed = this.rotationSpeed;

    // Create a quaternion to handle rotation
    const rotationQuat = new THREE.Quaternion();
    rotationQuat.setFromEuler(new THREE.Euler(
      deltaY * rotationSpeed,
      deltaX * rotationSpeed,
      0,
      'XYZ'
    ));

    // Apply rotation to the target vector
    const direction = new THREE.Vector3().subVectors(this.target, this.position).normalize();
    direction.applyQuaternion(rotationQuat);

    // Update the target position
    this.target.copy(this.position.clone().add(direction));

    this.updateCamera();
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  public animate() {
    // No auto-rotation since it is handled by mouse drag now
  }
}
