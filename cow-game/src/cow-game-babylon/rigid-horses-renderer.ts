import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import { IPosition } from "../cow-game-domain/cow-game-model";
import { positionToVector3, vector3ToPosition } from "./babylon-helpers";
import { CowGameAssetsManager, HORSE_SCALE } from "./assets-manager";

export function createRigidHorsesRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager,
  playerRootMesh: TransformNode
) {
  const disposers: Disposer[] = [];

  // Prepare a promise of the horse mesh; we'll clone this later
  const horseTemplatePromise = assetsManager
    .loadMesh("horse")
    .then(({ loadedContainer }) => {
      return loadedContainer;
    });

  const baaPromise = assetsManager.loadSounds(
    "sheep1",
    "sheep2",
    "sheepBleet",
    "sheepHit"
  );

  const cloneParent = new TransformNode(createRigidHorsesRenderer.name);

  async function spawnRigidHorse(position: IPosition) {
    const horseTemplate = await horseTemplatePromise;
    const baaSounds = await baaPromise;

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
      { mass: 5, restitution: 0.1 },
      scene
    );
    // Add some poing
    horseRoot.physicsImpostor.applyImpulse(
      new Vector3(Math.random(), 25, Math.random()),
      horseRoot.getAbsolutePosition().addInPlaceFromFloats(0, 2.5, 0)
    );

    // Attach the visible mesh to the root
    meshClone.parent = horseRoot;
    meshClone.position.set(0, -height * 0.5, 0);

    // Attach the root to the clone bucket
    horseRoot.parent = cloneParent;

    // Attach the baaaaa
    const baaSound = baaSounds[Math.trunc(Math.random() * baaSounds.length)];
    const baaClone = baaSound.clone();
    if (baaClone) {
      baaClone.attachToMesh(horseRoot);
      baaClone.play();
    } else {
      console.warn("Unable to clone a sound.", baaSound);
    }

    disposers.push(() => {
      horseRoot.dispose();
    });
  }

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        disposers.forEach((d) => d());
        disposers.splice(0);
        break;
      }

      case "IHorseSpawned": {
        const spawnPosition = vector3ToPosition(
          playerRootMesh.getAbsolutePosition()
        );
        spawnRigidHorse(spawnPosition);
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
