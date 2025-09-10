import { useQuery } from "@tanstack/react-query";
import { useDustClient } from "./useDustClient";
import { encodePlayer } from "@dust/world/internal";

export function usePlayerEntityId() {
  const { data: dustClient } = useDustClient();

  return useQuery({
    queryKey: ["player-entity-id"],
    queryFn: () => encodePlayer(dustClient?.appContext.userAddress!),
  });
}
