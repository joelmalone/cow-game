import type { Events } from "./cow-game-events";
import { createGrid, enumerateUnusedHouses, findPath } from "./cow-game-logic";
import type { IModel, IPosition, Tappable } from "./cow-game-model";

export type Command = (
  modelContainer: { readonly model: IModel },
  emitEvent: (ev: Events) => void
) => void;

export function startNewGame(seed: string): Command {
  return ({ model }, emitEvent) => {
    emitEvent({
      type: "INewGameStarted",
      npcLifespan: 60,
      grid: createGrid(),
      playerSpawn: { x: 3, y: 3 },
      npcSpawns: [
        { x: -1, y: 0 },
        { x: 3, y: -1 },
        { x: -1, y: 3 },
      ],
    });
  };
}

export function tap(tappable: Tappable, position: IPosition): Command {
  return function tap({ model }, emitEvent) {
    switch (tappable) {
      case "player": {
        emitEvent({ type: "IHorseSpawned", spawnPosition: position });
        break;
      }
      case "terrain": {
        emitEvent({ type: "IDestinationUpdated", position });
        break;
      }
    }
  };
}

export function spawnNpc(): Command {
  return function spawnNpc({ model }, emitEvent) {
    const npcId = model.npcs.length;

    // Spawn at one of the spawn positions
    const spawnPosition =
      model.npcSpawnPositions[
        Math.trunc(Math.random() * model.npcSpawnPositions.length)
      ];

    // Pick an unused house
    const unusedHouses = Array.from(enumerateUnusedHouses(model));
    if (!unusedHouses.length) {
      return;
    }

    const homeAddress =
      unusedHouses[Math.trunc(Math.random() * unusedHouses.length)];
    const route = findPath(model.grid, spawnPosition, homeAddress);
    emitEvent({
      type: "INpcSpawned",
      npcId,
      route,
      lifespan: model.npcLifespan,
    });
  };
}

export function notifyNpcArrivedAtHome(
  npcId: number,
  homeAddress: IPosition
): Command {
  return function notifyNpcArrivedAtHome({ model }, emitEvent) {
    emitEvent({ type: "INpcArrivedAtHome", npcId, homeAddress });
  };
}

export function notifyNpcExploded(
  npcId: number,
  homeAddress: IPosition
): Command {
  return function notifyNpcExploded({ model }, emitEvent) {
    emitEvent({ type: "INpcExploded", npcId, homeAddress });
  };
}
