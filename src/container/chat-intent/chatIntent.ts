import { ThreeJSComponent } from "../../model-viewer";
import { ChatService } from "../../services/chat";
import pubsub from "../../shared/pubsub";
import { INTENTS, PUBSUB_CONSTANTS } from "../../utils/constants";
import { $query, clearChatInputField } from "../../utils/dom";
import { renderQuery } from "../chat/chat";
import { v4 } from "uuid";
import { globals } from '../../model-viewer/globals';

type ColorMapping = {
  readonly blue: "#003478";
  readonly lightingBlue: "#23438A";
  readonly black: "#000000";
  readonly red: "#5F0B0B";
};
export const attachChatIntentEvents = async (
  query: string,
  intentResponse: IGetActionIntent
) => {
  const { intent, value } = intentResponse;
  switch (intent) {
    case INTENTS.CAR_INFO_QUERY:
      await handleCarInfoQueryIntent(query, intentResponse);
      break;
    case INTENTS.CHANGE_CAR_COLOR:
      handleChangeCarColorIntent(query, intentResponse);
      break;
    case INTENTS.CHANGE_VIEW:
      handleChangeViewIntent(query, intentResponse);
      break;
    case INTENTS.DOOR_OPEN:
      handleDoorOpenIntent(query, intentResponse);
      break;
    case INTENTS.INTERIOR_SHOW:
      handleExteriorInteriorViewIntent(query, intentResponse);
      break;
    case INTENTS.SHOW_COLOR_OPTIONS_EXT:
    //   handleShowColorOptionsExteriorIntent(query, intentResponse);
      break;
    case INTENTS.SHOW_COLOR_OPTIONS_INT:
      handleShowColorOptionsInteriorIntent(query, intentResponse);
      break;
    case INTENTS.HEADLIGHT_ON:
    //   handleHeadlightOnIntent(query, intentResponse);
      break;
    // case INTENTS.ROTATE:
    //   handleRotateIntent();
    //   break;
    case INTENTS.CHIT_CHAT:
      handleChitChatIntent(query, intentResponse);
      break;
    default:
      handleDefaultIntent(query, intentResponse);
  }
};

export const handleCarInfoQueryIntent = async (
  query: string,
  intentResponse: IGetActionIntent
) => {
  const reader = await ChatService.getQuestionAnswer({
    query: intentResponse.value.toString(),
    role: "user",
  });
  const chatList = $query(".chat-list");
  const id = v4();
  chatList?.insertAdjacentHTML(
    "beforeend",
    renderQuery({ query, answer: "", id })
  );
  try {
    while (true) {
      const result: ReadableStreamReadResult<Uint8Array> | undefined =
        await reader?.read();
      if (result?.done) {
        break;
      }
      let x = new TextDecoder().decode(result?.value);
      const answerElement = $query(`.answer-p-${id}`);
      (answerElement as HTMLElement).innerHTML += x;
      const chatListContainer = $query(".chat-list-container") as HTMLElement;
      chatListContainer.scrollTop = (chatListContainer as Element).scrollHeight;
    }
    // if ($query(`.answer-p-${id}`)) {
    //   localStorage.setChat({
    //     answer: $query(`.answer-p-${id}`)!.innerHTML,
    //     query,
    //     id,
    //   });
    // }
  } catch (error) {
    console.log(error);
  } finally {
    clearChatInputField();
  }
};
const colorMapping: ColorMapping = {
  blue: "#003478",
  lightingBlue: "#23438A",
  black: "#000000",
  red: "#5F0B0B",
};
export const handleChangeCarColorIntent = (
  query: string,
  intentResponse: IGetActionIntent,
) => {
  const intentColorName = typeof intentResponse.value === 'string' ? intentResponse.value.toLowerCase() as keyof ColorMapping : null;

  if (!intentColorName || !colorMapping[intentColorName]) {
    intentResponse.message = `Currently, the "${intentResponse.value}" option is not available.`;
  } else {
    const colorCode = colorMapping[intentColorName];

    if (globals.threeJSComponent) {
      const currentCarColor = globals.threeJSComponent.getCurrentCarColor(); // Method to get current car color

      if (currentCarColor === colorCode) {
        intentResponse.message = `The car is already in the requested color ${intentColorName}.`;
      } else {
        globals.threeJSComponent.changeCarPaintColor(colorCode);
        intentResponse.message = `The car color has been changed to ${intentColorName}.`;
      }
    } else {
      console.error('ThreeJSComponent is not initialized.');
      intentResponse.message = 'Error: ThreeJSComponent is not available.';
    }
  }

  publishChat(query, intentResponse.message);
};


