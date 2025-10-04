import { BestFitStripPack } from 'best-fit-strip-pack';

export type IRectpackrChildElement = HTMLElement | SVGElement;

export interface IRectpackrConfig {
  positioning: 'offset' | 'transform';
  'x-direction': 'ltr' | 'rtl';
  'y-direction': 'ttb' | 'btt';
}

export interface IRectpackr {
  config: IRectpackrConfig;
  container: HTMLElement;
  children: {
    element: IRectpackrChildElement;
    height: number;
    width: number;
  }[];
  childrenContainer: HTMLElement;
  isPendingStartObservingChildren: boolean;
  loadingImages: Map<HTMLElement, (this: HTMLImageElement) => void>;
  observers: {
    childrenContainerMutation: MutationObserver;
    childrenResize: ResizeObserver;
    containerResize: ResizeObserver;
  };
  stripPack: BestFitStripPack;
}
