import { loadChat } from "./container/chat/chat";
import { render } from "./container/model/model";
import { ThreeJSComponent } from "./model-viewer";
import { globals } from "./model-viewer/globals";
import { INITIAL_PAYLOAD } from "./utils/constants";

export function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
}

export function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

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

  if (globals.threeJSComponent) {
    // Call initializeScene to load HDRI and car model with progress tracking
    globals.threeJSComponent.initializeScene(updateLoaderProgress, hideLoader);
  }

  // Other initializations
  render(globals.threeJSComponent);
  loadChat(INITIAL_PAYLOAD.visualizerContainer);
});

// Function to update the loader progress
function updateLoaderProgress(percentage: number) {
  const progressBar = document.getElementById('progress-bar') as HTMLElement;
  const progressText = document.getElementById('progress-text') as HTMLElement;
  
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}%`;
}

// Function to hide the loader when loading is complete

