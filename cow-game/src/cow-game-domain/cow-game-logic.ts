import {
  Facings,
  HouseTypes,
  ICell,
  IModel,
  TerrainTypes,
} from "./cow-game-model";

export function createGrid(): IModel["grid"] {
  const width = 10;
  const height = 10;
  const cells: ICell[] = [];
  const housesPool = new Array(HouseTypes).fill(null).map((_, index) => index);

  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      if (x % 3 == 0 || y % 3 == 0) {
        // Street

        const isNorthSouth = x % 3 == 0;
        const isEastWest = y % 3 == 0;

        cells.push({
          house: null,
          terrainType:
            isNorthSouth && isEastWest
              ? TerrainTypes.Street_4Way
              : TerrainTypes.Street_Straight,
          terrainFacing: isNorthSouth ? Facings.North : Facings.East,
        });
      } else {
        // House on grass
        const houseType = housesPool.length
          ? housesPool.splice(
              Math.trunc(Math.random() * housesPool.length),
              1
            )[0]
          : null;

        cells.push({
          house: houseType
            ? {
                houseType,
                houseFacing: Facings.South,
              }
            : null,
          terrainType: TerrainTypes.Grass,
          terrainFacing: Facings.North,
        });
      }
    }
  }

  return {
    width,
    height,
    cells,
  };
}
