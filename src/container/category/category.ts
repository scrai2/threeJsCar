import "../../scss/main.scss";
import Icons from "../../assests/icons/icons.svg";
import { $id, $query, $queryAll } from "../../utils/dom";
import { loadOptions } from "../options/options";
import { INITIAL_PAYLOAD, PUBSUB_CONSTANTS } from "../../utils/constants";
import pubsub from "../../shared/pubsub";
import { ThreeJSComponent } from "../../model-viewer";
// import {
//   changeModelColor,
//   changeWheels,
// } from "../../model-viewer/modelActions";

export const CATEGORIES: ICategory[] = [
  {
    id: 3801,
    name: "Color",
    path: `${Icons}#colorIcon`,
    availableOptions: [
      {
        id: 2801,
        name: "#003478",
        isSelected: true,
        thumbnailPath: `${Icons}#darkblueIcon`,
      },
      {
        id: 2802,
        name: "#23438A",
        isSelected: false,
        thumbnailPath: `${Icons}#lightingBlueIcon`,
      },
      {
        id: 2803,
        name: "#000000",
        isSelected: false,
        thumbnailPath: `${Icons}#blackIcon`,
      },
      {
        id: 2804,
        name: "#5F0B0B",
        isSelected: false,
        thumbnailPath: `${Icons}#redIcon`,
      },
    ],
  },
  {
    id: 3802,
    name: "Alloy",
    path: `${Icons}#wheelIcon`,
    availableOptions: [
      {
        id: 2805,
        name: "SM_Alloy_01",
        isSelected: true,
        thumbnailPath: `${Icons}#image0_770_18761`,
      },
      {
        id: 2806,
        name: "SM_Alloy_02",
        isSelected: false,
        thumbnailPath: `${Icons}#image0_770_18761`,
      },
      {
        id: 2807,
        name: "SM_Alloy_03",
        isSelected: false,
        thumbnailPath: `${Icons}#image0_770_18762`,
      },
      {
        id: 2808,
        name: "SM_Alloy_04",
        isSelected: false,
        thumbnailPath: `${Icons}#image0_770_18760`,
      },
    ],
  },
];

export const loadCategories = (container: string, component: ThreeJSComponent) => {
  const categoryContainer = $query(`.category-container`);
  const swatchContainer = $query(`.swatch-category`);
  swatchContainer?.remove();
  categoryContainer?.remove();
  if (CATEGORIES.length > 0) {
    $id(container)?.insertAdjacentHTML("beforeend", renderCategory(CATEGORIES));
    loadOptions(INITIAL_PAYLOAD.visualizerContainer, component);
    const categoryLi = $queryAll("ul.category-container-list li");
    if (categoryLi.length > 0) categoryClick(categoryLi[0] as HTMLElement);
    categoryLi.forEach((element) =>
      element.addEventListener("click", (event) => {
        categoryClick(event.target as HTMLElement);
        const catId = element.getAttribute("data-category-id");
        const swatchContainer = $query(".swatch-category");
        if (swatchContainer) {
          setTimeout(function () {
            swatchContainer.classList.add("side-bar-open");
          }, 100);
        }
      })
    );
  }
};

export const categoryClick = (element: HTMLElement) => {
  const categoryLi = $queryAll("ul.category-container-list li");
  categoryLi.forEach((element) => element.classList.remove("active"));
  let selectedCategory: HTMLElement;
  if (element.getAttribute("name")) {
    selectedCategory = element.parentNode as HTMLElement;
  } else {
    selectedCategory = element;
  }
  selectedCategory.classList.add("active");
  const categoryId = Number(selectedCategory.getAttribute("data-category-id"));
  const categoryName = selectedCategory.getAttribute(
    "data-category-name"
  ) as string;
  console.log(`Category clicked: ID = ${categoryId}, Name = ${categoryName}`);
  pubsub.publish(PUBSUB_CONSTANTS.CATEGORY_SELECT_EVENT, {
    CATEGORIES,
    categoryId,
    categoryName,
  });
};

export const renderCategory = (categories: ICategory[]) => {
  return `
    <div class="category-container body-b">
      <ul class="category-container-list radius-300">
        ${categories
          .map(
            (category) => `
            <li class="category-container-list-item" data-category-id=${category.id} data-category-name="${category.name}">
            <svg name="${category.name}" class="category-container-list-item-dropIcon">
              <use xlink:href="${category.path}" ></use>
            </svg>
            <a name="${category.name}">${category.name}</a>
            </li>`
          )
          .join("")}
      </ul>
    </div>    
  `;
};
