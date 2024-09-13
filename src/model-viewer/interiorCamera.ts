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
  private rotationSpeed: number = 0.005;
  private dampingFactor: number = 0.1;
  private currentTarget: THREE.Vector3;
  private desiredTarget: THREE.Vector3;

  constructor(canvas: HTMLCanvasElement, scene: THREE.Scene) {
    this.canvas = canvas;
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(
      95,
      (window.innerWidth * 0.75) / window.innerHeight,
      0.01,
      100
    );

    this.position = new THREE.Vector3(-0.1, -0.29, 0);
    this.target = new THREE.Vector3(-5, -0.3, 0);

    this.camera.position.copy(this.position);
    this.currentTarget = this.target.clone();
    this.desiredTarget = this.target.clone();

    this.updateCamera();

    this.gui = new dat.GUI();

    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    window.addEventListener('resize', this.resizeCamera.bind(this));

    this.animate();
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
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.prevMousePosition.x;
    const deltaY = event.clientY - this.prevMousePosition.y;

    this.prevMousePosition = { x: event.clientX, y: event.clientY };

    const rotationSpeed = this.rotationSpeed;

    const rotationQuat = new THREE.Quaternion();
    rotationQuat.setFromEuler(new THREE.Euler(
      deltaY * rotationSpeed,
      deltaX * rotationSpeed,
      0,
      'XYZ'
    ));

    const direction = new THREE.Vector3().subVectors(this.desiredTarget, this.position).normalize();
    direction.applyQuaternion(rotationQuat);

    this.desiredTarget.copy(this.position.clone().add(direction));
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  public animate() {
    requestAnimationFrame(() => this.animate());
    this.updateCamera();
  }

  public resetCamera() {
    this.setCameraPosition(this.position, this.target);
  }
}
