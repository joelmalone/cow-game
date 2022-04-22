import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import { positionToVector3, WorldScale } from "./babylon-helpers";
import { CowGameAssetsManager } from "./assets-manager";

export function createEnvironmentRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];

  console.log("Loading street pieces...");

  const streetClonesParent = new TransformNode("Street pieces");

  assetsManager.loadMesh("streetStraight").then(({ loadedMeshes: [mesh] }) => {
    // The tiles are 2x2, so scalew them up to 4x4
    mesh.scaling.setAll(WorldScale / 2);

    for (var y = -0; y <= 0; y++) {
      for (var x = -10; x < 10; x++) {
        // TODO: instantiate from the container (instead of cloning)
        const clone = mesh.clone(`Street clone ${x} ${y}`, streetClonesParent);

        if (clone) {
          clone.position = positionToVector3({ x, y }, -0.3);

          disposers.push(() => clone.dispose());
        }
      }
    }
    // mesh.position.set(0, -3, 0)
    // mesh.scaling.setAll(15);

    mesh.dispose();

    console.log("Street pieces loaded.");
  });

  const grassClonesParent = new TransformNode("Grass pieces");

  var grassMaterial = new StandardMaterial("grass material", scene);
  grassMaterial.diffuseColor = new Color3(0.25, 0.75, 0.25);
  var grassTile = MeshBuilder.CreateBox("box", {}, scene);
  grassTile.material = grassMaterial;
  grassTile.scaling.set(4, 1, 4);
  for (var y = -2; y <= 2; y++) {
    if (y == 0) {
      continue;
    }

    for (var x = -10; x < 10; x++) {
      // TODO: instantiate from the container (instead of cloning)
      const clone = grassTile.clone(`Grass clone ${x} ${y}`, grassClonesParent);

      if (clone) {
        clone.position = positionToVector3({ x, y }, -0.5);
        // clone.scaling.setAll(2);

        disposers.push(() => clone.dispose());
      }
    }
  }
  grassTile.dispose();

  function dispose() {
    disposers.forEach((d) => d());
  }

  return {
    dispose,
  };
}
