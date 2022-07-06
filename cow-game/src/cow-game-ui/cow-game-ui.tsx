import { h, render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { iter } from "ts-iter";
import {
  focusOnHouse,
  spawnHorse,
  startNewGame,
} from "../cow-game-domain/cow-game-commands";
import { GameController } from "../cow-game-domain/cow-game-controller";
import { enumerateHabitableHouses } from "../cow-game-domain/cow-game-logic";
import { IModel, IPosition } from "../cow-game-domain/cow-game-model";
import { CowGameSimulation } from "../cow-game-domain/cow-game-simulation";

import "./cow-game-ui.css";

export function CowGameUi({
  gameController,
  simulation
}: {
  gameController: GameController;
  simulation: CowGameSimulation | null;
}) {
  const [model, setModel] = useState<IModel | null>(null);

  useEffect(() => {
    const unsubscriber = gameController.subscribeEvents((ev) => {
      setModel(ev.model);
    });

    return unsubscriber;
  }, [gameController]);

  const gameTime = useGameTime(gameController, 100);

  if (!model) {
    return null;
  }

  function onStartNewGame() {
    gameController.enqueueCommand(startNewGame(""));
  }

  function onClickSpawnHorse() {
    gameController.enqueueCommand(spawnHorse());
  }

  function onClickHouseButton(housePosition: IPosition) {
    gameController.enqueueCommand(focusOnHouse(housePosition));
  }

  // TODO: move these calcs into the model
  const houses = iter(enumerateHabitableHouses(model.grid))
    .map((house) => ({
      house,
      npc: model.npcs.find((n) => n.home.x === house.x && n.home.y === house.y),
    }))
    .filter(({ npc }) => !!npc)
    .map(({ house, npc }) => ({
      house,
      npc,
      npcWon: model.housesLost.some((l) => l.x === house.x && l.y === house.y),
      horseWon: model.housesWon.some((w) => w.x === house.x && w.y === house.y),
    }))
    .map(({ house, npc, npcWon, horseWon }) => (
      <button
        key={`${house.x},${house.y}`}
        onClick={() => onClickHouseButton(house)}
      >
        🚌 &nbsp;&nbsp;&nbsp;
        {npc && simulation?.getNpcDistanceToHome(npc.id).toString() || 'huh'}
        {npc &&
          getNpcEmoji(npc.deathTime - npc.spawnTime, gameTime - npc.spawnTime)}
        &nbsp;&nbsp;&nbsp; 🏡
        {/* {npcWon && "❌"}
        {horseWon && "🏆"} */}
      </button>
    ))
    .toArray();

  return (
    <>
      <div class="cow-game-ui">
        <p>Houses won: {model.housesWon.length}</p>
        <p>Houses lost: {model.housesLost.length}</p>
        <p>Houses remaining: {model.housesRemaining}</p>
        <p>Horses spawned: {model.horsesSpawned}</p>
        <button onClick={onStartNewGame}>Start new game</button>
      </div>
      <div class="houses-panel">{houses}</div>
      <div class="bottom-panel">
        <button onClick={onClickSpawnHorse}>HORSE ME 🐴</button>
      </div>
    </>
  );
}

function useGameTime(gameController: GameController, intervalMsec: number) {
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    const unsubscribe = gameController.subscribeEvents((ev) => {
      switch (ev.event.type) {
        case "INewGameStarted": {
          setStartTime(Date.now());
        }
      }
    });
    return unsubscribe;
  }, [gameController]);

  const [time, setTime] = useState(0);

  useEffect(() => {
    const n = setInterval(() => {
      setTime(Date.now());
    }, intervalMsec);
    return () => clearInterval(n);
  }, []);

  return (time - startTime) / 1000;
}

const Emojis = Array.from("😀🙂🤨😡🤬");

/**
 * Gets an amoji to represent this NPC's lifespan.
 * @param npcLifespan The NPC's total lifespan.
 * @param elapsed The NPC's current age.
 * @returns An emoji as a string.
 */
function getNpcEmoji(npcLifespan: number, elapsed: number) {
  const t = elapsed / npcLifespan;
  if (t >= 1) {
    return "😵";
  }
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  const e = Emojis[Math.trunc(c * Emojis.length)];
  return e;
}
