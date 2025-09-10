import { encodeBlock, Vec3 } from "@dust/world/internal";
import { resourceToHex } from "@latticexyz/common";
import TransferSystemABI from "@dust/world/out/TransferSystem.sol/TransferSystem.abi";
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

  // Prepare transfer parameters based on action
  let fromEntityId, toEntityId, transfers;

  if (action === "tokenize") {
    // For tokenize: transfer from player to chest
    fromEntityId = playerEntityId;
    toEntityId = chestEntityId;
    
    // Find slots containing this object
    const slots = getSlotsWithObject(playerEntityId, objectType);
    if (slots.length === 0) {
      throw new Error(`No object found in inventory`);
    }
    
    // Find a suitable slot in the chest
    const chestSlots = getAllSlots(chestEntityId as `0x${string}`);
    const MAX_STACK_SIZE = 99;
    
    // First try to find a slot with the same object type that has space
    let targetSlot = -1;
    
    // Look for a slot with the same object type that isn't full
    for (const slot of chestSlots) {
      if (slot.objectType === objectType && slot.amount < MAX_STACK_SIZE) {
        // Check if there's enough space in this slot
        if (slot.amount + amount <= MAX_STACK_SIZE) {
          targetSlot = slot.slot;
          break;
        }
      }
    }
    
    // If no suitable slot with the same object type was found, look for an empty slot
    if (targetSlot === -1) {
      // Create a set of occupied slots for faster lookup
      const occupiedSlots = new Set(chestSlots.map(slot => slot.slot));
      
      // Find the first empty slot
      for (let i = 0; i < 36; i++) {  // 36 is MAX_PLAYER_INVENTORY_SLOTS
        if (!occupiedSlots.has(i)) {
          targetSlot = i;
          break;
        }
      }
    }
    
    // If still no slot found, use slot 0 as fallback
    if (targetSlot === -1) {
      targetSlot = 0;
    }
    
    // Prepare transfers array
    transfers = [{
      slotFrom: slots[0].slot, // Use the first slot that has the object
      slotTo: targetSlot, // Target slot in chest
      amount: amount
    }];
  } else {
    // For claim: transfer from chest to player
    fromEntityId = chestEntityId;
    toEntityId = playerEntityId;
    
    // Find a suitable slot in player's inventory
    const allSlots = getAllSlots(playerEntityId as `0x${string}`);
    const MAX_STACK_SIZE = 99;
    
    // First try to find a slot with the same object type that has space
    let targetSlot = -1;
    
    // Look for a slot with the same object type that isn't full
    for (const slot of allSlots) {
      if (slot.objectType === objectType && slot.amount < MAX_STACK_SIZE) {
        // Check if there's enough space in this slot
        if (slot.amount + amount <= MAX_STACK_SIZE) {
          targetSlot = slot.slot;
          break;
        }
      }
    }
    
    // If no suitable slot with the same object type was found, look for an empty slot
    if (targetSlot === -1) {
      // Create a set of occupied slots for faster lookup
      const occupiedSlots = new Set(allSlots.map(slot => slot.slot));
      
      // Find the first empty slot
      for (let i = 0; i < 36; i++) {  // 36 is MAX_PLAYER_INVENTORY_SLOTS
        if (!occupiedSlots.has(i)) {
          targetSlot = i;
          break;
        }
      }
    }
    
    // If still no slot found, show error
    if (targetSlot === -1) {
      throw new Error("No available inventory slots");
    }
    
    // Prepare transfers array
    transfers = [{
      slotFrom: 0, // Source slot in chest
      slotTo: targetSlot, // Target slot in player inventory
      amount: amount
    }];
  }

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
          fromEntityId, // from
          toEntityId, // to
          transfers, // transfers array
          "0x" // extraData (empty)
        ],
      },
    ],
  });
}