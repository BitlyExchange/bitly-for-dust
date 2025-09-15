import { encodeBlock, Vec3 } from "@dust/world/internal";
import { resourceToHex } from "@latticexyz/common";
import SpawnSystemABI from "@dust/world/out/SpawnSystem.sol/SpawnSystem.abi";
import { getSlotsWithObject, getAllSlots } from "./usePlayerInventory";
import { Hex } from "viem";

/**
 * Interacts with a chest to tokenize or claim items
 * @param action - The action to perform: "tokenize" or "claim"
 * @param amount - The amount of items to transfer
 * @param chests - Array of chest coordinates [x, y, z]
 * @param objectType - The object type ID
 * @param playerEntityId - The player's entity ID
 * @param dustClient - The dust client instance
 * @returns A promise that resolves when the transfer is complete
 */

const MAX_PLAYER_ENERGY = 817600000000000000n;

export async function spawnPlayer(
  energyPercent: number,
  spawnTile: Vec3,
  playerEntityId: Hex,
  dustClient: any
): Promise<void> {
  if (!dustClient) {
    throw new Error("Dust client not connected");
  }

  if (!spawnTile) {
    throw new Error("Spawn tile not available");
  }

  if (!playerEntityId) {
    throw new Error("Player entity ID not available");
  }

  const spawnEnergy = BigInt(BigInt(energyPercent) * MAX_PLAYER_ENERGY);

  // Call the transfer function
  await dustClient.provider.request({
    method: "systemCall",
    params: [
      {
        systemId: resourceToHex({
          type: "system",
          namespace: "",
          name: "SpawnSystem",
        }),
        abi: SpawnSystemABI,
        functionName: "spawn",
        args: [
          spawnTile, // caller
          [spawnTile[0], spawnTile[1]+1, spawnTile[2]],
          spawnEnergy,
          "0x" // extraData (empty)
        ],
      },
    ],
  });
}