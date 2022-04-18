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
import { CowGameAssetsManager } from "./assets-manager";

export function createRigidHorseRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];

  // Prepare a promise of the horse mesh; we'll clone this later
  const horseMeshPromise = assetsManager.loadMesh("horse").then((mesh) => {
    // The horse is 5.5 units horizontally from nose to butt, so scale it down to 1
    mesh.scaling.setAll(1 / 5.5);

    mesh.setEnabled(false);

    return mesh;
  });

  const cloneParent = new TransformNode(createRigidHorseRenderer.name);

  async function spawnHorse(position: IPosition) {
    const horseTemplate = await horseMeshPromise;

    function cloneHorseMesh(parent: Node) {
      // Can't successfully clone the template mesh if it's disabled, so
      // temporarily enable it. No idea how to do this better... asset
      // manager maybe?
      horseTemplate.setEnabled(true);
      const clone = horseTemplate.clone("rigid horse", parent);
      horseTemplate.setEnabled(false);

      if (!clone) {
        throw new AppError("Unable to clone the mesh.");
      }

      return clone;
    }

    // Get the horse mesh's bounds (including descendant meshes)
    const bounds = horseTemplate.getHierarchyBoundingVectors();
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

    const meshClone = cloneHorseMesh(horseRoot);
    meshClone.position.set(0, -height * 0.5, 0);

    horseRoot.setParent(cloneParent);
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
