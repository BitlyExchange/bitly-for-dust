import { encodeBlock, Vec3 } from "@dust/world/internal";
import { resourceToHex } from "@latticexyz/common";
import TransferSystemABI from "@dust/world/out/TransferSystem.sol/TransferSystem.abi";
import { getSlotsWithObject, getAllSlots } from "./usePlayerInventory";
import { Hex } from "viem";
import { objects } from "@dust/world/internal";

// Constants for inventory slots
const MAX_PLAYER_INVENTORY_SLOTS = 36;
const MAX_CHEST_INVENTORY_SLOTS = 27;
const MAX_STACK_SIZE = 99;

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
export async function InteractWithChest(
  action: "tokenize" | "claim",
  amount: number,
  chests: Vec3[],
  objectType: number,
  playerEntityId: Hex,
  dustClient: any
): Promise<void> {
  if (!dustClient) {
    throw new Error("Dust client not connected");
  }

  if (!chests || chests.length === 0) {
    throw new Error("Object coordinates not available");
  }

  if (!playerEntityId) {
    throw new Error("Player entity ID not available");
  }

  // Get chest entity ID by encoding the coordinates
  const chestCoordinates = chests[0]; // Use the first coordinate
  const chestEntityId = encodeBlock(chestCoordinates as [number, number, number]);

  // Map the action to the new terminology
  // "tokenize" means moving from player to chest (deposit)
  // "claim" means moving from chest to player (withdraw)
  const mappedAction = action === "tokenize" ? "deposit" : "withdraw";

  // Determine source and target based on action
  const sourceId = mappedAction === "withdraw" ? chestEntityId : playerEntityId;
  const targetId = mappedAction === "withdraw" ? playerEntityId : chestEntityId;

  // Find slots with the specified object in the source
  const sourceSlots = getSlotsWithObject(sourceId, objectType);

  if (sourceSlots.length === 0) {
    throw new Error(`No object found in ${mappedAction === "withdraw" ? "chest" : "inventory"}`);
  }

  // Calculate total available items in source slots
  const totalAvailableItems = sourceSlots.reduce((total, slot) => total + slot.amount, 0);

  // Limit the amount to transfer based on available source items
  const actualAmount = Math.min(amount, totalAvailableItems);

  // Get all slots in the target to find empty slots and slots with the same object
  const targetSlots = getAllSlots(targetId);

  // Find empty slots in the target
  const occupiedSlotNumbers = new Set(targetSlots.map(slot => slot.slot));
  const emptySlots: number[] = [];

  // Find slots with the same object that aren't full
  const targetSlotsWithSameObject = targetSlots.filter(
    slot => slot.objectType === objectType && slot.amount < MAX_STACK_SIZE
  );

  // Determine which max slots to use based on the target
  const maxSlots = targetId === chestEntityId ? MAX_CHEST_INVENTORY_SLOTS : MAX_PLAYER_INVENTORY_SLOTS;

  // Find empty slots using the appropriate max slots constant
  for (let i = 0; i < maxSlots; i++) {
    if (!occupiedSlotNumbers.has(i)) {
      emptySlots.push(i);
    }
  }

  // Calculate how many items we can transfer to existing slots with the same object
  let remainingToTransfer = actualAmount;
  const transfers: { slotFrom: number; slotTo: number; amount: number }[] = [];

  // First try to fill existing slots with the same object
  if (targetSlotsWithSameObject.length > 0) {
    // Create a copy of target slots to track remaining space
    const targetSlotSpaces = targetSlotsWithSameObject.map(slot => ({
      slot: slot.slot,
      spaceAvailable: MAX_STACK_SIZE - slot.amount
    }));

    for (const sourceSlot of sourceSlots) {
      if (remainingToTransfer <= 0 || sourceSlot.amount <= 0) break;

      // Sort target slots by available space (descending) to fill fullest slots first
      targetSlotSpaces.sort((a, b) => b.spaceAvailable - a.spaceAvailable);

      for (const targetSlotSpace of targetSlotSpaces) {
        if (remainingToTransfer <= 0 || sourceSlot.amount <= 0 || targetSlotSpace.spaceAvailable <= 0) break;

        const amountToTransfer = Math.min(remainingToTransfer, sourceSlot.amount, targetSlotSpace.spaceAvailable);
        if (amountToTransfer <= 0) continue;

        transfers.push({
          slotFrom: sourceSlot.slot,
          slotTo: targetSlotSpace.slot,
          amount: amountToTransfer
        });

        // Update tracking variables
        remainingToTransfer -= amountToTransfer;
        sourceSlot.amount -= amountToTransfer;
        targetSlotSpace.spaceAvailable -= amountToTransfer;
      }
    }
  }

  // Then use empty slots for remaining items
  if (remainingToTransfer > 0 && emptySlots.length > 0) {
    // Create a data structure to track the remaining capacity of each empty slot
    const emptySlotSpaces = emptySlots.map(slot => ({
      slot,
      spaceAvailable: MAX_STACK_SIZE
    }));

    for (const sourceSlot of sourceSlots) {
      if (remainingToTransfer <= 0 || emptySlotSpaces.length === 0) break;
      if (sourceSlot.amount <= 0) continue; // Skip empty source slots

      // Sort empty slots by available space (descending) to fill fullest slots first
      emptySlotSpaces.sort((a, b) => b.spaceAvailable - a.spaceAvailable);

      // Get the current empty slot with the most space
      const currentEmptySlot = emptySlotSpaces[0];
      if (!currentEmptySlot || currentEmptySlot.spaceAvailable <= 0) break;

      const amountToTransfer = Math.min(remainingToTransfer, sourceSlot.amount, currentEmptySlot.spaceAvailable);
      if (amountToTransfer <= 0) continue;

      transfers.push({
        slotFrom: sourceSlot.slot,
        slotTo: currentEmptySlot.slot,
        amount: amountToTransfer
      });

      // Update tracking variables
      remainingToTransfer -= amountToTransfer;
      sourceSlot.amount -= amountToTransfer;
      currentEmptySlot.spaceAvailable -= amountToTransfer;

      // Remove slots that are now full
      if (currentEmptySlot.spaceAvailable <= 0) {
        emptySlotSpaces.shift(); // Remove the first slot which we just filled
      }
    }
  }

  if (transfers.length === 0) {
    throw new Error(`No available slots in ${mappedAction === "withdraw" ? "inventory" : "chest"}`);
  }

  console.log(`ww: Transfers: ${JSON.stringify(transfers)}`);

  // Call the transfer function
  await dustClient.provider.request({
    method: "systemCall",
    params: [
      {
        systemId: resourceToHex({
          type: "system",
          namespace: "",
          name: "TransferSystem",
        }),
        abi: TransferSystemABI,
        functionName: "transfer",
        args: [
          playerEntityId, // caller
          sourceId, // from
          targetId, // to
          transfers, // transfers array
          "0x" // extraData (empty)
        ],
      },
    ],
  });

  // Calculate total items transferred
  const totalTransferred = transfers.reduce((total, transfer) => total + transfer.amount, 0);
  console.log(`Successfully ${action === "claim" ? "claimed" : "tokenized"} ${totalTransferred} items`);
}