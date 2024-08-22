import "../../scss/main.scss";
import Icons from "../../assests/icons/icons.svg";
import pubsub from "../../shared/pubsub";
import { PUBSUB_CONSTANTS } from "../../utils/constants";
import { CATEGORIES } from "../category/category";
import { $id, $query } from "../../utils/dom";

export const loadOptions = (container: string) => {
  pubsub.subscribe(
    PUBSUB_CONSTANTS.CATEGORY_SELECT_EVENT,
    ({
      categoryId: id,
      categoryName: name,
      categories,
    }: {
      categoryId: number;
      categoryName: string;
      categories: ICategory[];
    }) => {
      const { availableOptions, path } = CATEGORIES.find(
        (category) => category.id === id
      )!;
      initializeSwatches(availableOptions, container, id, name, path);
    }
  );
};

export const initializeSwatches = (
  options: IAvailableOptions[],
  container: string,
  categoryId: number,
  categoryName: string,
  thumbnail: string
) => {
  const visualizerContainer = $id(container)!;
  const swatchContainer = $query(
    ".swatch-category",
    visualizerContainer as HTMLElement
  );
  if (swatchContainer) {
    swatchContainer.remove();
  }
  visualizerContainer.insertAdjacentHTML(
    "beforeend",
    renderCategoryOptions(options, categoryName, thumbnail)
  );
  const swatchCloseButton = $query(".swatch-category-header-cross");
  const newSwatchContainer = $query(
    ".swatch-category",
    visualizerContainer as HTMLElement
  );
  if (swatchCloseButton && newSwatchContainer) {
    swatchCloseButton.addEventListener("click", () => {
      newSwatchContainer.classList.remove("side-bar-open");
    });
  }
};

export const loadCategoriesOptions = () => {};

export const renderCategoryOptions = (
  availableOptions: IAvailableOptions[],
  categoryName: string,
  thumbnail: string
) => {
  return `
  <div class="swatch-category">
    <div class="swatch-category-header  ">
      <div class="swatch-category-header-text">
        <svg class="swatch-category-header-text-colordrop">
            <use xlink:href="${thumbnail}"></use>
        </svg>
        <p class="swatch-category-header-text-colortext">${categoryName}</p>
      </div>
      <svg class="swatch-category-header-cross">
        <use xlink:href="${Icons}#closeIcon"></use>
      </svg>
    </div>

    <div class="swatch-category-options">
      <ul class="swatch-category-options-list">
        ${availableOptions
          .map(
            (availableOption) => `
              <li class="swatch-category-options-list-item ${
                availableOption.isSelected ? "active" : ""
              }" data-swatch-id="${availableOption.id}" data-swatch-name="${
              availableOption.name
            }">
                <svg name="${
                  availableOption.name
                }" class="swatch-category-options-list-item-colorlist">
                    <use xlink:href="${availableOption.thumbnailPath}"></use>
                </svg>
                <svg class="check ${availableOption.isSelected ? "show" : ""}">
                <use xlink:href="${Icons}#checkIcon"></use>
                </svg>  
              </li> 
              
        `
          )
          .join("")}
      </ul>
    </div>
  </div>`;
};
