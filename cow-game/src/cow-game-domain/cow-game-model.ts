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
  npcLifespan: number;
  grid: {
    width: number;
    height: number;
    cells: ICell[];
  };
  playerSpawn: IPosition,
  npcSpawnPositions: IPosition[];
  npcs: { home: IPosition }[];
  housesRemaining: number;
  horsesSpawned: number;
  housesLost: IPosition[];
  housesWon: IPosition[];
}

export type Tappable = "player" | "terrain";
