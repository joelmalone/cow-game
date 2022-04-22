import type { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ShadowOnlyMaterial } from "@babylonjs/materials";
import { CannonJSPlugin } from "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
// Side-effects required as per https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
import "@babylonjs/core/helpers/sceneHelpers";
import "@babylonjs/core/Physics/physicsEngineComponent";

// Implement Babylon physics with Cannon
import CANNON from "cannon";
window.CANNON = CANNON;

import type { GameController } from "../cow-game-domain/cow-game-controller";
import { createHorseRenderer } from "./horse-renderer";
import { createCameraRenderer } from "./camera-renderer";
import { createEnvironmentRenderer } from "./environment-renderer";
import { createRigidHorseRenderer as createRigidHorsesRenderer } from "./rigid-horses-renderer";
import { createNpcRenderer } from "./npc-renderer";
import { createCowGameAssetsManager } from "./assets-manager";
import { createHouseRenderer } from "./house-renderer";

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

  const assetsManager = createCowGameAssetsManager(scene);

  // Create an invisible ground, but it will receive shadows
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 1000, height: 500 },
    scene
  );
  ground.material = new ShadowOnlyMaterial("groundMat", scene);
  ground.receiveShadows = true;
  // Add physics to the ground
  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.1 },
    scene
  );

  createRigidHorsesRenderer(scene, gameController, assetsManager);

  var light = new HemisphericLight("hemiLight", new Vector3(-2, 2, -1), scene);

  const cameraRenderer = createCameraRenderer(canvas, scene, gameController);

  const environmentRenderer = createEnvironmentRenderer(
    scene,
    gameController,
    assetsManager
  );
  const houseRenderer = createHouseRenderer(
    scene,
    gameController,
    assetsManager
  );
  const horseRenderer = createHorseRenderer(
    scene,
    gameController,
    assetsManager
  );
  const npcRenderer = createNpcRenderer(scene, gameController, ground);

  function dispose() {
    npcRenderer.dispose();
    horseRenderer.dispose();
    houseRenderer.dispose();
    environmentRenderer.dispose();
    cameraRenderer.dispose();
    scene.dispose();
  }

  return { scene, dispose };
}
