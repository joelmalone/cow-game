import { IModel, IPosition } from "./cow-game-model";

export interface INewGameStarted {
  type: "INewGameStarted";
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
  /**
   * The path for the npc to take to walk home; the last item will be their home address.
   */
  route: IPosition[];
}

export interface INpcArrivedAtHome {
  type: "INpcArrivedAtHome";
  homeAddress: IPosition;
}

export type Events =
  | INewGameStarted
  | IDestinationUpdated
  | IHorseSpawned
  | INpcSpawned
  | INpcArrivedAtHome;
