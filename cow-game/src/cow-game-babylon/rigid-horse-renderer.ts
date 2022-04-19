import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";

import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AppError } from "../reusable/app-errors";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { Node } from "@babylonjs/core/node";
import { IPosition } from "../cow-game-domain/cow-game-model";
import { positionToVector3 } from "./babylon-helpers";
import { CowGameAssetsManager, HORSE_SCALE } from "./assets-manager";

export function createRigidHorseRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];

  // Prepare a promise of the horse mesh; we'll clone this later
  const horseTemplatePromise = assetsManager
    .loadMesh("horse")
    .then(({ loadedContainer }) => {
      return loadedContainer;
    });

  const cloneParent = new TransformNode(createRigidHorseRenderer.name);

  async function spawnHorse(position: IPosition) {
    const horseTemplate = await horseTemplatePromise;

    const instantiated = horseTemplate.instantiateModelsToScene();

    const meshClone = instantiated.rootNodes[0];
    meshClone.name = "Rigid horse";
    // The horse mesh is 5.5 units horizontally from nose to butt, so scale it down to 1
    meshClone.scaling.setAll(HORSE_SCALE);

    // Get the horse mesh's bounds (including descendant meshes)
    const bounds = meshClone.getHierarchyBoundingVectors();
    const length = bounds.max.z - bounds.min.z;
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;

    const horseRoot = MeshBuilder.CreateBox(
      "Horse Body",
      { size: length * 0.8, width: width * 0.8, height: height * 0.8 },
      scene
    );
    horseRoot.isVisible = false;
    horseRoot.position = positionToVector3(position, height * 1.5);
    horseRoot.physicsImpostor = new PhysicsImpostor(
      horseRoot,
      PhysicsImpostor.BoxImpostor,
      { mass: 1, restitution: 0.1 },
      scene
    );
    // Add some poing
    horseRoot.physicsImpostor.applyImpulse(
      new Vector3(Math.random(), 5, Math.random()),
      horseRoot.getAbsolutePosition().addInPlaceFromFloats(0, 0.5, 0)
    );

    // Attach the visible mesh to the root
    meshClone.parent = horseRoot;
    meshClone.position.set(0, -height * 0.5, 0);

    // Attach the root to the clone bucket
    horseRoot.parent = cloneParent;
  }

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "IHorseSpawned": {
        const { spawnPosition } = ev.event;
        spawnHorse(spawnPosition);
        break;
      }
    }
  });

  function dispose() {
    unsubscribeEvents();
    disposers.forEach((d) => d());
  }

  return {
    dispose,
  };
}
