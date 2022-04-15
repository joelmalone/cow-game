import { IPosition } from "./cow-game-model";

export interface INewGameStarted {
  type: "INewGameStarted";
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
  route: IPosition[];
}

export type Events =
  | INewGameStarted
  | IDestinationUpdated
  | IHorseSpawned
  | INpcSpawned;
