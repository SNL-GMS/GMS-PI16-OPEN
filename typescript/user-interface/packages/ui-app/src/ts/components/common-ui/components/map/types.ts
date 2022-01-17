import GoldenLayout from '@gms/golden-layout';
import { Viewer } from 'cesium';
import React from 'react';
import { EntityCesiumReadonlyProps } from 'resium/dist/types/src/Entity/Entity';

export interface MapProps {
  glContainer?: GoldenLayout.Container;
  minHeightPx: number;
  entities?: JSX.Element[];
  handlers?: React.FunctionComponent<any>[];
}

export interface MapDataSourceProps {
  setCurrentlySelectedEntity(entity: EntityCesiumReadonlyProps): void;
}

export interface MapHandlerProps {
  viewer: Viewer;
}
