import { Scene, Vector3 } from "@babylonjs/core";

interface Options {
  /** If true, the initial distance from the follower to the followee will be maintained. In other words, it will "stay in formation." */
  useOffset: boolean;
  /** Allows the caller to pause the follow behaviour on a frame-by-frame basis. */
  isPaused: (() => boolean) | null;
  /** How "fast" the follower moves to the followee. There's no real intuition here, so just experiment. */
  aggressiveness: number;
}

const DefaultOptions: Options = {
  useOffset: false,
  isPaused: null,
  aggressiveness: 0.5,
};

/**
 * A thing that has a position; thsi is necessary because Cameras and TransformNodes don't share a transform-like parent.
 */
interface HasPosition {
  readonly position: Vector3;
}

/**
 * Starts an on-before-render process to have one object move towards another.
 * @param scene The scene the objects are in.
 * @param follower The object doing the following; this is the one that will be moved.
 * @param followee The object being followed.
 * @param options Optional optionses.
 * @returns An API for terminating the behaviour.
 */
export function startFollowBehaviour(
  scene: Scene,
  follower: HasPosition,
  followee: HasPosition,
  options: Partial<Options> | null
) {
  const resolvedOptions = {
    ...DefaultOptions,
    ...options,
  };

  const offset = resolvedOptions.useOffset
    ? follower.position.subtract(followee.position)
    : Vector3.Zero();

  function onBeforeRender() {
    if (resolvedOptions.isPaused && resolvedOptions.isPaused()) return;

    const destination = followee.position.add(offset);
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
