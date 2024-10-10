import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

export function addFloor(scene: THREE.Scene): any {
    const loader = new GLTFLoader();
    const floorPath = 'https://d7to0drpifvba.cloudfront.net/3d-models/f-150/base3/Base.gltf';
    
    // Load the HDR environment map
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('images/kloofendal_4k.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        // Set the scene's environment
        scene.environment = texture;

        loader.load(floorPath, (gltf) => {
            const floor = gltf.scene;

            floor.scale.set(1.5, 1.5, 1.5);
            floor.position.set(0, -0.5, 0);
            floor.rotation.set(0, 0, 0);

            floor.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    const material = child.material as THREE.MeshPhysicalMaterial;

                    if (material.name === 'MT_BGBase_Main') {
                        material.color.set("#C4C4C4");
                        material.roughness = 0;
                        material.metalness = 0.8;
                        material.reflectivity = 0.9;
                        material.needsUpdate = true;
                        child.receiveShadow = true;
                    }

                    if (material.name === 'MT_BGBase_Emission') {
                        material.emissive.set(0x00ff00);
                        material.emissiveIntensity = 10;
                        material.needsUpdate = true;
                    }

                    // Set the environment map for the material
                    material.envMap = texture;
                }
            });

            scene.add(floor);
        }, undefined, (error) => {
            console.error('An error occurred while loading the GLTF model:', error);
        });
    }, undefined, (error) => {
        console.error('An error occurred while loading the HDR environment map:', error);
    });
}
