import { Facings, HouseTypes, ICell, IModel, TerrainTypes } from "./cow-game-model";

export function createGrid(): IModel["grid"] {
  const width = 5;
  const height = 5;
  const cells: ICell[] = [];
  const housesPool = new Array(HouseTypes).fill(null).map((_,index)=>index)

  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      const houseType = housesPool.splice(
        Math.trunc(Math.random() * housesPool.length),
        1
      )[0];

      cells.push({
        houseType,
        houseFacing: Facings.North,
        terrainType: TerrainTypes.Grass,
        terrainFacing: Facings.North,
      })
    }
  }

  return {
    width,
    height,
    cells,
  };
}
