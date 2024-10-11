import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GUI } from 'dat.gui';

export function loadModel(
  scene: THREE.Scene, 
  modelPath: string, 
  position: THREE.Vector3 = new THREE.Vector3(0, -0.750, 0),
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
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true; 
            child.receiveShadow = true;
          }
        });
        scene.add(model);

        if (gltf.animations.length > 0) {
          gltf.animations.forEach((clip) => console.log(`Loaded animation: ${clip.name}`));
        } else {
          console.log("No animations found.");
        }

        updateChromeMaterial(model, {
          color: "#C0C0C0", 
          envMapIntensity: 1, 
          metalness: 1,
          roughness: 0.0,
          clearcoat: 2.5,
          specularIntensity: 1.5,
        });
        updateCarMaterial(model);
        toggleAlloyMeshesVisibility(model);

        // Initialize GUI controls
        initializeGUI(model);

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
  const chromedMaterialNames = ["back_chrom"];
  let sharedChromeMaterial: THREE.MeshPhysicalMaterial | null = null;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Check if the material is one we want to update
      if (chromedMaterialNames.includes(child.material.name)) {
        // Create or reuse the shared material
        if (!sharedChromeMaterial) {
          sharedChromeMaterial = new THREE.MeshPhysicalMaterial({
            name: "back_chrom",
            color: options.color || "#dadada",
            map: child.material.map,
            envMapIntensity: options.envMapIntensity || 1,
            metalness: options.metalness || 1,
            roughness: options.roughness || 0.0,
            clearcoat: options.clearcoat || 3,
            specularIntensity: options.specularIntensity || 3,
          });
        }

        // Assign the shared material to the child
        child.material = sharedChromeMaterial;
        child.material.needsUpdate = true;
      }
    }
  });
  updateCarGlassMaterial(model);
  updateAlloyChromeMaterial(model);
}

function updateAlloyChromeMaterial(
  model: THREE.Group,
  options: ChromeMaterialOptions = {}
): void {
  const chromedMaterialNames = ["chrome"];
  let sharedChromeMaterial: THREE.MeshPhysicalMaterial | null = null;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Check if the material is one we want to update
      if (chromedMaterialNames.includes(child.material.name)) {
        // Create or reuse the shared material
        if (!sharedChromeMaterial) {
          sharedChromeMaterial = new THREE.MeshPhysicalMaterial({
            name: "chrome",
            color: options.color || "#dadada",
            map: child.material.map,
            envMapIntensity: options.envMapIntensity || 1,
            metalness: options.metalness || 1,
            roughness: options.roughness || 0.0,
            clearcoat: options.clearcoat || 3,
            specularIntensity: options.specularIntensity || 3,
          });
        }

        // Assign the shared material to the child
        child.material = sharedChromeMaterial;
        child.material.needsUpdate = true;
      }
    }
  });
  updateCarGlassMaterial(model);
}

function updateCarGlassMaterial(
  model: THREE.Group,
): void {
  const chromedMaterialNames = ["GlassClear","MT_Glass", "glass_dark" ];
  let sharedChromeMaterial: THREE.MeshPhysicalMaterial | null = null;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Check if the material is one we want to update
      if (chromedMaterialNames.includes(child.material.name)) {
        // Create or reuse the shared material
        if (!sharedChromeMaterial) {
          sharedChromeMaterial = new THREE.MeshPhysicalMaterial({
            name: child.material.name,
            roughness: 0.0,
            metalness: 0.2,
            envMapIntensity: 0.2,
            reflectivity: 1,
            opacity: 1,
            ior: 1,
            sheen: 1,
          });
        }

        // Assign the shared material to the child
        child.material = sharedChromeMaterial;
        child.material.needsUpdate = true;
      }
    }
  });
}

function updateCarMaterial(
  model: THREE.Group,
): void {
  const chromedMaterialNames = ["Car_paint_Original"];
  let sharedChromeMaterial: THREE.MeshPhysicalMaterial | null = null;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Check if the material is one we want to update
      if (chromedMaterialNames.includes(child.material.name)) {
        // Create or reuse the shared material
        if (!sharedChromeMaterial) {
          sharedChromeMaterial = new THREE.MeshPhysicalMaterial({
            name: "Car_paint_Original",
            color: "#2e6bde",
            roughness: 0.0,
            metalness: 0.2,
            envMapIntensity: 0.2,
            reflectivity: 1
          });
        }

        // Assign the shared material to the child
        child.material = sharedChromeMaterial;
        child.material.needsUpdate = true;
      }
    }
  });
}

type AlloyMeshNames = "SM-Aloy-Low_01" | "SM_Alloy_002" | "SM_Alloy_003" | "SM_Alloy_004";

function toggleAlloyMeshesVisibility(model: THREE.Group): void {
  const alloyMeshNames: AlloyMeshNames[] = ["SM-Aloy-Low_01", "SM_Alloy_002", "SM_Alloy_003", "SM_Alloy_004"];
  const visibleMeshName: AlloyMeshNames = "SM-Aloy-Low_01";

  model.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
      if (alloyMeshNames.includes(child.name as AlloyMeshNames)) {
        child.visible = (child.name === visibleMeshName);
      }
    }
  });
}

// GUI initialization function
function initializeGUI(model: THREE.Group): void {
  const gui = new GUI();

  // Control for Alloy Meshes Visibility
  const alloyFolder = gui.addFolder('Alloy Visibility');
  const alloyMeshesVisibility: Record<AlloyMeshNames, boolean> = {
    "SM-Aloy-Low_01": true,
    "SM_Alloy_002": false,
    "SM_Alloy_003": false,
    "SM_Alloy_004": false
  };

  Object.keys(alloyMeshesVisibility).forEach(meshName => {
    alloyFolder.add(alloyMeshesVisibility, meshName as AlloyMeshNames).onChange((value) => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
          if (child.name === meshName) {
            child.visible = value;
          }
        }
      });
    });
  });

  alloyFolder.open();

  // Glass Material Options
  const glassMaterialOptions = {
    roughness: 0.0,
    metalness: 0.2,
    envMapIntensity: 0.2,
    opacity: 1,
  };

  const glassFolder = gui.addFolder('Glass Material');
  glassFolder.add(glassMaterialOptions, 'roughness', 0, 1).onChange((value) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && ["GlassClear", "MT_Glass", "glass_dark"].includes(child.material.name)) {
        child.material.roughness = value;
        child.material.needsUpdate = true;
      }
    });
  });

  glassFolder.add(glassMaterialOptions, 'metalness', 0, 1).onChange((value) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && ["GlassClear", "MT_Glass", "glass_dark"].includes(child.material.name)) {
        child.material.metalness = value;
        child.material.needsUpdate = true;
      }
    });
  });

  glassFolder.add(glassMaterialOptions, 'envMapIntensity', 0, 1).onChange((value) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && ["GlassClear", "MT_Glass", "glass_dark"].includes(child.material.name)) {
        child.material.envMapIntensity = value;
        child.material.needsUpdate = true;
      }
    });
  });

  glassFolder.add(glassMaterialOptions, 'opacity', 0, 1).onChange((value) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && ["GlassClear", "MT_Glass", "glass_dark"].includes(child.material.name)) {
        child.material.opacity = value;
        child.material.needsUpdate = true;
      }
    });
  });

  glassFolder.open();
}
