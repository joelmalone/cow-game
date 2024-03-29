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
import { createRigidHorsesRenderer } from "./rigid-horses-renderer";
import { createNpcRenderer } from "./npc-renderer";
import { createCowGameAssetsManager } from "./assets-manager";
import { createGridRenderer } from "./grid-renderer";
import { INpc } from "../cow-game-domain/cow-game-model";
import { vector3ToPosition } from "./babylon-helpers";
import { CowGameSimulation } from "../cow-game-domain/cow-game-simulation";

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

  var light = new HemisphericLight("hemiLight", new Vector3(-2, 2, -1), scene);

  const gridRenderer = createGridRenderer(scene, gameController, assetsManager);

  const horseRenderer = createHorseRenderer(
    scene,
    gameController,
    assetsManager
  );
  // Use the player horse as the "ears" for spatial sound
  scene.audioListenerPositionProvider = () => {
    return horseRenderer.horseRoot.absolutePosition;
  };

  const rigidHorsesRenderer = createRigidHorsesRenderer(
    scene,
    gameController,
    assetsManager,
    horseRenderer.horseRoot
  );

  const cameraRenderer = createCameraRenderer(
    canvas,
    scene,
    gameController,
    horseRenderer.horseRoot
  );

  const npcRenderer = createNpcRenderer(scene, gameController, ground);

  const unsubscribe = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INpcFocused": {
        const npcMesh = npcRenderer.getNpc(ev.event.npcId);
        npcMesh && cameraRenderer.focusOn(npcMesh);
        break;
      }
    }
  });

  function dispose() {
    unsubscribe();
    npcRenderer.dispose();
    horseRenderer.dispose();
    gridRenderer.dispose();
    cameraRenderer.dispose();
    rigidHorsesRenderer.dispose();
    scene.dispose();
  }

  await assetsManager.readyPromise;

  const simulation: CowGameSimulation = {
    getNpcPosition: (npcId: INpc["id"]) =>
      vector3ToPosition(npcRenderer.getNpc(npcId).position),
    getNpcMood: (npcId: INpc["id"]) => npcRenderer.getBlockedFactor(npcId),
  };

  return {
    scene,
    dispose,
    simulation,
  };
}
