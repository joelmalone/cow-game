import { IPosition } from "./cow-game-model";

export interface INewGameStarted {
  type: "INewGameStarted";
}

export interface IDestinationUpdated {
  type: "IDestinationUpdated";
  position: IPosition;
}

export type Events = INewGameStarted | IDestinationUpdated;
