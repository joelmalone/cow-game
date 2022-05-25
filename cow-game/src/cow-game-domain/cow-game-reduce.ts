import { AppError } from "../reusable/app-errors";
import type { Events } from "./cow-game-events";
import type { IModel } from "./cow-game-model";

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case "INewGameStarted": {
      return {
        npcLifespan: ev.npcLifespan,
        grid: ev.grid,
        playerSpawn: ev.playerSpawn,
        npcSpawnPositions: ev.npcSpawns,
        npcs: [],
        housesRemaining: ev.grid.cells.filter((c) => c.house).length,
        horsesSpawned: 0,
        housesLost: [],
        housesWon: [],
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
        housesRemaining: model.housesRemaining - 1,
        housesLost: [...model.housesLost, homeAddress],
      };
    }

    case "INpcExploded": {
      const { homeAddress } = ev;
      return {
        ...model,
        housesRemaining: model.housesRemaining - 1,
        housesWon: [...model.housesWon, homeAddress],
      };
    }
  }

  throw new AppError("An event was not handled in the reducer.", { model, ev });
}
