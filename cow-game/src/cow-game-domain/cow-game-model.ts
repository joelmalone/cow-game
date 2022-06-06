export interface IPosition {
  x: number;
  y: number;
}

export interface INpc {
  id: number;
  spawn: IPosition;
  home: IPosition;
  route: IPosition[];
  lifespan: number;
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
  npcLifespan: number;
  grid: {
    width: number;
    height: number;
    cells: ICell[];
  };
  playerSpawn: IPosition;
  npcsToSpawn: INpc[];
  npcs: INpc[];
  housesRemaining: number;
  horsesSpawned: number;
  housesLost: IPosition[];
  housesWon: IPosition[];
}

export type Tappable = "player" | "terrain";
