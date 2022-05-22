import type { Events } from "./cow-game-events";
import type { IModel } from "./cow-game-model";

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case "INewGameStarted": {
      return {
        grid: ev.grid,
        playerSpawn: ev.playerSpawn,
        npcSpawnPositions: ev.npcSpawns,
        npcs: [],
        horsesSpawned: 0,
        housesLost: [],
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

    case "INpcArrivedAtHome": {
      const { homeAddress } = ev;
      return {
        ...model,
        housesLost: [...model.housesLost, homeAddress],
      };
    }
  }
}