const publishChat = (query: string, answer: string) => {
  pubsub.publish(PUBSUB_CONSTANTS.CHAT_QUERY_RESOLVED, {
    query,
    answer,
    id: 1,
  });
};

export const handleChangeViewIntent = (
  query: string,
  intentResponse: IGetActionIntent
) => {};

export const handleDoorOpenIntent = (
  query: string,
  intentResponse: IGetActionIntent
) => {
  clearChatInputField();

  const doorCheck = globals.threeJSComponent?.getCurrentIsDoorStatus();

  if (query.toLowerCase().includes("open")) { 
    if (doorCheck) {  
      intentResponse.message = "Door is already open";
    } else {
      globals.threeJSComponent?.playAllDoorsOpening();
      intentResponse.message = "Opening the doors";
    }
  } else if (query.toLowerCase().includes("close")) { 
    if (!doorCheck) {
      intentResponse.message = "Door is already closed";
    } else {
      globals.threeJSComponent?.playAllDoorsClosing();
      intentResponse.message = "Closing the doors";
    }
  } else {
    intentResponse.message = "I don't understand the door command.";
  }

  publishChat(query, intentResponse.message); // Publish the query and response to the chat
};

// export const handleHeadlightOnIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   clearChatInputField();
//   const modelViewerElement = document.querySelector("[model-viewer]") as InstanceType< typeof ModelViewerComponent>;

//   const modelViewerComponent = modelViewerElement.components["model-viewer"];
//   if (intentResponse.value) { 
//     if (modelViewerComponent.car.isHeadlight) {
//       intentResponse.message = "Headlight is already on";
//     } else {
//       modelViewerComponent.toggelHeadLight();
//     }
//   } else { 
//     if (modelViewerComponent.car.isHeadlight) {
//       modelViewerComponent.toggelHeadLight();
//     } else {
//       intentResponse.message = "Headlight is already off.";
//     }
//   }

//   publishChat(query, intentResponse.message);
// };
export const handleRotateIntent = () => {};

export const handleChitChatIntent = (
  query: string,
  intentResponse: IGetActionIntent
) => {
  clearChatInputField();
  publishChat(query, intentResponse.value.toString());
};


// export const handleShowColorOptionsExteriorIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   const modelViewerElement = document.querySelector("[model-viewer]") as InstanceType<typeof ModelViewerComponent>;


//   if (intentResponse.value) {

//     const onClick = attachCategoryOptionClickEvents(modelViewerElement, 3801)
//     attachOptionButtonClickEvents(modelViewerElement, onClick);        
//         const swatchContainer = $query(".swatch-category");
//         if (swatchContainer) {
//           setTimeout(function () {
//             swatchContainer.classList.add("side-bar-open");
//           }, 100);
//         }
//   } else {
//     intentResponse.message = "currently not avilable "
//   }

//   publishChat(query, intentResponse.message);
// };

export const handleShowColorOptionsInteriorIntent = (
  query: string,
  intentResponse: IGetActionIntent
) => {};

export const handleExteriorInteriorViewIntent = (
  query: string,
  intentResponse: IGetActionIntent
) => {
  clearChatInputField();

  if (globals.threeJSComponent) {
    const modelViewerComponent = globals.threeJSComponent; 
    const isInteriorView = modelViewerComponent.isInteriorView(); 

    if (intentResponse.value) {
      if (isInteriorView) {
        intentResponse.message = "You are already viewing the interior.";
      } else {
        modelViewerComponent.switchToInteriorCamera(); 
        intentResponse.message = "Switched to the interior view.";
      }
    } 
    else {
      if (isInteriorView) {
        modelViewerComponent.switchToExteriorCamera(); 
        intentResponse.message = "Switched to the exterior view.";
      } else {
        intentResponse.message = "You are already viewing the exterior.";
      }
    }
  } else {
    console.error('ThreeJSComponent is not initialized.');
    intentResponse.message = 'Error: ThreeJSComponent is not available.';
  }

  publishChat(query, intentResponse.message);
};


export const handleDefaultIntent = (
  query: string,
  intentResponse: IGetActionIntent
) => {};
