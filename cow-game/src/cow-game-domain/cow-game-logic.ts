import {
  Facings,
  HouseTypesCount,
  ICell,
  IModel,
  TerrainTypes,
} from "./cow-game-model";

export function createGrid(): IModel["grid"] {
  const width = 10;
  const height = 10;
  const cells: ICell[] = [];

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
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
          terrainFacing: isNorthSouth ? Facings.East : Facings.North,
        });
      } else {
        // House on grass

        const houseType = Math.trunc(Math.random() * HouseTypesCount);
        const houseFacing =
          y % 3 == 1 ? Facings.South : x % 3 == 1 ? Facings.West : Facings.East;

        cells.push({
          house: houseType
            ? {
                houseType,
                houseFacing,
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
