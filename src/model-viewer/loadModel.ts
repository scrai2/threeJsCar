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
  const chromedMaterialName = ["Chrome", "Grill_chrom", "Front_Grill_01", "chrome_leg", "back_chrom"];

  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.position.copy(position);
        model.rotation.copy(rotation);
        model.scale.copy(scale);
        scene.add(model);

        if (gltf.animations.length > 0) {
          gltf.animations.forEach((clip) => console.log(`Loaded animation: ${clip.name}`));
        } else {
          console.log("No animations found.");
        }

        const envMap = loadCubeTexture();
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (chromedMaterialName.includes(child.material.name)) {
              const newMaterial = new THREE.MeshPhysicalMaterial({
                name: child.material.name,
                color: child.material.color,
                map: child.material.map,
                envMap: envMap,
                envMapIntensity: 2,
                metalness: 1,
                roughness: 0.15,
                clearcoat: 1,
                specularIntensity: 1,
                aoMapIntensity: 0.96,
              });

              child.material = newMaterial;
              child.material.needsUpdate = true;
            }
          }
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

function loadCubeTexture() {
  return new THREE.CubeTextureLoader()
    .setPath("images/")
    .load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
}
