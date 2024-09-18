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
  private rotationSpeed: number = 0.05;
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

    this.position = new THREE.Vector3(-0.2, -0.29, 0);
    this.target = new THREE.Vector3(-5, -0.3, 0);

    this.camera.position.copy(this.position);
    this.currentTarget = this.target.clone();
    this.desiredTarget = this.target.clone();

    this.updateCamera();

    this.gui = new dat.GUI();
    this.addGUIControls();

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
  
    // Calculate mouse movement deltas
    const deltaX = event.clientX - this.prevMousePosition.x;
    const deltaY = event.clientY - this.prevMousePosition.y;
  
    this.prevMousePosition = { x: event.clientX, y: event.clientY };
  
    const rotationSpeed = this.rotationSpeed;
  
    // Get the current direction vector from the camera to the target
    const direction = new THREE.Vector3().subVectors(this.desiredTarget, this.position).normalize();
  
    // Prioritize the axis with the largest movement (either vertical or horizontal)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical Rotation (X-axis) - Only rotate vertically if deltaY is greater than deltaX
  
      // Calculate the new vertical angle (pitch)
      let newY = direction.y - deltaY * rotationSpeed;
  
      // Clamp vertical rotation between y = -1 (looking fully down) and y = 1 (looking fully up)
      newY = THREE.MathUtils.clamp(newY, -1, 1);
  
      // Update the direction's Y component after clamping the vertical rotation
      direction.y = newY;
      
    } else {
      // Horizontal Rotation (Y-axis) - Only rotate horizontally if deltaX is greater than deltaY
  
      // Calculate the horizontal angle (yaw)
      let horizontalAngle = Math.atan2(direction.x, direction.z);
      horizontalAngle -= deltaX * rotationSpeed; // Rotate based on horizontal mouse movement
  
      // Update direction vector after horizontal rotation
      direction.x = Math.sin(horizontalAngle);
      direction.z = Math.cos(horizontalAngle);
    }
  
    // Normalize the direction vector to maintain unit length
    direction.normalize();
  
    // Set the desired target position based on the updated direction
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

  private addGUIControls() {
    const cameraFolder = this.gui.addFolder('Camera Properties');

    cameraFolder.add(this.camera, 'fov', 1, 150, 1).onChange(() => {
      this.camera.updateProjectionMatrix(); // Update projection after changing FOV
    });

    cameraFolder.add(this.camera, 'near', 0.01, 10, 0.01).onChange(() => {
      this.camera.updateProjectionMatrix(); // Update projection after changing near plane
    });

    cameraFolder.add(this.camera, 'far', 10, 1000, 1).onChange(() => {
      this.camera.updateProjectionMatrix(); // Update projection after changing far plane
    });

    cameraFolder.add(this.camera, 'aspect', 0.1, 3, 0.01).onChange(() => {
      this.camera.updateProjectionMatrix(); // Update projection after changing aspect ratio
    });


    cameraFolder.open();
  }
}
