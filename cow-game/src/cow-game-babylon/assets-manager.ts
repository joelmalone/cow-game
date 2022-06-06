import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import {
  AssetsManager,
  ContainerAssetTask,
} from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import { Sound } from "@babylonjs/core/Audio/sound";

import { AppError } from "../reusable/app-errors";

import House1Url from "./assets/House.glb?url";
import House2Url from "./assets/House2.glb?url";
import House3Url from "./assets/House3.glb?url";
import House4Url from "./assets/House4.glb?url";
import House5Url from "./assets/House5.glb?url";
import StreetstraightUrl from "./assets/Street_Straight.glb?url";
import Street4wayUrl from "./assets/Street_4Way.glb?url";
import HorseUrl from "./assets/Horse.gltf?url";

export const MeshAssets = {
  house1: House1Url,
  house2: House2Url,
  house3: House3Url,
  house4: House4Url,
  house5: House5Url,
  streetStraight: StreetstraightUrl,
  street4Way: Street4wayUrl,
  horse: HorseUrl,
};

// TODO: needing to expose this probably means we should handle post-processing in the asset manager
/** The scale to apply to the loaded horse mesh. */
export const HORSE_SCALE = 1 / 5.5;

/** The scale to apply to the loaded house meshes. */
export const HOUSE_SCALE = 3 / 2;

/**
 * The hitbox of the horse, based on the scaled-down mesh dimensions.
 */
export const HORSE_DIMENSIONS = {
  length: 1, //1.0320208163484352,
  width: 0.25, //0.25662463042646877,
  height: 1, //0.8770817127699162
};

import House1TextureURL from "./assets/HouseTexture1.png?url";
import House2TextureURL from "./assets/HouseTexture2.png?url";
import House3TextureURL from "./assets/HouseTexture3.png?url";
import House4TextureURL from "./assets/HouseTexture4.png?url";

export const TextureAssets = {
  house1: House1TextureURL,
  house2: House2TextureURL,
  house3: House3TextureURL,
  house4: House4TextureURL,
};

import Sheep1URL from "./assets/sheep1.flac?url";
import Sheep2URL from "./assets/sheep2.flac?url";
import SheepBleetURL from "./assets/sheepBleet.flac?url";
import SheepHitURL from "./assets/sheepHit.flac?url";

export const SoundAssets = {
  sheep1: Sheep1URL,
  sheep2: Sheep2URL,
  sheepBleet: SheepBleetURL,
  sheepHit: SheepHitURL,
};

export type CowGameAssetsManager = ReturnType<
  typeof createCowGameAssetsManager
>;

export type LoadMeshResult = Pick<
  ContainerAssetTask,
  | "loadedContainer"
  | "loadedMeshes"
  | "loadedParticleSystems"
  | "loadedSkeletons"
  | "loadedAnimationGroups"
>;

// TODO: look into loading assets into an AssetContainer and then providing a
// method to instantiate them into a scene:
// https://doc.babylonjs.com/divingDeeper/importers/assetContainers

// TODO: implement a custom container-based task as per
// https://playground.babylonjs.com/#ZQPDEF#18

export function createCowGameAssetsManager(scene: Scene) {
  const start = Date.now();
  var disposed = false;
  var assetsManager = new AssetsManager(scene);

  console.log("Full assets list.", { MeshAssets, TextureAssets });

  const meshes = new Map<keyof typeof MeshAssets, Promise<LoadMeshResult>>();
  for (const key in MeshAssets) {
    const url = MeshAssets[key as keyof typeof MeshAssets];

    const promise = new Promise<LoadMeshResult>((resolve, reject) => {
      const task = assetsManager.addContainerTask(
        `Load mesh ${key}`,
        null,
        url,
        ""
      );
      task.onError = (t, err) => {
        if (!disposed) {
          reject(err);
        }
      };
      task.onSuccess = (t) => {
        if (!disposed) {
          resolve(t);
        }
      };
    });

    meshes.set(key as any, promise);
  }

  function loadMeshes(
    ...assets: (keyof typeof MeshAssets)[]
  ): Promise<LoadMeshResult>[] {
    return assets.map((asset) => {
      const result = meshes.get(asset);
      if (!result) {
        throw new AppError("The asset was not found.");
      }

      return result;
    });
  }

  const textures = new Map<keyof typeof TextureAssets, Promise<Texture>>();
  for (const key in TextureAssets) {
    const url = TextureAssets[key as keyof typeof TextureAssets];

    const promise = new Promise<Texture>((resolve, reject) => {
      const task = assetsManager.addTextureTask(
        `Load texture ${key}`,
        url,
        undefined,
        false
      );
      task.onError = (t, err) => {
        if (!disposed) {
          reject(err);
        }
      };
      task.onSuccess = (t) => {
        if (!disposed) {
          resolve(t.texture);
        }
      };
    });

    textures.set(key as any, promise);
  }

  function loadTextures(
    ...assets: (keyof typeof TextureAssets)[]
  ): Promise<Texture>[] {
    return assets.map((asset) => {
      const result = textures.get(asset);
      if (!result) {
        throw new AppError("The asset was not found.");
      }

      return result;
    });
  }

  const sounds = new Map<keyof typeof SoundAssets, Promise<Sound>>();
  for (const key in SoundAssets) {
    const url = SoundAssets[key as keyof typeof SoundAssets];

    const promise = new Promise<Sound>((resolve, reject) => {
      const task = assetsManager.addBinaryFileTask(`Load sound ${key}`, url);
      task.onError = (t, err) => {
        if (!disposed) {
          reject(err);
        }
      };
      task.onSuccess = (t) => {
        if (!disposed) {
          new Sound(key, t.data, undefined, function r(this: Sound) {
            resolve(this);
          },{
            spatialSound: true,
          });
        }
      };
    });

    sounds.set(key as any, promise);
  }

  function loadSounds(
    ...assets: (keyof typeof SoundAssets)[]
  ): Promise<Sound>[] {
    return assets.map((asset) => {
      const result = sounds.get(asset);
      if (!result) {
        throw new AppError("The asset was not found.");
      }

      return result;
    });
  }

  function dispose() {
    disposed = true;
    assetsManager.reset();
  }

  assetsManager.onFinish = (tasks) => {
    const msec = Date.now() - start;
    console.debug(`Finished loading ${tasks.length} assets in ${msec} msec.`);
  };

  const readyPromise = assetsManager.loadAsync();

  return {
    readyPromise,
    loadMeshes,
    loadMesh: (asset: keyof typeof MeshAssets) => loadMeshes(asset)[0],
    loadTextures,
    loadTexture: (asset: keyof typeof TextureAssets) => loadTextures(asset)[0],
    loadSounds,
    loadSound: (asset: keyof typeof SoundAssets) => loadSounds(asset)[0],
    dispose,
  };
}
