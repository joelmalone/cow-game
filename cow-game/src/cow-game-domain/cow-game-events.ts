import type { IModel, IPole } from './cow-game-model';

export interface INewGameStarted {
  type: 'INewGameStarted';
  seed: string;
  poles: IPole[];
}

export interface PoleBroke {
  type: 'PoleBroke';
  poleIndex: number;
}

export interface TurnEnded {
  type: 'TurnEnded';
  oldTurn: number;
  newTurn: number;
}

export type Events = INewGameStarted | PoleBroke | TurnEnded;
