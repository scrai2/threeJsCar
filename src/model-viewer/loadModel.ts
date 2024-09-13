import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function loadModel(
  scene: THREE.Scene, 
  modelPath: string, 
  position: THREE.Vector3 = new THREE.Vector3(0, -1.75, 0),
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
  rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
): Promise<{ model: THREE.Group; animations: THREE.AnimationClip[] }> {
  
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        centerAndScale(model, position, rotation, scale);
        scene.add(model);

        if (gltf.animations.length > 0) {
          gltf.animations.forEach((clip) => console.log(`Loaded animation: ${clip.name}`));
        } else {
          console.log("No animations found.");
        }

        updateChromeMaterial(model, {
          color: "#C0C0C0", 
          envMapIntensity: 2.5, 
          metalness: 1,
          roughness: 0.1,
          clearcoat: 2.5,
          specularIntensity: 1.5,
        });

        resolve({ model, animations: gltf.animations });
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

function centerAndScale(
  model: THREE.Group,
  position: THREE.Vector3,
  rotation: THREE.Euler,
  scale: THREE.Vector3
): void {
  model.position.copy(position);
  model.rotation.copy(rotation);
  model.scale.copy(scale);
}

interface ChromeMaterialOptions {
  color?: string;
  envMapIntensity?: number;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  specularIntensity?: number;
}

function updateChromeMaterial(
  model: THREE.Group,
  options: ChromeMaterialOptions = {}
): void {
  const chromedMaterialNames = ["Chrome", "Grill_chrom", "Front_Grill_01", "chrome_leg", "back_chrom"];
  const envMap = loadCubeTexture();

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (chromedMaterialNames.includes(child.material.name)) {
        const newMaterial = new THREE.MeshPhysicalMaterial({
          name: child.material.name,
          color: options.color || "#F5F5F8",
          map: child.material.map,
          envMap: envMap,
          envMapIntensity: options.envMapIntensity || 2,
          metalness: options.metalness || 1,
          roughness: options.roughness || 0.15,
          clearcoat: options.clearcoat || 3,
          specularIntensity: options.specularIntensity || 3,
        });

        child.material = newMaterial;
        child.material.needsUpdate = true;
      }
    }
  });
}

function loadCubeTexture(): THREE.CubeTexture {
  return new THREE.CubeTextureLoader()
    .setPath("images/")
    .load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
}
