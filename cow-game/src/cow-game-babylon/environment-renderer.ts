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

import HouseGltf from "./assets/House.glb?url";
import House2Gltf from "./assets/House2.glb?url";
import House3Gltf from "./assets/House3.glb?url";
import House4Gltf from "./assets/House4.glb?url";
import House5Gltf from "./assets/House5.glb?url";
import HouseTexture1 from "./assets/HouseTexture1.png?url";
import HouseTexture2 from "./assets/HouseTexture2.png?url";
import HouseTexture3 from "./assets/HouseTexture3.png?url";
import HouseTexture4 from "./assets/HouseTexture4.png?url";
import StreetStraightGltf from "./assets/Street_Straight.glb?url";
import { delay } from "../reusable/promise-helpers";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { positionToVector3, WorldScale } from "./babylon-helpers";

export function createEnvironmentRenderer(
  scene: Scene,
  gameController: GameController
) {
  const disposers: Disposer[] = [];

  async function loadMeshAsync(url: string) {
    const result = await SceneLoader.ImportMeshAsync("", url, "", scene);
    return result.meshes[0];
  }

  console.log("Loading house stuff...");

  delay(0).then(async () => {
    const houseMeshes: AbstractMesh[] = [];
    for (const url of [
      HouseGltf,
      // House2Gltf,
      // House3Gltf,
      // House4Gltf,
      // House5Gltf,
    ]) {
      const mesh = await loadMeshAsync(url);
      houseMeshes.push(mesh);
    }

    console.debug(`Loaded ${houseMeshes.length} house meshes.`, houseMeshes);

    var houseMaterials = await Promise.all(
      // [HouseTexture1, HouseTexture2, HouseTexture3, HouseTexture4].map(
      [HouseTexture1].map(async (url) => {
        const texture = await new Promise<Texture>((resolve, reject) => {
          const t = new Texture(
            url,
            scene,
            false,
            false,
            undefined,
            () => {
              resolve(t);
            },
            (message, ex) => {
              console.error(`Error loading texture. Message: ${message}`, ex);
              reject(ex);
            }
          );
        });
        const material = new StandardMaterial("house material", scene);
        material.diffuseTexture = texture;
        return material;
      })
    );

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

  SceneLoader.ImportMesh("", StreetStraightGltf, "", scene, (meshes) => {
    const mesh = meshes[0];
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
