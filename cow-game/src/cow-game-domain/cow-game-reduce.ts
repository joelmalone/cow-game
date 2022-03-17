import type { Events } from "./cow-game-events";
import type { IModel } from "./cow-game-model";

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case "INewGameStarted": {
      return model;
    }
    case "IDestinationUpdated": {
      return model;
    }
  }
}
