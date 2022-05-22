import { IModel, IPosition } from "./cow-game-model";

export interface INewGameStarted {
  type: "INewGameStarted";
  npcLifespan: number;
  grid: IModel["grid"];
  playerSpawn: IPosition;
  npcSpawns: IPosition[];
}

export interface IDestinationUpdated {
  type: "IDestinationUpdated";
  position: IPosition;
}

export interface IHorseSpawned {
  type: "IHorseSpawned";
  spawnPosition: IPosition;
}

export interface INpcSpawned {
  type: "INpcSpawned";
  npcId: number;
  /**
   * The path for the npc to take to walk home; the last item will be their home address.
   */
  route: IPosition[];
  lifespan: number;
}

export interface INpcArrivedAtHome {
  type: "INpcArrivedAtHome";
  npcId: number;
  homeAddress: IPosition;
}

export interface INpcExploded {
  type: "INpcExploded";
  npcId: number;
  homeAddress: IPosition;
}

export type Events =
  | INewGameStarted
  | IDestinationUpdated
  | IHorseSpawned
  | INpcSpawned
  | INpcArrivedAtHome
  | INpcExploded;
