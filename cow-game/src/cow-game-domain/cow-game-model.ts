import { IGameParams } from "./cow-game-logic";

export interface IPosition {
  x: number;
  y: number;
}

export interface INpc {
  id: number;
  spawn: IPosition;
  home: IPosition;
  route: IPosition[];
  spawnTime: number;
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

export interface IScore {
  housesWon: number;
  horsesSpawned: number;
  score: number;
}

export interface IModel {
  gameState: "playing" | "gameOver";
  gameParams: IGameParams;
  score: IScore;
  grid: {
    width: number;
    height: number;
    cells: ICell[];
  };
  playerSpawn: IPosition;
  npcsToSpawn: INpc[];
  npcs: INpc[];
  housesLost: IPosition[];
  housesWon: IPosition[];
}

export type Tappable = "player" | "terrain";
