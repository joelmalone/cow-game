import type { Events } from "./cow-game-events";
import type { IModel } from "./cow-game-model";

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case "INewGameStarted": {
      return {
        grid: ev.grid,
        npcSpawnPositions: ev.npcSpawns,
        npcs: [],
        horsesSpawned: 0,
      };
    }
    case "IDestinationUpdated": {
      return model;
    }
    case "INpcSpawned": {
      const npc = { home: ev.route[ev.route.length - 1] };
      return {
        ...model,
        npcs: [npc, ...model.npcs],
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
