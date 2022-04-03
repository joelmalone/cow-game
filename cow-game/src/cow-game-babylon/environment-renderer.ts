import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";

import HouseGltf from "./assets/House.glb?url";
import House2Gltf from "./assets/House2.glb?url";
import House3Gltf from "./assets/House3.glb?url";
import House4Gltf from "./assets/House4.glb?url";
import House5Gltf from "./assets/House5.glb?url";
import HouseTexture3 from "./assets/HouseTexture3.png?url";
import StreetStraightGltf from "./assets/Street_Straight.glb?url";

export function createEnvironmentRenderer(
  scene: Scene,
  gameController: GameController
) {
  const disposers: Disposer[] = [];

  function loadMeshAsync(url: string) {
    return SceneLoader.ImportMeshAsync("", url, "", scene);
  }

  Promise.all(
    [HouseGltf, House2Gltf, House3Gltf, House4Gltf, House5Gltf].map(
      loadMeshAsync
    )
  ).then(async (resultses) => {
    const meshes = resultses.map((r) => r.meshes[0]);

    console.debug(`${meshes.length} house meshes loaded.`, meshes);

    const texture = await new Promise<Texture>((resolve, reject) => {
      const t = new Texture(
        HouseTexture3,
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
    var houseMaterial = new StandardMaterial("house material", scene);
    houseMaterial.diffuseTexture = texture;
    meshes.forEach((mesh) => {
      mesh.getChildMeshes().forEach((m) => {
        m.material = houseMaterial;
      });
    });

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
      var mesh = meshes[Math.trunc(Math.random() * meshes.length)];
      const clone = mesh.clone(`House North clone ${x}`, null);

      if (clone) {
        clone.position.set(x * 4, 0, 4);
        clone.addRotation(0, Math.PI, 0);
        // clone.scaling.setAll(10);

        disposers.push(() => clone.dispose());
      }
    }

    // South side of the street
    for (var x = -5; x < 5; x++) {
      var mesh = meshes[Math.trunc(Math.random() * meshes.length)];
      const clone = mesh.clone(`House South clone ${x}`, null);

      if (clone) {
        clone.position.set(x * 4, 0, -4);
        // clone.addRotation(0, Math.PI, 0);
        // clone.scaling.setAll(10);

        disposers.push(() => clone.dispose());
      }
    }

    meshes.forEach((m) => m.dispose());
  });

  // SceneLoader.ImportMesh(
  //   "",
  //   HouseGltf,
  //   "",
  //   scene,
  //   (
  //     meshes,
  //     particleSystems,
  //     skeletons,
  //     animationGroups,
  //     transformNodes,
  //     geometries,
  //     lights
  //   ) => {
  //     const mesh = meshes[0];

  //     // TODO: remove the default shinyness
  //     // const material = mesh.material;
  //     // if (material instanceof PBRMaterial) {
  //     //   material.metallicF0Factor = 0;
  //     // }

  //     // TODO: clone and merge many houses. See here:
  //     //  https://www.html5gamedevs.com/topic/37664-load-mesh-without-rendering-it-then-adding-it-to-the-world-many-times/
  //     // For now, just clone.

  //     // North side of the street
  //     for (var x = -5; x < 5; x++) {
  //       const clone = mesh.clone(`House North clone ${x}`, null);

  //       if (clone) {
  //         clone.position.set(x * 20, 0, 20);
  //         // clone.addRotation(0, 0, 0);
  //         clone.scaling.setAll(10);

  //         disposers.push(() => clone.dispose());
  //       }
  //     }

  //     // South side of the street
  //     for (var x = -5; x < 5; x++) {
  //       const clone = mesh.clone(`House South clone ${x}`, null);

  //       if (clone) {
  //         clone.position.set(x * 20, 0, -20);
  //         clone.addRotation(0, Math.PI, 0);
  //         clone.scaling.setAll(10);

  //         disposers.push(() => clone.dispose());
  //       }
  //     }

  //     mesh.dispose();
  //   },
  //   function () {}
  // );

  SceneLoader.ImportMesh(
    "",
    StreetStraightGltf,
    "",
    scene,
    (meshes) => {
      const mesh = meshes[0];
      mesh.scaling.setAll(2);

      for (var y = -0; y <= 0; y++) {
        for (var x = -10; x < 10; x++) {
          const clone = mesh.clone(`Street clone ${x} ${y}`, null);

          if (clone) {
            clone.position.set(x * 4, -0.3, y * 4);

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
      const clone = grassTile.clone(`Grass clone ${x} ${y}`, null);

      if (clone) {
        clone.position.set(x * 4, -0.5, y * 4);
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
