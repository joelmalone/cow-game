import { INpc, IPosition } from "./cow-game-model";

/**
 * Allows the UI to query the current game world in real-time.
 */
export interface CowGameSimulation {
  /**
   * Gets the normalised distance of the NPC to it's home; with 1 meaning it's at the bus stop and 0 meaning it's at home.
   * @param npcId
   */
   getNpcPosition(npcId: INpc["id"]): IPosition;
}
