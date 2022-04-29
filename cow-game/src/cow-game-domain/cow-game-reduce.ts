import type { Events } from "./cow-game-events";
import type { IModel } from "./cow-game-model";

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case "INewGameStarted": {
      return {
        grid: ev.grid,
        npcSpawned: 0,
        horsesSpawned: 0,
      };
    }
    case "IDestinationUpdated": {
      return model;
    }
    case "INpcSpawned": {
      return {
        ...model,
        npcSpawned: model.npcSpawned + 1,
      };
    }
    case "IHorseSpawned": {
      return {
        ...model,
        horsesSpawned: model.horsesSpawned + 1,
      };
    }
  }
}
