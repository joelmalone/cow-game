import type { Events } from "./cow-game-events";
import { createGrid, enumerateUnusedHouses } from "./cow-game-logic";
import type { IModel, IPosition, Tappable } from "./cow-game-model";

export type Command = (
  modelContainer: { readonly model: IModel },
  emitEvent: (ev: Events) => void
) => void;

export function startNewGame(seed: string): Command {
  return ({ model }, emitEvent) => {
    emitEvent({
      type: "INewGameStarted",
      grid: createGrid(),
      npcSpawns: [
        { x: -1, y: 0 },
        { x: 9, y: 0 },
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
    // Spawn at one of the spawn positions
    const spawnPosition =
      model.npcSpawnPositions[Math.trunc(Math.random() * model.npcSpawnPositions.length)];

    // Pick an unused house
    const unusedHouses = Array.from(enumerateUnusedHouses(model));
    if (!unusedHouses.length) {
      return;
    }

    // TODO: solve pathing
    const route = [
      spawnPosition,
      unusedHouses[Math.trunc(Math.random() * unusedHouses.length)],
    ];
    emitEvent({ type: "INpcSpawned", route });
  };
}
