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
import { createGameController } from './cow-game-domain/cow-game-controller';

const controller = createGameController();

async function createBabylonEngine(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);

  const disposableScene = await createBabylonScene(engine, canvas, controller);

  const wany = window as any;
  wany.hax = {
    ...wany.hax,
    debug: () => (disposableScene.scene as any).debugLayer.show(),
  };

  // Can press ` to open the Babylon inspector
  canvas.addEventListener('keyup', ev=>{
    debugger
    if(ev.key === '`'){
      (disposableScene.scene as any).debugLayer.show()
    }
  })

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
