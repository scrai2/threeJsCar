// CameraRegistry.ts
import * as THREE from "three";
export class CameraRegistry {
    private static cameras: { [id: string]: THREE.PerspectiveCamera } = {};
  
    public static register(id: string, camera: THREE.PerspectiveCamera) {
      if (!id || !camera) {
        throw new Error('Invalid ID or camera');
      }
      CameraRegistry.cameras[id] = camera;
    }
  
    public static getCameraById(id: string): THREE.PerspectiveCamera | undefined {
      return CameraRegistry.cameras[id];
    }
  }
  
  export function $cameraQuery(id: string): THREE.PerspectiveCamera | undefined {
    const cameraId = id.startsWith('#') ? id.slice(1) : id;
    return CameraRegistry.getCameraById(cameraId);
  }
  