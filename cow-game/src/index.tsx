import { h, render } from 'preact';
import 'preact/devtools';
import { Engine } from '@babylonjs/core/Engines/engine';

// Side-effects required as per https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Meshes/meshBuilder';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import BabylonEngine from './reusable/babylon/preact-babylon-engine/BabylonEngine';
import './index.css';
import { createBabylonScene } from './cow-game-babylon/babylon-scene';
import {
  breakARandomPole,
  startNewGame,
} from './cow-game-domain/cow-game-commands';
import { delay } from './reusable/promise-helpers';
import { createGameController } from './cow-game-domain/cow-game-controller';

const controller = createGameController();

const createBabylonEngine = async (canvas: HTMLCanvasElement) => {
  const engine = new Engine(canvas, true);

  const disposableScene = await createBabylonScene(engine, canvas, controller);

  playFakeCommands();

  const wany = window as any;
  wany.hax = {
    ...wany.hax,
    debug: () => (disposableScene.scene as any).debugLayer.show(),
  };

  function dispose() {
    disposableScene.dispose();
    engine.dispose();
  }
  return { engine, dispose };
};

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found.');
}
render(<BabylonEngine engineFactory={createBabylonEngine} />, root);

async function playFakeCommands() {
  controller.enqueueCommand(startNewGame('abc'));
  await delay(500);
  controller.enqueueCommand(breakARandomPole());
  await delay(500);
  controller.enqueueCommand(breakARandomPole());
  await delay(500);
  controller.enqueueCommand(breakARandomPole());
  await delay(500);
  controller.enqueueCommand(breakARandomPole());
  await delay(500);
}
