import { IRectpackrConfig } from '../../src/core/types';

export type EmptyStringValueOption<T> = { [K in keyof T]: T[K] | '' };

export interface IRectangle {
  width: number;
  height: number;
}

export type IRectpackrLayoutAttributes = IRectpackrConfig;
