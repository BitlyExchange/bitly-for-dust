import { skipToken, useQuery } from "@tanstack/react-query";
import { useDustClient } from "./useDustClient";
import { usePlayerEntityId } from "./usePlayerEntityId";
import { objects } from "@dust/world/internal";

export interface InventoryItem {
  objectName: string;
  quantity: number;
}

export function usePlayerInventory(objectName: string) {
  const { data: dustClient } = useDustClient();
  const { data: playerEntityId } = usePlayerEntityId();

  // We need to map object names to their type IDs
  // This would ideally come from a central mapping or API
  const getObjectTypeId = (name: string): number => {
    const objectTypeId = (objects.find(e => e.name === name))?.id;
    return objectTypeId || 0;
  };

  const objectTypeId = getObjectTypeId(objectName);

  console.log("ww: objectTypeId", objectTypeId, ", objectName: ", objectName, ", player: ", playerEntityId, ", dust: ", dustClient);

  return useQuery({
    queryKey: ["playerInventory", objectName, playerEntityId],
    queryFn: !dustClient || !playerEntityId || !objectTypeId
      ? skipToken
      : async () => {
          try {
            // Get slots for the specific object type with withdraw operation
            // This tells us how many of this object the player has
            const response = await dustClient.provider.request({
              method: "getSlots",
              params: {
                entity: playerEntityId,
                objectType: objectTypeId,
                amount: 999999, // Large number to get all slots
                operationType: "withdraw"
              },
            });

            console.log("ww: getSlots response", response);
            
            // Calculate total quantity from slots
            const totalQuantity = response.slots.reduce(
              (sum: number, slot: { amount: number }) => sum + slot.amount, 
              0
            );
            
            return totalQuantity;
          } catch (error) {
            console.error(`Error fetching inventory for ${objectName}:`, error);
            return 0;
          }
        },
    enabled: Boolean(dustClient) && Boolean(playerEntityId) && Boolean(objectTypeId),
    staleTime: 10000, // 10 seconds
  });
}