import { INITIAL_PAYLOAD } from "../../utils/constants";
import { loadActions } from "../actions/actions";
import { loadCategories } from "../category/category";

export const render = (component: any) => {
  loadCategories(INITIAL_PAYLOAD.visualizerContainer, component);
  loadActions(INITIAL_PAYLOAD.visualizerContainer);
};








// private setupGUI() {
//   const gui = new dat.GUI();

//   // Create an object to hold the camera parameters
//   const cameraFolder = gui.addFolder('Camera');
  
//   // Parameters object to hold the camera position and target
//   const cameraParams = {
//     positionX: this.camera.position.x,
//     positionY: this.camera.position.y,
//     positionZ: this.camera.position.z,
//     targetX: this.controls.target.x,
//     targetY: this.controls.target.y,
//     targetZ: this.controls.target.z
//   };

//   // Add controls for the camera position
//   cameraFolder.add(cameraParams, 'positionX', -100, 100).onChange((value) => {
//     this.camera.position.x = value;
//     this.camera.updateProjectionMatrix();
//   });
//   cameraFolder.add(cameraParams, 'positionY', -100, 100).onChange((value) => {
//     this.camera.position.y = value;
//     this.camera.updateProjectionMatrix();
//   });
//   cameraFolder.add(cameraParams, 'positionZ', -100, 100).onChange((value) => {
//     this.camera.position.z = value;
//     this.camera.updateProjectionMatrix();
//   });

//   // Add controls for the camera target
//   cameraFolder.add(cameraParams, 'targetX', -100, 100).onChange((value) => {
//     this.controls.target.x = value;
//     this.controls.update();
//   });
//   cameraFolder.add(cameraParams, 'targetY', -100, 100).onChange((value) => {
//     this.controls.target.y = value;
//     this.controls.update();
//   });
//   cameraFolder.add(cameraParams, 'targetZ', -100, 100).onChange((value) => {
//     this.controls.target.z = value;
//     this.controls.update();
//   });

//   cameraFolder.open();
// }