import { encodeBlock } from "@dust/world/internal";

// ForceField coordinates type
export type ForceFieldCoordinates = [number, number, number];

// ForceField data type
export interface ForceFieldData {
  energy: number | null;
  fragmentCount: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches force field energy and fragment data from the indexer
 * @param coordinates The coordinates of the force field
 * @returns Promise with the force field data
 */
export async function fetchForceFieldData(
  coordinates: ForceFieldCoordinates
): Promise<ForceFieldData> {
  try {
    // Convert coordinates to entityId
    const entityId = encodeBlock(coordinates);
    
    // Query for energy data
    const energyQuery = `SELECT "energy" FROM "Energy" WHERE "entityId" = '${entityId}' LIMIT 1`;
    
    const energyResponse = await fetch(
      "https://indexer.mud.redstonechain.com/q",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            query: energyQuery,
            address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
          },
        ]),
      }
    );
    
    let energy = null;
    if (energyResponse.ok) {
      const energyData = await energyResponse.json();
      const energyResult = Array.isArray(energyData) ? energyData[0] : energyData;
      
      if (
        energyResult.result &&
        energyResult.result.length > 0 &&
        energyResult.result[0] &&
        energyResult.result[0].length > 1
      ) {
        // Get energy value and convert to number
        const energyValue = energyResult.result[0][1][0];
        energy = Number(energyValue) / (10 ** 14);
      }
    }
    
    // Query for fragment count
    const fragmentQuery = `SELECT COUNT(*) FROM "Fragment" WHERE "forceField" = '${entityId}'`;
    
    const fragmentResponse = await fetch(
      "https://indexer.mud.redstonechain.com/q",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            query: fragmentQuery,
            address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
          },
        ]),
      }
    );
    
    let fragmentCount = null;
    if (fragmentResponse.ok) {
      const fragmentData = await fragmentResponse.json();
      const fragmentResult = Array.isArray(fragmentData) ? fragmentData[0] : fragmentData;
      
      if (
        fragmentResult.result &&
        fragmentResult.result.length > 0 &&
        fragmentResult.result[0] &&
        fragmentResult.result[0].length > 1
      ) {
        // Get fragment count
        fragmentCount = Number(fragmentResult.result[0][1][0]);
      }
    }
    
    return {
      energy,
      fragmentCount,
      loading: false,
      error: null
    };
  } catch (error) {
    console.error("Error fetching ForceField data:", error);
    return {
      energy: null,
      fragmentCount: null,
      loading: false,
      error: "Failed to fetch ForceField data"
    };
  }
}

/**
 * Calculates the daily energy consumption rate based on fragment count
 * @param fragmentCount Number of fragments in the force field
 * @returns Daily energy consumption rate
 */
export function calculateDailyConsumption(fragmentCount: number): number {
  // Each fragment consumes 8 energy units per day
  return 8 * fragmentCount;
}

/**
 * Calculates the new energy value based on elapsed time and consumption rate
 * @param currentEnergy Current energy value
 * @param fragmentCount Number of fragments
 * @param elapsedMs Time elapsed in milliseconds since last update
 * @returns Updated energy value
 */
export function calculateUpdatedEnergy(
  currentEnergy: number,
  fragmentCount: number,
  elapsedMs: number
): number {
  // Calculate daily consumption
  const dailyConsumption = calculateDailyConsumption(fragmentCount);
  
  // Calculate elapsed time in days
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  
  // Calculate consumed energy
  const consumedEnergy = dailyConsumption * elapsedDays;
  
  // Return new energy value (never below zero)
  return Math.max(0, currentEnergy - consumedEnergy);
}

/**
 * Calculates the estimated protection time based on current energy and fragment count
 * @param currentEnergy Current energy value
 * @param fragmentCount Number of fragments
 * @returns Formatted string representing the estimated protection time
 */
export function calculateProtectionTime(
  currentEnergy: number,
  fragmentCount: number
): string {
  // Calculate daily consumption based on fragment count
  const dailyConsumption = calculateDailyConsumption(fragmentCount);
  
  // If there are no fragments, show infinite duration
  if (dailyConsumption === 0) return "∞ (no fragments)";
  
  const totalDays = currentEnergy / dailyConsumption;
  const days = Math.floor(totalDays);
  const hours = Math.floor((totalDays - days) * 24);
  const minutes = Math.floor(((totalDays - days) * 24 - hours) * 60);
  
  if (days > 0) {
    return hours > 0
      ? `${days} days ${hours} hours`
      : `${days} days`;
  } else if (hours > 0) {
    return minutes > 0
      ? `${hours} hours ${minutes} minutes`
      : `${hours} hours`;
  } else if (minutes > 0) {
    return `${minutes} minutes`;
  } else {
    return "Less than 1 minute";
  }
}