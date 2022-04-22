export interface IPosition {
  x: number;
  y: number;
}

export enum TerrainTypes {
  Grass,
  Street_Straight,
  Street_Intersection,
}

export enum Facings {
  North,
  East,
  South,
  West,
}

export const HouseTypes = 20;

export interface ICell {
  houseType: number;
  houseFacing: Facings;
  terrainType: TerrainTypes;
  terrainFacing: Facings;
}

export interface IModel {
  grid: {
    width: number;
    height: number;
    cells: ICell[];
  };
}

export type Tappable = "player" | "terrain";
