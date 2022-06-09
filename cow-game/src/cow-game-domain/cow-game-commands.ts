import { iter } from "ts-iter";

import { AppError } from "../reusable/app-errors";
import { shuffleArrayInPlace } from "../reusable/array-helpers";
import type { Events, INewGameStarted } from "./cow-game-events";
import {
  createGrid,
  enumerateHabitableHouses,
  findPath,
  GameParams,
  generateNpcs,
} from "./cow-game-logic";
import type { IModel, INpc, IPosition, Tappable } from "./cow-game-model";

export type Command = (
  modelContainer: { readonly model: IModel },
  emitEvent: (ev: Events) => void
) => void;

export function startNewGame(seed: string): Command {
  const grid = createGrid();

  const unusedHouses = Array.from(enumerateHabitableHouses(grid));
  if (unusedHouses.length < GameParams.npcsToSpawn) {
    throw new AppError("There are less houses on the grid than NPCs to spawn.");
  }
  shuffleArrayInPlace(unusedHouses);

  const npcSpawnpoints = [
    { x: -1, y: 0 },
    { x: 3, y: -1 },
    { x: -1, y: 3 },
  ];

  const npcsToSpawn = iter(generateNpcs(grid, unusedHouses, npcSpawnpoints))
    .take(GameParams.npcsToSpawn)
    .toArray();

  return ({ model }, emitEvent) => {
    emitEvent({
      type: "INewGameStarted",
      npcLifespan: 60,
      grid,
      playerSpawn: { x: 3, y: 3 },
      npcsToSpawn,
    });
  };
}

export function tap(tappable: Tappable, position: IPosition): Command {
  return function tap({ model }, emitEvent) {
    switch (tappable) {
      case "terrain": {
        emitEvent({ type: "IDestinationUpdated", position });
        break;
      }
    }
  };
}

export function spawnHorse(): Command {
  return function tap({ model }, emitEvent) {
    emitEvent({ type: "IHorseSpawned" });
  };
}

export function spawnNpc(): Command {
  return function spawnNpc({ model }, emitEvent) {
    if (model.npcsToSpawn.length === 0) {
      throw new AppError("There are no more NPCs left to spawn!");
    }
    const npc = model.npcsToSpawn[0];

    emitEvent({
      type: "INpcSpawned",
      npc,
    });
  };
}

export function notifyNpcArrivedAtHome(npcId: number): Command {
  return function notifyNpcArrivedAtHome({ model }, emitEvent) {
    const npc = model.npcs[npcId];
    if (!npc) {
      throw new AppError("Invalid NPC ID.");
    }

    emitEvent({ type: "INpcArrivedAtHome", npc });
  };
}

export function notifyNpcExploded(npcId: number): Command {
  return function notifyNpcExploded({ model }, emitEvent) {
    const npc = model.npcs[npcId];
    if (!npc) {
      throw new AppError("Invalid NPC ID.");
    }

    emitEvent({ type: "INpcExploded", npc });
  };
}
