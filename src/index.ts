import { loadChat } from "./container/chat/chat";
import { render } from "./container/model/model";
import { ThreeJSComponent } from "./model-viewer";
import { globals } from "./model-viewer/globals";
import { INITIAL_PAYLOAD } from "./utils/constants";

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  
  const canvas = document.getElementById('webgl');
  if (!canvas) {
    console.error('Canvas element with id "webgl" not found');
    return;
  }

  console.log('Canvas element found. Initializing ThreeJSComponent.');
  
  globals.threeJSComponent = new ThreeJSComponent('webgl');
  console.log('ThreeJSComponent initialized:', globals.threeJSComponent);
  
  // Other initializations
  render(globals.threeJSComponent);
  loadChat(INITIAL_PAYLOAD.visualizerContainer);
});
