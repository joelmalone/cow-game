import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";

import HorseGltf from "./assets/Horse.gltf?url";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AppError } from "../reusable/app-errors";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";

export function createRigidHorseRenderer(
  scene: Scene,
  gameController: GameController
) {
  const disposers: Disposer[] = [];

  // Prepare a promise of the horse mesh; we'll clone this later
  const meshPromise = new Promise<AbstractMesh>((resolve) => {
    SceneLoader.ImportMesh(
      "",
      HorseGltf,
      "",
      scene,
      (
        meshes,
        particleSystems,
        skeletons,
        animationGroups,
        transformNodes,
        geometries,
        lights
      ) => {
        const mesh = meshes[0];

        // The horse is 5.5 units horizontally from nose to butt, so scale it down to 1
        mesh.scaling.setAll(1 / 5.5);

        mesh.setEnabled(false);

        resolve(mesh);
      }
    );
  });

  setTimeout(() => {
    setInterval(() => {
      meshPromise.then((horseTemplate) => {
        // Can't successfully clone the tamplate mesh if it's disabled, so
        // temporarily enable it. No idea how to do this better... asset
        // manager maybe?
        horseTemplate.setEnabled(true);
        const meshClone = horseTemplate.clone("rigid horse", null);
        horseTemplate.setEnabled(false);
        if (!meshClone) {
          throw new AppError("Unable to clone the mesh.");
        }

        // Get the horse mesh's bounds (including descendant meshes)
        const bounds = meshClone.getHierarchyBoundingVectors();
        const length = bounds.max.z - bounds.min.z;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;

        const box = MeshBuilder.CreateBox(
          "Horse Body",
          { size: length * 0.8, width: width * 0.8, height: height * 0.8 },
          scene
        );
        box.isVisible = false;
        box.position.set(0, 3, 0);
        box.physicsImpostor = new PhysicsImpostor(
          box,
          PhysicsImpostor.BoxImpostor,
          { mass: 1, restitution: 0.1 },
          scene
        );
        // Add some spin
        box.physicsImpostor.applyImpulse(
          new Vector3(Math.random(), 0, Math.random()),
          box.getAbsolutePosition().addInPlaceFromFloats(0, 0.5, 0)
        );

        // Attach the mesh to the root box
        meshClone.setParent(box);
        meshClone.position.set(0, -height * 0.5, 0);
      });
    }, 2500);
  }, 5000);

  // const unsubscribeEvents = gameController.subscribeEvents((ev) => {
  //   switch (ev.event.type) {
  //     case "IDestinationUpdated": {
  //       const { position } = ev.event;
  //       walkTarget = new Vector3(position.x, 0, position.y);
  //       break;
  //     }
  //   }
  // });

  function dispose() {
    disposers.forEach((d) => d());
  }

  return {
    dispose,
  };
}
