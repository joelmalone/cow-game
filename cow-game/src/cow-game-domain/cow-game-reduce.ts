import type { Events } from './cow-game-events';
import type { IModel, IPole } from './cow-game-model';

export function reduce(model: IModel, ev: Events): IModel {
  switch (ev.type) {
    case 'INewGameStarted': {
      const { seed, poles } = ev;
      return {
        seed,
        version: 0,
        hash: computeHash(seed, 0),
        poles,
        turn: 0,
      };
    }
    case 'PoleBroke': {
      const { poleIndex } = ev;
      return {
        ...model,
        version: model.version + 1,
        hash: computeHash(model.seed, model.version + 1),
        poles: replace(model.poles, poleIndex, breakPole),
      };
    }
    case 'TurnEnded': {
      const { newTurn } = ev;
      return {
        ...model,
        version: model.version + 1,
        hash: computeHash(model.seed, model.version + 1),
        turn: newTurn,
      };
    }
  }
}

/**
 * Fast, non-secure hash from <a href="https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0">hyamamoto</a>.
 *
 * @param {*} s
 * @return {*}
 */
function hashCode(s: string) {
  for (var i = 0, h = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function computeHash(seed: string, version: number) {
  return hashCode(seed + version);
}

function replace<T>(arr: T[], index: number, replacer: (item: T) => T): T[] {
  const original = arr[index];
  const replacement = replacer(original);
  if (original === replacement) {
    return arr;
  }

  return arr.map((item, ind) => (ind === index ? replacement : item));
}

function breakPole(pole: IPole): IPole {
  return pole.state === 'broken' ? pole : { ...pole, state: 'broken' };
}
