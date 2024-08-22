interface IStorageSelection {
  category: string;
  categoryId: number;
  swatchName: string;
  swatchId: number;
}
interface ILocalStorage {
  date: number;
  chats: IQuesAns[];
}

interface ICacheStorage {
  visualizer: IVisualizer;
  selections: IStorageSelection[];
  currentSceneId: number;
  chats: IQuesAns[];
}
