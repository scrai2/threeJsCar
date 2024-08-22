import { INITIAL_PAYLOAD } from "../../utils/constants";
import { loadActions } from "../actions/actions";
import { loadCategories } from "../category/category";

export const render = (component: any) => {
  loadCategories(INITIAL_PAYLOAD.visualizerContainer, component);
  loadActions(INITIAL_PAYLOAD.visualizerContainer);
};
