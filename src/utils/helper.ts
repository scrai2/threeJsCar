import { $query } from "./dom";

export const hideLoader = () => {
    // const splash = $query('.progress') as HTMLElement;
    // splash.style.display = 'none';
};

export const radianToDegree = (angle: number) => angle * (180 / Math.PI)