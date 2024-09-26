import "../../scss/main.scss";
import Icons from "../../assests/icons/icons.svg";
import { $id, $query } from "../../utils/dom";
import { globals } from '../../model-viewer/globals';


export const loadActions = (container: string) => {
  loadLightOnOffAction(container);
  loadExteriorInteriorAction(container);
  loadOpenCloseDoorAction(container);
  // loadRotateAction(container);
};


// let doorOpen = false;

export const loadOpenCloseDoorAction = (container: string) => {
  const openCloseDoorContainer = $query(".action-container");
  openCloseDoorContainer?.remove();
  $id(container)?.insertAdjacentHTML("beforeend", renderOpenCloseDoorAction());

  const doorButton = $query(".action-container-door-opened");
  if (doorButton) {
    doorButton.addEventListener("click", () => {

      if (globals.threeJSComponent) {
        if (globals.threeJSComponent.isDoorOpen) {
          globals.threeJSComponent.playAllDoorsOpening();
        } else {
          globals.threeJSComponent.playAllDoorsClosing();
        }
        globals.threeJSComponent.isDoorOpen = !globals.threeJSComponent.isDoorOpen;
      } else {
        console.error("ThreeJSComponent instance is not initialized.");
      }
    });
  }
};


export const loadRotateAction = (container: string) => {
  const rotate360 = $query(".rotate-model");
  rotate360?.remove();
  $id(container)?.insertAdjacentHTML("beforeend", renderRotate());

  const rotateButton = $query(".rotate-model-360");
  if (rotateButton) {
    rotateButton.addEventListener("click", () => {
      console.log("Rotate 360 button clicked!");
    });
  }
};

export const loadExteriorInteriorAction = (container: string) => {
  const exteriorInteriorContainer = $query(".exterior-interior-action");
  exteriorInteriorContainer?.remove();
  
  const targetContainer = $id(container);
  if (targetContainer) {
    targetContainer.insertAdjacentHTML(
      "beforeend",
      renderExteriorInteriorAction()
    );
  } else {
    console.error(`Container with id ${container} not found.`);
    return;
  }

  const exteriorButton = $query(".exterior-interior-action-container-ext");
  const interiorButton = $query(".exterior-interior-action-container-int");

  if (exteriorButton) {
    exteriorButton.addEventListener("click", () => {
      console.log("Exterior button clicked!");

      const activeButton = $query(".exterior-interior-action-container-active");
      if (activeButton) {
        activeButton.classList.remove("exterior-interior-action-container-active");
        $query(".exterior-interior-action-container-activecontent")?.classList.remove("exterior-interior-action-container-activecontent");
      }

      exteriorButton.classList.add("exterior-interior-action-container-active");
      $query(".exterior-interior-action-container-ext-content")?.classList.add("exterior-interior-action-container-ext-activecontent");

      if (globals.threeJSComponent) {
        globals.threeJSComponent.switchToExteriorCamera();
      } else {
        console.error("ThreeJSComponent instance is not initialized.");
      }
    });
  } else {
    console.error("Exterior button not found.");
  }

  if (interiorButton) {
    interiorButton.addEventListener("click", () => {
      console.log("Interior button clicked!");

      const activeButton = $query(".exterior-interior-action-container-active");
      if (activeButton) {
        activeButton.classList.remove("exterior-interior-action-container-active");
        $query(".exterior-interior-action-container-activecontent")?.classList.remove("exterior-interior-action-container-activecontent");
      }

      interiorButton.classList.add("exterior-interior-action-container-active");
      $query(".exterior-interior-action-container-int-content")?.classList.add("exterior-interior-action-container-activecontent");

      if (globals.threeJSComponent) {
        globals.threeJSComponent.switchToInteriorCamera();
      } else {
        console.error("ThreeJSComponent or interiorCamera instance is not initialized.");
      }
    });
  } else {
    console.error("Interior button not found.");
  }
};




export const loadLightOnOffAction = (container: string) => {
  const lightOnOffContainer = $query(".light-container");
  lightOnOffContainer?.remove();
  const containerElement = $id(container);
  if (containerElement) {
    containerElement.insertAdjacentHTML("beforeend", renderLightOnOffAction());

    const lightButton = $query(".light-container-lightOn");
    if (lightButton) {
      lightButton.addEventListener("click", () => {
        console.log("Light On/Off button clicked!");
      });
    }
  }
};

export const renderOpenCloseDoorAction = () => {
  return `
    <div class="action-container">
        <div class="action-container-door-opened radius-50">
            <svg class="action-container-door-opened-doorIcon">
                <use xlink:href="${Icons}#carIcon"></use>
            </svg>
        </div>
    </div>
  `;
};

export const renderRotate = () => {
  return `
    <div class="rotate-model rotate-model-active">
        <div class="rotate-model-360 radius-50">
            <div class="360-button">360</div>
        </div>
    </div>
  `;
};

export const renderExteriorInteriorAction = () => {
  return `
    <div class="exterior-interior-action">
        <div class="exterior-interior-action-container radius-200">
            <div class="exterior-interior-action-container-ext radius-200 exterior-interior-action-container-active">     
                <svg class="exterior-interior-action-container-ext-extcarIcon">
                    <use xlink:href="${Icons}#extIcon"></use>
                </svg>
            <p class="exterior-interior-action-container-ext-content exterior-interior-action-container-ext-activecontent">EXT</p>
            </div>         
            <div class="exterior-interior-action-container-int radius-200">
                <svg class="exterior-interior-action-container-int-intseatIcon">
                    <use xlink:href="${Icons}#intIcon"></use>
                </svg>          
            <p class="exterior-interior-action-container-int-content">INT</p>
            </div>            
        </div>        
    </div>
  `;
};

export const renderLightOnOffAction = () => {
  return `
    <div class="light-container">
        <div class="light-container-lightOn radius-50">
            <svg class="light-container-lightOn-bulbIcon">
                <use xlink:href="${Icons}#lightIcon"></use>
            </svg>
        </div>
    </div>
  `;
};
