import { AppError } from "../reusable/app-errors";
import { assertUnreachable } from "../reusable/assertions";
import type { Events } from "./cow-game-events";
import { calculateScore } from "./cow-game-logic";
import type { IModel } from "./cow-game-model";

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case "INewGameStarted": {
      return {
        gameState: "playing",
        gameParams: ev.gameParams,
        score: {
          housesWon: 0,
          horsesSpawned: 0,
          score: 0,
        },
        grid: ev.grid,
        playerSpawn: ev.playerSpawn,
        npcsToSpawn: ev.npcsToSpawn,
        npcs: [],
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
      const horsesSpawned = model.score.horsesSpawned + 1;
      return {
        ...model,
        score: {
          ...model.score,
          horsesSpawned,
          score: calculateScore(
            model.gameParams.pointsPerHouse,
            model.gameParams.pointsPerHorse,
            model.score.housesWon,
            horsesSpawned
          ),
        },
      };
    }

    case "INpcArrivedAtHome": {
      const { npc } = ev;
      return {
        ...model,
        housesLost: [...model.housesLost, npc.home],
      };
    }

    case "INpcExploded": {
      const { npc } = ev;
      const housesWon = [...model.housesWon, npc.home];
      return {
        ...model,
        score: {
          ...model.score,
          housesWon: housesWon.length,
          score: calculateScore(
            model.gameParams.pointsPerHouse,
            model.gameParams.pointsPerHorse,
            housesWon.length,
            model.score.horsesSpawned
          ),
        },
        housesWon,
      };
    }

    case "INpcFocused": {
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
