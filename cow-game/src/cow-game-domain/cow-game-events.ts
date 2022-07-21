import { IModel, INpc, IPosition } from "./cow-game-model";

export interface INewGameStarted {
  type: "INewGameStarted";
  npcLifespan: number;
  grid: IModel["grid"];
  playerSpawn: IPosition;
  npcsToSpawn: INpc[];
}

export interface IDestinationUpdated {
  type: "IDestinationUpdated";
  position: IPosition;
}

export interface IHorseSpawned {
  type: "IHorseSpawned";
}

export interface INpcSpawned {
  type: "INpcSpawned";
  npc: INpc;
}

export interface INpcArrivedAtHome {
  type: "INpcArrivedAtHome";
  npc: INpc;
}

export interface INpcExploded {
  type: "INpcExploded";
  npc: INpc;
}

export interface IHouseFocused {
  type: "IHouseFocused";
  housePosition: IPosition;
}

export interface IGameEnded {
  type: "IGameEnded";
  playerScore: number;
}

export type Events =
  | INewGameStarted
  | IDestinationUpdated
  | IHorseSpawned
  | INpcSpawned
  | INpcArrivedAtHome
  | INpcExploded
  | IHouseFocused
  | IGameEnded;
