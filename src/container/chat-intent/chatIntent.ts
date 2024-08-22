// import { ChatService } from "../../services/chat";
// import pubsub from "../../shared/pubsub";
// import { INTENTS, PUBSUB_CONSTANTS } from "../../utils/constants";
// import { $query, clearChatInputField } from "../../utils/dom";
// import { renderQuery } from "../chat/chat";
// import { ModelViewerComponent } from "../../model-viewer/index";
// import { v4 } from "uuid";
// import { attachCategoryOptionClickEvents } from "../category/category";
// import { attachOptionButtonClickEvents } from "../../model-viewer/modelActions";

// type ColorMapping = {
//   readonly blue: "#003478";
//   readonly lightingBlue: "#23438A";
//   readonly black: "#000000";
//   readonly red: "#5F0B0B";
// };
// export const attachChatIntentEvents = async (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   const { intent, value } = intentResponse;
//   switch (intent) {
//     case INTENTS.CAR_INFO_QUERY:
//       await handleCarInfoQueryIntent(query, intentResponse);
//       break;
//     case INTENTS.CHANGE_CAR_COLOR:
//       handleChangeCarColorIntent(query, intentResponse);
//       break;
//     case INTENTS.CHANGE_VIEW:
//       handleChangeViewIntent(query, intentResponse);
//       break;
//     case INTENTS.DOOR_OPEN:
//       handleDoorOpenIntent(query, intentResponse);
//       break;
//     case INTENTS.INTERIOR_SHOW:
//       handleExteriorInteriorViewIntent(query, intentResponse);
//       break;
//     case INTENTS.SHOW_COLOR_OPTIONS_EXT:
//       handleShowColorOptionsExteriorIntent(query, intentResponse);
//       break;
//     case INTENTS.SHOW_COLOR_OPTIONS_INT:
//       handleShowColorOptionsInteriorIntent(query, intentResponse);
//       break;
//     case INTENTS.HEADLIGHT_ON:
//       handleHeadlightOnIntent(query, intentResponse);
//       break;
//     // case INTENTS.ROTATE:
//     //   handleRotateIntent();
//     //   break;
//     case INTENTS.CHIT_CHAT:
//       handleChitChatIntent(query, intentResponse);
//       break;
//     default:
//       handleDefaultIntent(query, intentResponse);
//   }
// };

// export const handleCarInfoQueryIntent = async (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   const reader = await ChatService.getQuestionAnswer({
//     query: intentResponse.value.toString(),
//     role: "user",
//   });
//   const chatList = $query(".chat-list");
//   const id = v4();
//   chatList?.insertAdjacentHTML(
//     "beforeend",
//     renderQuery({ query, answer: "", id })
//   );
//   try {
//     while (true) {
//       const result: ReadableStreamReadResult<Uint8Array> | undefined =
//         await reader?.read();
//       if (result?.done) {
//         break;
//       }
//       let x = new TextDecoder().decode(result?.value);
//       const answerElement = $query(`.answer-p-${id}`);
//       (answerElement as HTMLElement).innerHTML += x;
//       const chatListContainer = $query(".chat-list-container") as HTMLElement;
//       chatListContainer.scrollTop = (chatListContainer as Element).scrollHeight;
//     }
//     // if ($query(`.answer-p-${id}`)) {
//     //   localStorage.setChat({
//     //     answer: $query(`.answer-p-${id}`)!.innerHTML,
//     //     query,
//     //     id,
//     //   });
//     // }
//   } catch (error) {
//     console.log(error);
//   } finally {
//     clearChatInputField();
//   }
// };

// const colorMapping: ColorMapping = {
//   blue: "#003478",
//   lightingBlue: "#23438A",
//   black: "#000000",
//   red: "#5F0B0B",
// };
// export const handleChangeCarColorIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   const intentColorName = typeof intentResponse.value === 'string' ? intentResponse.value.toLowerCase() as keyof ColorMapping : null;

//   if (!intentColorName || !colorMapping[intentColorName]) {
//     intentResponse.message = `currently this "${intentResponse.value}" option is not available.`;
//   } else {
//     const modelViewerElement = document.querySelector("[model-viewer]") as InstanceType<typeof ModelViewerComponent>;
//     const modelViewerComponent = modelViewerElement.components["model-viewer"];
//     const currentCarColor = modelViewerComponent.car.carColor;

//     if (currentCarColor === colorMapping[intentColorName]) {
//       intentResponse.message = `The car is already in the requested color ${intentColorName}.`;
//     } else {
//       modelViewerComponent.changeModelColor(colorMapping[intentColorName]);
//     }
//   }

//   publishChat(query, intentResponse.message);
// };

// const publishChat = (query: string, answer: string) => {
//   pubsub.publish(PUBSUB_CONSTANTS.CHAT_QUERY_RESOLVED, {
//     query,
//     answer,
//     id: 1,
//   });
// };

// export const handleChangeViewIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {};

// export const handleDoorOpenIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   clearChatInputField();
//   const modelViewerElement = document.querySelector("[model-viewer]") as InstanceType< typeof ModelViewerComponent>;

//   const modelViewerComponent = modelViewerElement.components["model-viewer"];
//   if (intentResponse.value) { 
//     if (modelViewerComponent.car.isDoorOpen) {
//       intentResponse.message = "Door is already open";
//     } else {
//       modelViewerComponent.doorsToggle();
//     }
//   } else { 
//     if (modelViewerComponent.car.isDoorOpen) {
//       modelViewerComponent.doorsToggle();
//     } else {
//       intentResponse.message = "Door is already closed";
//     }
//   }
//   publishChat(query, intentResponse.message);
// };

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
// export const handleRotateIntent = () => {};

// export const handleChitChatIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   clearChatInputField();
//   publishChat(query, intentResponse.value.toString());
// };


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

// export const handleShowColorOptionsInteriorIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {};

// export const handleExteriorInteriorViewIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {
//   clearChatInputField();
//   const modelViewerElement = document.querySelector("[model-viewer]") as InstanceType< typeof ModelViewerComponent>;

//   const modelViewerComponent = modelViewerElement.components["model-viewer"];
//   if (intentResponse.value) { 
//     if (modelViewerComponent.isInterior) {
//       intentResponse.message = "You are already looking interior ";
//     } else {
//       modelViewerComponent.toggleInterior();
//     }
//   } else { 
//     if (modelViewerComponent.isInterior) {
//       modelViewerComponent.toggleInterior();
//     } else {
//       intentResponse.message = "You are already looking  exterior";
//     }
//   }

//   publishChat(query, intentResponse.message);

// };

// export const handleDefaultIntent = (
//   query: string,
//   intentResponse: IGetActionIntent
// ) => {};
