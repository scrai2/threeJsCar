import localStorage from "./localStorage";
import cacheStorage from "./cacheStorage";

export const loadCacheAndLocalStorage = () => {
  loadLocalStorage();
  loadCacheStorage();
};

export const loadCacheStorage = () => {
  const data = localStorage.getItem();
  cacheStorage.storage.chats = [...data.chats];
};

export const loadLocalStorage = () => {
  if (!localStorage.isStorageValid()) {
    localStorage.clearStorage();
  }
  localStorage.init(cacheStorage.storage.chats);
};

// export const getSelections = (sceneId: number) => {
//   const scene = cacheStorage.storage.visualizer.scenes.find(
//     (scn) => scn.id === sceneId
//   )!;
//   let selections = [] as IStorageSelection[];
//   scene.categories.forEach((category) => {
//     return category.swatches.map((swatch) => {
//       if (swatch.isSelected) {
//         selections.push({
//           category: category.name,
//           categoryId: category.id,
//           swatchName: swatch.name,
//           swatchId: swatch.id,
//         });
//       }
//     });
//   });
//   return selections;
// };

// export const getUpdatedSelections = (sceneId: number) => {
//   const scene = cacheStorage.storage.visualizer.scenes.find(
//     (scene) => scene.id === sceneId
//   )!;
//   const { selection: storedSelections } = localStorage.getItem();

//   const currentCategoryIds = storedSelections.map((slc) => slc.categoryId);

//   let updatedSelections = [...storedSelections] as IStorageSelection[];

//   scene.categories.forEach((category) => {
//     if (!currentCategoryIds.includes(category.id)) {
//       category.swatches.forEach((swatch) => {
//         if (swatch.isSelected) {
//           updatedSelections.push({
//             category: category.name,
//             categoryId: category.id,
//             swatchName: swatch.name,
//             swatchId: swatch.id,
//           });
//         }
//       });
//     }
//   });
//   return getValidSelections(updatedSelections, scene);
// };

// const getValidSelections = (selections: IStorageSelection[], scene: IScene) => {
//   const finalSelection = selections.map((selection) => {
//     const category = getCategoryWithCategoryId(scene, selection.categoryId);
//     if (category) {
//       const swatchItem = category.swatches.find(
//         (swatch) => swatch.id === selection.swatchId
//       );
//       if (swatchItem) {
//         return selection;
//       } else {
//         const defaultSwatch = category.swatches.find(
//           (swatch) => swatch.isSelected
//         )!;
//         return {
//           category: category.name,
//           categoryId: category.id,
//           swatchId: defaultSwatch.id,
//           swatchName: defaultSwatch.name,
//         };
//       }
//     } else {
//       return selection;
//     }
//   });
//   return finalSelection;
// };

// export const getSceneFromSceneName = (sceneName: string) => {
//   return cacheStorage.storage.visualizer.scenes.find(
//     (scene) => scene.name === sceneName
//   );
// };

// export const getCategoryWithCategoryId = (
//   scene: IScene,
//   categoryId: number
// ) => {
//   return scene.categories.find((cat) => cat.id === categoryId);
// };
