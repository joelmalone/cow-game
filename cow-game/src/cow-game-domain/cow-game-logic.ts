import { AppError } from "../reusable/app-errors";
import { shuffleArrayInPlace } from "../reusable/array-helpers";
import {
  Facings,
  HouseTypesCount,
  ICell,
  IModel,
  INpc,
  IPosition,
  TerrainTypes,
} from "./cow-game-model";

export const GameParams = {
  npcsToSpawn: 5,
  npcLifespan: 10,
  npcSpawnInterval: 1,
};

export function createGrid(): IModel["grid"] {
  const width = 7;
  const height = 7;
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

export function* enumerateHabitableHouses(grid: IModel["grid"]) {
  for (var y = 0; y < grid.height; y++) {
    for (var x = 0; x < grid.width; x++) {
      const isHouse = grid.cells[y * grid.width + x].house;
      if (isHouse) {
        yield { x, y };
      }
    }
  }
}

export function* generateNpcs(
  grid: IModel["grid"],
  homes: IPosition[],
  spawnpoints: IPosition[]
): IterableIterator<INpc> {
  for (var i = 0; i < homes.length; i++) {
    const spawn = spawnpoints[i % spawnpoints.length];
    const home = homes[i];
    const route = findPath(grid, spawn, home);
    const spawnTime = (i + 1) * GameParams.npcSpawnInterval;
    yield {
      id: i,
      home,
      spawn,
      route,
      spawnTime,
      deathTime: spawnTime + GameParams.npcLifespan,
    };
  }
}

export function findPath(
  grid: IModel["grid"],
  start: IPosition,
  destination: IPosition
): IPosition[] {
  interface Edge {
    prev: Edge;
    to: IPosition;
    totalCost: number;
  }

  function* iteratePossibleEdges(position: IPosition) {
    for (const p of [
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y },
      { x: position.x, y: position.y + 1 },
      { x: position.x, y: position.y - 1 },
    ]) {
      // Don't go off the grid
      if (p.x < 0 || p.y < 0 || p.x >= grid.width || p.y >= grid.height) {
        continue;
      }

      /*
      
      TODO: only allow pathing into a house block if
      
        a) It is the destination.
        b) We are approaching the front of the house.

      */

      // Skip if has a house on it, unless it's the destination
      if (
        (p.x !== destination.x || p.y !== destination.y) &&
        grid.cells[p.x + grid.width * p.y].house !== null
      ) {
        continue;
      }

      yield p;
    }
  }

  const unvisited: Edge[] = [];
  const visited = new Map<string, Edge>();

  unvisited.push({ prev: null as any, to: start, totalCost: 0 });

  var bestSolution: Edge | null = null;

  while (unvisited.length) {
    // TODO: sort by some heuristic

    const nextUnvisitedEdge = unvisited.splice(0, 1)[0];

    // If we already have an overall better solution, then discard this path
    if (bestSolution && bestSolution.totalCost < nextUnvisitedEdge.totalCost) {
      continue;
    }

    // Check if we have a better solution to this position
    const key = `${nextUnvisitedEdge.to.x},${nextUnvisitedEdge.to.y}`;
    const existing = visited.get(key);
    if (existing) {
      if (nextUnvisitedEdge.totalCost < existing.totalCost) {
        // This is better, so remember it
        visited.set(key, nextUnvisitedEdge);
      } else {
        // The existing path is better, so discard this path
        continue;
      }
    } else {
      visited.set(key, nextUnvisitedEdge);
    }

    // Is this a possible solution - does it reach the destination?
    const isSolution =
      nextUnvisitedEdge.to.x === destination.x &&
      nextUnvisitedEdge.to.y === destination.y;
    if (isSolution) {
      const isBetterSolution =
        !bestSolution || nextUnvisitedEdge.totalCost < bestSolution.totalCost;
      if (isBetterSolution) {
        bestSolution = nextUnvisitedEdge;
      }
    } else {
      // Queue up the next edges from this edge
      const nextEdges = Array.from(iteratePossibleEdges(nextUnvisitedEdge.to));
      for (const nextPosition of nextEdges) {
        unvisited.push({
          prev: nextUnvisitedEdge,
          to: nextPosition,
          totalCost: nextUnvisitedEdge.totalCost + 1,
        });
      }
    }

    if (unvisited.length > 1000) {
      debugger;
    }
  }

  if (bestSolution) {
    const route: IPosition[] = [];
    while (bestSolution) {
      route.push(bestSolution.to);
      bestSolution = bestSolution.prev;
    }
    return route.reverse();
  } else {
    throw new AppError("Unable to find a path.", {
      grid,
      from: start,
      to: destination,
    });
  }
}
