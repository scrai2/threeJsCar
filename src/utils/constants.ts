export const INITIAL_PAYLOAD: IInitialPayload = {
  container: "main-container",
  key: "Visualizer",
  visualizerContainer: "visualizer-container",
  aSceneContainer: "a-scene-container",
};

export enum PUBSUB_CONSTANTS {
  CATEGORY_SELECT_EVENT = "categorySelectEvent",
  SWATCH_SELECT_EVENT = "swatchSelectEvent",
  CHAT_QUERY_RESOLVED = "chatQueryResolved",
  CHAT_QUERY_PUBLISHED = "CHAT_QUERY_PUBLISHED",
}

export enum INTENTS {
  CHANGE_CAR_COLOR = "change_car_color",
  CAR_INFO_QUERY = "car_info_query",
  DOOR_OPEN = "door_open",
  CHANGE_VIEW = "change_view",
  ROTATE = "rotate",
  HEADLIGHT_ON = "headlight_on",
  CHIT_CHAT = "chit_chat",
  INTERIOR_SHOW = "interior_show",
  SHOW_COLOR_OPTIONS_EXT = "show_color_options_ext",
  SHOW_COLOR_OPTIONS_INT = "show_color_options_int",
}

export enum CHAT_INTENT_OPTION_AVAILABLE {
  AVAILABLE = "Yeah sure!",
  NOT_AVAIlABLE = "Sorry! We currently do not have the option available.",
}

export enum ACTIONS {
  OPEN_DOOR = "Opened_Door",
  CLOSE_DOOR = "Closed_Door",
}

export enum DOORS {
  OPEN_DOOR = "Opened_Door",
  CLOSE_DOOR = "Closed_Door",
}

export const CHAT_HEADER = "Customize with Ease";

export const AVAILABLE_COLORS = ["blue", "white", "black", "red"];

export const DOOR_MESH = ["SM_Body", "SM_FR_Door_Metal",
"SM_BR_Door_Metal",
"SM_FL_Door_Metal",
"SM_BL_Door_Metal",]

export const WHEEL_MESH = ["SM_Alloy_01", "SM_Alloy_02", "SM_Alloy_03", "SM_Alloy_04"]

export const GLASS_MESH = ["MT_Glass", "MT_Glass.001"]

export const lightMesh = ["SM_Front_Light.005", "SM_Front_Light.006", "SM_Front_Light.007", "SM_Front_Light.008"]
