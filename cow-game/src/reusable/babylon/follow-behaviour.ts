import { Scene, Vector3 } from "@babylonjs/core";

interface Options {
  /** If true, the initial distance from the follower to the followee will be maintained. In other words, it will "stay in formation." */
  useOffset: boolean;
  /** How "fast" the follower moves to the followee. There's no real intuition here, so just experiment. */
  aggressiveness: number;
}

const DefaultOptions: Options = {
  useOffset: false,
  aggressiveness: 0.5,
};

/**
 * A thing that has a position; thsi is necessary because Cameras and TransformNodes don't share a transform-like parent.
 */
export interface HasPosition {
  readonly position: Vector3;
}

/**
 * Starts an on-before-render process to have one object move towards another.
 * @param scene The scene the objects are in.
 * @param follower The object doing the following; this is the one that will be moved.
 * @param followee The object being followed, or a function to call every frame to compute the followee; return null to pause following.
 * @param options Optional optionses.
 * @returns An API for terminating the behaviour.
 */
export function startFollowBehaviour(
  scene: Scene,
  follower: HasPosition,
  followee: HasPosition | (() => HasPosition | null),
  options: Partial<Options> | null
) {
  const resolvedOptions = {
    ...DefaultOptions,
    ...options,
  };

  var offset: Vector3 | null = null;

  function onBeforeRender() {
    const resolvedFolowee =
      typeof followee === "function" ? followee() : followee;
    if (!resolvedFolowee) {
      return;
    }

    if (!offset) {
      offset = resolvedOptions.useOffset
        ? follower.position.subtract(resolvedFolowee.position)
        : Vector3.Zero();
    }

    const destination = resolvedFolowee.position.add(offset);
    const diff = destination.subtract(follower.position);
    const deltaTime = scene.deltaTime / 1000;
    if (deltaTime) {
      follower.position.addInPlace(
        diff.scale(resolvedOptions.aggressiveness * deltaTime)
      );
    }
  }

  scene.onBeforeRenderObservable.add(onBeforeRender);

  function dispose() {
    scene.onBeforeRenderObservable.removeCallback(onBeforeRender);
  }

  return {
    dispose,
  };
}
