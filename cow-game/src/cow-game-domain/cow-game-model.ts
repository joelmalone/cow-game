export interface IPosition {
  x: number;
  y: number;
}

export enum TerrainTypes {
  Grass,
  Street_Straight,
  Street_4Way,
}

export enum Facings {
  North,
  East,
  South,
  West,
}

export const HouseTypesCount = 20;

export interface ICell {
  house: {
    houseType: number;
    houseFacing: Facings;
  } | null;
  terrainType: TerrainTypes;
  terrainFacing: Facings;
}

export interface IModel {
  grid: {
    width: number;
    height: number;
    cells: ICell[];
  };
  npcSpawned: number;
  horsesSpawned: number;
}

export type Tappable = "player" | "terrain";
