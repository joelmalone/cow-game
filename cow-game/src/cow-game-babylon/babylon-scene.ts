import type { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { ShadowOnlyMaterial } from '@babylonjs/materials';
// Side-effects required as per https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
import "@babylonjs/core/helpers/sceneHelpers";
import '@babylonjs/core/Physics/physicsEngineComponent';

// Implement Babylon physics with Cannon
import CANNON from 'cannon';
window.CANNON = CANNON;

import type { GameController } from "../cow-game-domain/cow-game-controller";
import { createHorseRenderer } from "./horse-renderer";
import { createCameraRenderer } from "./camera-renderer";

import { createEnvironmentRenderer } from "./environment-renderer";
import { CannonJSPlugin } from "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { createRigidHorseRenderer } from "./rigid-horse-renderer";

// TODO:
// https://playground.babylonjs.com/#CSPJ7A#3

export async function createBabylonScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
  gameController: GameController
) {
  const scene = new Scene(engine);

  engine.runRenderLoop(function () {
    scene.render();
  });

  // https://doc.babylonjs.com/divingDeeper/physics/usingPhysicsEngine
  scene.enablePhysics(null, new CannonJSPlugin());

  // Create an invisible ground, but it will receive shadows
  const ground = MeshBuilder.CreateGround(
    'ground',
    { width: 1000, height: 500 },
    scene,
  );
  ground.material = new ShadowOnlyMaterial('groundMat', scene);
  ground.receiveShadows = true;
  // Add physics to the ground
  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.1 },
    scene,
  );

  createRigidHorseRenderer(scene, gameController)

  var light = new HemisphericLight("hemiLight", new Vector3(-2, 2, -1), scene);

  const arenaSize = 10;
  const cameraRenderer = createCameraRenderer(
    canvas,
    scene,
    gameController,
    arenaSize
  );

  const environmentRenderer = createEnvironmentRenderer(scene, gameController);

  const horseRenderer = createHorseRenderer(scene, gameController);

  // appBus.publish({ type: 'BabylonMapSceneReady', scene });

  function dispose() {
    // appBus.publish({ type: 'BabylonMapSceneDisposing', scene });

    horseRenderer.dispose();
    environmentRenderer.dispose();
    cameraRenderer.dispose();
    scene.dispose();
  }

  return { scene, dispose };
}
