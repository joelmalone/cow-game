import {
  ISceneLoaderAsyncResult,
  SceneLoader,
} from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";

import { delay } from "../reusable/promise-helpers";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { positionToVector3, WorldScale } from "./babylon-helpers";
import { CowGameAssetsManager } from "./assets-manager";

export function createEnvironmentRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];

  async function loadMeshAsync(url: string) {
    const result = await SceneLoader.ImportMeshAsync("", url, "", scene);
    return result.meshes[0];
  }

  console.log("Loading house stuff...");

  Promise.all(
    assetsManager.loadMeshes("house1", "house2", "house3", "house4", "house5")
  ).then(async (houseMeshes) => {
    console.debug(`Loaded ${houseMeshes.length} house meshes.`, houseMeshes);

    var houseTextures = await Promise.all(
      assetsManager.loadTextures("house1", "house2", "house3", "house4")
    );

    const houseMaterials = houseTextures.map((texture) => {
      const material = new StandardMaterial(texture.name, scene);
      material.diffuseTexture = texture;
      return material;
    });

    console.log("Loaded house materials.", houseMaterials);

    // TODO: remove the default shinyness
    // const material = mesh.material;
    // if (material instanceof PBRMaterial) {
    //   material.metallicF0Factor = 0;
    // }

    // TODO: clone and merge many houses. See here:
    //  https://www.html5gamedevs.com/topic/37664-load-mesh-without-rendering-it-then-adding-it-to-the-world-many-times/
    // For now, just clone.

    const houseClonesParent = new TransformNode("Houses", scene);

    // North side of the street
    for (var x = -5; x < 5; x++) {
      var mesh = houseMeshes[Math.trunc(Math.random() * houseMeshes.length)];
      const clone = mesh.clone(`House North clone ${x}`, houseClonesParent);

      if (clone) {
        clone.position = positionToVector3({ x, y: 1 });
        clone.addRotation(0, Math.PI, 0);
        // clone.scaling.setAll(10);

        const material =
          houseMaterials[Math.trunc(Math.random() * houseMaterials.length)];
        houseMeshes.forEach((mesh) => {
          mesh.getChildMeshes().forEach((m) => {
            m.material = material;
          });
        });

        disposers.push(() => clone.dispose());
      }
    }

    // South side of the street
    for (var x = -5; x < 5; x++) {
      var mesh = houseMeshes[Math.trunc(Math.random() * houseMeshes.length)];
      const clone = mesh.clone(`House South clone ${x}`, houseClonesParent);

      if (clone) {
        clone.position = positionToVector3({ x, y: -1 });
        // clone.addRotation(0, Math.PI, 0);
        // clone.scaling.setAll(10);

        const material =
          houseMaterials[Math.trunc(Math.random() * houseMaterials.length)];
        houseMeshes.forEach((mesh) => {
          mesh.getChildMeshes().forEach((m) => {
            m.material = material;
          });
        });

        disposers.push(() => clone.dispose());
      }
    }

    houseMeshes.forEach((m) => m.dispose());
  });

  console.log("Loading street pieces...");

  const streetClonesParent = new TransformNode("Street pieces");

  assetsManager.loadMesh("streetStraight").then((mesh) => {
    // The tiles are 2x2, so scalew them up to 4x4
    mesh.scaling.setAll(WorldScale / 2);

    for (var y = -0; y <= 0; y++) {
      for (var x = -10; x < 10; x++) {
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
