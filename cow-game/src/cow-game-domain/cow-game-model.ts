export interface IPosition {
  x: number;
  y: number;
}

export interface IPole {
  id: number;
  position: IPosition;
  state: 'closed' | 'broken';
  edges: IPole[];
}

export interface IModel {
  seed: string;
  version: number;
  hash: number;
  poles: IPole[];
  turn: number;
}

// export type Command = (model: IModel) => IModel;

// function createNewGame(seed: string): Command {
//   return (model) => {
//     const poles = [1, 2, 3, 4, 5]
//       .flatMap((x) => [1, 2, 3, 4, 5].map((y) => ({ x, y })))
//       .map<IPole>((position) => ({
//         position,
//         state: 'closed',
//         edges: [],
//       }));

//     return {
//       seed,
//       version: 0,
//       hash: computeHash(seed, 0),
//       poles,
//       turn: 0,
//     };
//   };
// }

// /**
//  * Fast, non-secure hash from <a href="https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0">hyamamoto</a>.
//  *
//  * @param {*} s
//  * @return {*}
//  */
// function hashCode(s: string) {
//   for (var i = 0, h = 0; i < s.length; i++)
//     h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
//   return h;
// }

// function computeHash(seed: string, version: number) {
//   return hashCode(seed + version);
// }

// function replace<T>(arr: T[], index: number, replacer: (item: T) => T): T[] {
//   const original = arr[index];
//   const replacement = replacer(original);
//   if (original === replacement) {
//     return arr;
//   }

//   return arr.map((item, ind) => (ind === index ? replacement : item));
// }

// function breakPole(pole: IPole): IPole {
//   return pole.state === 'broken' ? pole : { ...pole, state: 'broken' };
// }

// function breakARandomPole(model: IModel): Command {
//   return (model) => {
//     const i = model.hash % model.poles.length;

//     return {
//       ...model,
//       poles: replace(model.poles, i, breakPole),
//     };
//   };
// }

// function endTurn(model: IModel): Command {
//   return (model) => {
//     return {
//       ...model,
//       turn: model.turn + 1,
//     };
//   };
// }
