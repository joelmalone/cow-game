import type { Events } from "./cow-game-events";
import { createGrid } from "./cow-game-logic";
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
    const spawnWest = Math.random() < 0.5;
    const spawnAddress = {
      x: spawnWest ? -5 : 5,
      y: 0,
    };
    const houseAddress = {
      x: Math.trunc(Math.random() * 5) * (spawnWest ? 1 : -1),
      y: Math.random() < 0.5 ? -1 : 1,
    };
    const route = [
      spawnAddress,
      { x: houseAddress.x, y: spawnAddress.y },
      houseAddress,
    ];
    emitEvent({ type: "INpcSpawned", route });
  };
}
