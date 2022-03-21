import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";

import HouseGltf from "./assets/House.glb?url";
import StreetStraightGltf from "./assets/Street_Straight.glb?url";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";

export function createEnvironmentRenderer(
  scene: Scene,
  gameController: GameController
) {
  const disposers: Disposer[] = [];

  SceneLoader.ImportMesh(
    "",
    HouseGltf,
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

      // TODO: remove the default shinyness
      // const material = mesh.material;
      // if (material instanceof PBRMaterial) {
      //   material.metallicF0Factor = 0;
      // }

      // TODO: clone and merge many houses. See here:
      //  https://www.html5gamedevs.com/topic/37664-load-mesh-without-rendering-it-then-adding-it-to-the-world-many-times/
      // For now, just clone.

      // North side of the street
      for (var x = -5; x < 5; x++) {
        const clone = mesh.clone(`House North clone ${x}`, null);

        if (clone) {
          clone.position.set(x * 20, 0, 20);
          // clone.addRotation(0, 0, 0);
          clone.scaling.setAll(10);

          disposers.push(() => clone.dispose());
        }
      }

      // South side of the street
      for (var x = -5; x < 5; x++) {
        const clone = mesh.clone(`House South clone ${x}`, null);

        if (clone) {
          clone.position.set(x * 20, 0, -20);
          clone.addRotation(0, Math.PI, 0);
          clone.scaling.setAll(10);

          disposers.push(() => clone.dispose());
        }
      }

      mesh.dispose();
    },
    function () {}
  );

  SceneLoader.ImportMesh(
    "",
    StreetStraightGltf,
    "",
    scene,
    (meshes) => {
      const mesh = meshes[0];

      // South side of the street
      for (var y = -1; y <= 1; y++) {
        for (var x = -5; x < 5; x++) {
          const clone = mesh.clone(`Street clone ${x} ${y}`, null);

          if (clone) {
            clone.position.set(x * 30, -3, y * 30);
            clone.scaling.setAll(15);

            disposers.push(() => clone.dispose());
          }
        }
      }
      // mesh.position.set(0, -3, 0)
      // mesh.scaling.setAll(15);

      mesh.dispose();
    },
    function () {}
  );

  function dispose() {
    disposers.forEach((d) => d());
  }

  return {
    dispose,
  };
}
