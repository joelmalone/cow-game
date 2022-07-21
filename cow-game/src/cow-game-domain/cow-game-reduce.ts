import { AppError } from "../reusable/app-errors";
import { assertUnreachable } from "../reusable/assertions";
import type { Events } from "./cow-game-events";
import type { IModel } from "./cow-game-model";

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case "INewGameStarted": {
      return {
        gameState: "playing",
        npcLifespan: ev.npcLifespan,
        grid: ev.grid,
        playerSpawn: ev.playerSpawn,
        npcsToSpawn: ev.npcsToSpawn,
        npcs: [],
        housesRemaining: ev.npcsToSpawn.length,
        horsesSpawned: 0,
        housesLost: [],
        housesWon: [],
      };
    }

    case "IDestinationUpdated": {
      return model;
    }

    case "INpcSpawned": {
      const { npc } = ev;
      return {
        ...model,
        npcsToSpawn: model.npcsToSpawn.filter((i) => i.id !== npc.id),
        npcs: model.npcs.concat(npc),
      };
    }

    case "IHorseSpawned": {
      return {
        ...model,
        horsesSpawned: model.horsesSpawned + 1,
      };
    }

    case "INpcArrivedAtHome": {
      const { npc } = ev;
      return {
        ...model,
        housesRemaining: model.housesRemaining - 1,
        housesLost: [...model.housesLost, npc.home],
      };
    }

    case "INpcExploded": {
      const { npc } = ev;
      return {
        ...model,
        housesRemaining: model.housesRemaining - 1,
        housesWon: [...model.housesWon, npc.home],
      };
    }

    case "IHouseFocused": {
      return model;
    }

    case "IGameEnded": {
      return {
        ...model,
        gameState: "gameOver",
      };
    }

    default:
      // A compilation error here means there's a missing case up there ☝️
      assertUnreachable(ev);
  }

  throw new AppError("An event was not handled in the reducer.", { model, ev });
}
