import { skipToken, useQuery } from "@tanstack/react-query";
import { useDustClient } from "./useDustClient";
import { usePlayerEntityId } from "./usePlayerEntityId";
import { objects } from "@dust/world/internal";
import { useRecord } from "@latticexyz/stash/react";
import { stash, tables } from "../mud/stash";
import { Hex } from "viem";

export interface InventoryItem {
  objectName: string;
  quantity: number;
}

export function usePlayerInventory(objectName: string) {
  const { data: playerEntityId } = usePlayerEntityId();

  const getObjectTypeId = (name: string): number => {
    const objectTypeId = (objects.find(e => e.name === name))?.id;
    return objectTypeId || 0;
  };

  const objectTypeId = getObjectTypeId(objectName);

  // Query all inventory slots for the player
  const inventoryQuery = useQuery({
    queryKey: ["player-inventory", playerEntityId, objectName],
    enabled: !!playerEntityId,
    queryFn: () => {
      if (!playerEntityId) return 0;

      console.log('ww: usePlayerInventory: ', playerEntityId);
      
      // Get all slots containing the specified object type
      const slots = getSlotsWithObject(playerEntityId as Hex, objectTypeId);
      console.log('slots', slots);
      
      // Calculate total quantity across all slots
      const totalQuantity = slots.reduce((sum, slot) => sum + slot.amount, 0);
      return totalQuantity;
    }
  });

  return inventoryQuery;
}

// Maximum number of inventory slots
  const MAX_PLAYER_INVENTORY_SLOTS = 36;

/**
 * Get inventory slots containing a specific object type
 */
export function getSlotsWithObject(
  entityId: Hex,
  objectType: number
): {
  slot: number;
  amount: number;
}[] {
  const slots: {
    slot: number;
    amount: number;
  }[] = [];
  
  for (let i = 0; i < MAX_PLAYER_INVENTORY_SLOTS; i++) {
    const inventorySlot = stash.getRecord({
      table: tables.InventorySlot,
      key: {
        owner: entityId,
        slot: i,
      },
    });
    
    if (inventorySlot?.objectType !== objectType) {
      continue;
    }
    
    slots.push({
      slot: i,
      amount: inventorySlot.amount,
    });
  }
  
  return slots;
}


export function getAllSlots(entityId: Hex) {
  const slots: {
    slot: number;
    amount: number;
    objectType: number;
  }[] = [];
  for (let i = 0; i < MAX_PLAYER_INVENTORY_SLOTS; i++) {
    const inventorySlot = stash.getRecord({
      table: tables.InventorySlot,
      key: {
        owner: entityId,
        slot: i,
      },
    });
    if (!inventorySlot) {
      continue;
    }
    slots.push({
      slot: i,
      amount: inventorySlot.amount,
      objectType: inventorySlot.objectType,
    });
  }
  return slots;
}