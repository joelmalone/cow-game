import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { ICameraInput } from '@babylonjs/core/Cameras/cameraInputsManager';
import type { Nullable } from '@babylonjs/core/types';
import type { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';

const InputState = {
  up: false,
  right: false,
  down: false,
  left: false,
  in: false,
  out: false,
  boost1: false,
  boost2: false,
};

const InputMapping = new Map<string, keyof typeof InputState>([
  ['w', 'up'],
  ['a', 'left'],
  ['s', 'down'],
  ['d', 'right'],
  ['r', 'in'],
  ['f', 'out'],
  ['shift', 'boost1'],
  ['control', 'boost2'],
]);

const InputAppliers: {
  [key in keyof typeof InputState]: (
    position: Vector3,
    boostFactor: number,
  ) => void;
} = {
  up: (p) => p.addInPlace(Vector3.Up()),
  right: (p) => p.addInPlace(Vector3.Right()),
  down: (p) => p.addInPlace(Vector3.Down()),
  left: (p) => p.addInPlace(Vector3.Left()),
  in: (p) => p.addInPlace(Vector3.Forward()),
  out: (p) => p.addInPlace(Vector3.Backward()),
  boost1: (p, boostFactor) => p.scaleInPlace(boostFactor),
  boost2: (p, boostFactor) => p.scaleInPlace(boostFactor),
};

export class TopDownCameraInput implements ICameraInput<FreeCamera> {
  speed: number = 10;
  boostFactor: number = 5;

  camera: Nullable<FreeCamera> = null;

  getClassName(): string {
    return TopDownCameraInput.name;
  }

  getSimpleName(): string {
    return 'topDown';
  }

  private getThings() {
    if (!this.camera) {
      throw new Error('this.camera is null.');
    }
    var engine = this.camera.getEngine();
    var element = engine.getInputElement();
    if (!element) {
      throw new Error('engine.getInputElement() returned null.');
    }
    return { camera: this.camera, engine, element };
  }

  attachControl(noPreventDefault?: boolean): void {
    const { element } = this.getThings();

    element.addEventListener('keydown', this._onKeyDown, false);
    element.addEventListener('keyup', this._onKeyUp, false);
  }

  private _onKeyDown(ev: KeyboardEvent) {
    const key = InputMapping.get(ev.key.toLowerCase());
    if (key) {
      InputState[key] = true;
    }
  }

  private _onKeyUp(ev: KeyboardEvent) {
    const key = InputMapping.get(ev.key.toLowerCase());
    if (key) {
      InputState[key] = false;
    }
  }

  detachControl(): void {
    const { element } = this.getThings();

    element.removeEventListener('keydown', this._onKeyDown);
    element.removeEventListener('keyup', this._onKeyUp);
  }

  checkInputs() {
    if (!this.camera) {
      return;
    }

    var translate: Vector3 | null = null;
    for (const key of Object.getOwnPropertyNames(
      InputState,
    ) as (keyof typeof InputState)[]) {
      if (InputState[key]) {
        const applyInput = InputAppliers[key];
        applyInput((translate = translate || new Vector3()), this.boostFactor);
      }
    }

    if (translate && !translate?.equalsToFloats(0, 0, 0)) {
      const translateWorld = this.camera.getDirection(translate);
      const deltaTime = this.camera.getEngine().getDeltaTime();
      this.camera?.position.addInPlace(
        translateWorld.scaleInPlace((this.speed * deltaTime) / 1000),
      );
    }
  }
}
