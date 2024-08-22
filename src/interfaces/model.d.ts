interface ICategory {
  id: number;
  name: string;
  path: string;
  availableOptions: IAvailableOptions[];
}

interface IAvailableOptions {
  id: number;
  name: string;
  isSelected: boolean;
  thumbnailPath: string;
}
