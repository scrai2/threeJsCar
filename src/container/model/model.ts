import { ThreeJSComponent } from "../../model-viewer";
import { INITIAL_PAYLOAD } from "../../utils/constants";
import { loadActions } from "../actions/actions";
import { loadCategories } from "../category/category";

export const render = (component: ThreeJSComponent) => {
  loadCategories(INITIAL_PAYLOAD.visualizerContainer, component);
  loadActions(INITIAL_PAYLOAD.visualizerContainer);
};
