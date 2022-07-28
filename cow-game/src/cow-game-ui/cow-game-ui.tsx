import { h, render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { iter } from "ts-iter";
import {
  focusOnNpc,
  spawnHorse,
  startNewGame,
} from "../cow-game-domain/cow-game-commands";
import { GameController } from "../cow-game-domain/cow-game-controller";
import {
  calculateNpcDistanceToHome,
  calculateScore,
  enumerateHabitableHouses,
} from "../cow-game-domain/cow-game-logic";
import { IModel, INpc, IPosition } from "../cow-game-domain/cow-game-model";
import { CowGameSimulation } from "../cow-game-domain/cow-game-simulation";

import "./cow-game-ui.css";
import { Modal } from "./modal";

export function CowGameUi({
  gameController,
  simulation,
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

  const gameTime = useGameTime(gameController, 1000);

  if (!model) {
    return null;
  }

  function onStartNewGame() {
    gameController.enqueueCommand(startNewGame(""));
  }

  function onClickSpawnHorse() {
    gameController.enqueueCommand(spawnHorse());
  }

  function onClickShowNpc(npcId: INpc["id"]) {
    gameController.enqueueCommand(focusOnNpc(npcId));
  }

  // TODO: move these calcs into the model
  const houses = iter(enumerateHabitableHouses(model.grid))
    .map((house) => ({
      house,
      npc: model.npcs.find((n) => n.home.x === house.x && n.home.y === house.y),
    }))
    .filter(({ npc }) => !!npc)
    .sort((a, b) =>
      a.npc!.id < b.npc!.id ? -1 : a.npc!.id > b.npc!.id ? 1 : 0
    )
    .map(({ house, npc }) => ({
      house,
      npc,
      npcWon: model.housesLost.some((l) => l.x === house.x && l.y === house.y),
      horseWon: model.housesWon.some((w) => w.x === house.x && w.y === house.y),
    }))
    .map(({ house, npc, npcWon, horseWon }) => {
      function getLabel() {
        if (npcWon) {
          return "❌";
        }
        if (horseWon) {
          return "🏆";
        }

        const mood = simulation?.getNpcMood(npc!.id) || 0;
        const emoji = npc && getMoodEmoji(mood);

        const pos = npc && simulation?.getNpcPosition(npc.id);
        const dist = pos && calculateNpcDistanceToHome(pos, house);
        const leftDashes = (dist && "-".repeat((1 - dist) * 10)) || "";
        const rightDashes = "-".repeat(10 - leftDashes.length);

        return "🚌" + leftDashes + emoji + rightDashes + "🏡";
      }

      return (
        <button key={`${npc!.id}`} onClick={() => onClickShowNpc(npc!.id)}>
          {getLabel()}
        </button>
      );
    })
    .toArray();

  const score = calculateScore(model.housesWon.length, model.horsesSpawned);

  return (
    <>
      <div class="cow-game-ui">
        <p>Score: {score}</p>
        {/* <p>Houses won: {model.housesWon.length}</p>
        <p>Houses lost: {model.housesLost.length}</p>
        <p>Houses remaining: {model.housesRemaining}</p>
        <p>Horses spawned: {model.horsesSpawned}</p>
        <button onClick={onStartNewGame}>Start new game</button> */}
      </div>
      <div class="houses-panel">{houses}</div>
      <div class="bottom-panel">
        <button onClick={onClickSpawnHorse}>HORSE ME 🐴</button>
      </div>
      <Modal hidden={model.gameState !== "gameOver"}>
        <h2>GAME OVA</h2>
        <h3>Your score: {score}</h3>
        <p>
          You won {model.housesWon.length} {"🏡".repeat(model.housesWon.length)}{" "}
          and lost {model.housesLost.length}{" "}
          {"🏡".repeat(model.housesLost.length)} houses.
        </p>
        <p>
          You spawned {model.horsesSpawned} {"🐴".repeat(model.horsesSpawned)}{" "}
          horses.
        </p>
        <button onClick={onStartNewGame}>Start new game</button>
      </Modal>
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
 * Gets an emoji to represent this NPC's curren moob.
 * @param mood The NPC's mood from 0 (happy) to 1 (MAD and also DEAD).
 * @returns An emoji as a string.
 */
function getMoodEmoji(mood: number) {
  if (mood >= 1) {
    return "😵";
  }
  const c = mood < 0 ? 0 : mood > 1 ? 1 : mood;
  const e = Emojis[Math.trunc(c * Emojis.length)];
  return e;
}
