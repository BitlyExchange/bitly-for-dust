import { useState, useEffect, useRef } from "react";
import { encodeBlock } from "@dust/world/internal";

export function ForceFieldInfoSection() {
  // ForceField data state
  const [forceFieldData, setForceFieldData] = useState<{
    energy: number | null;
    fragmentCount: number | null;
    loading: boolean;
    error: string | null;
  }>({
    energy: null,
    fragmentCount: null,
    loading: true,
    error: null,
  });
  
  // Current energy state that will be updated dynamically
  const [currentEnergy, setCurrentEnergy] = useState<number | null>(null);
  
  // Last update timestamp
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // ForceField coordinates
  const forceFieldCoordinates: [number, number, number] = [226, 71, -2680];

  // Fetch ForceField data
  useEffect(() => {
    const fetchForceFieldData = async () => {
      try {
        setForceFieldData(prev => ({ ...prev, loading: true, error: null }));
        
        // Convert coordinates to entityId
        const entityId = encodeBlock(forceFieldCoordinates);
        
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
        
        setForceFieldData({
          energy,
          fragmentCount,
          loading: false,
          error: null
        });
        
        // Initialize current energy
        setCurrentEnergy(energy);
        lastUpdateTimeRef.current = Date.now();
      } catch (error) {
        console.error("Error fetching ForceField data:", error);
        setForceFieldData({
          energy: null,
          fragmentCount: null,
          loading: false,
          error: "Failed to fetch ForceField data"
        });
      }
    };
    
    fetchForceFieldData();
    
    // Set up interval to update energy consumption
    const intervalId = setInterval(() => {
      setCurrentEnergy(prevEnergy => {
        if (prevEnergy === null || forceFieldData.fragmentCount === null) return prevEnergy;
        
        // Calculate energy consumption rate (energy units per day)
        const dailyConsumption = 8 * forceFieldData.fragmentCount;
        
        // Calculate time elapsed since last update (in days)
        const now = Date.now();
        const elapsedMs = now - lastUpdateTimeRef.current;
        const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
        
        // Update last update time
        lastUpdateTimeRef.current = now;
        
        // Calculate new energy value
        const consumedEnergy = dailyConsumption * elapsedDays;
        const newEnergy = Math.max(0, prevEnergy - consumedEnergy);
        
        return newEnergy;
      });
    }, 1000); // Update every second
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [forceFieldData.fragmentCount]);

  return (
    <div
      style={{
        backgroundColor: "#2A2A2A",
        padding: "15px",
        borderRadius: "4px",
        border: "2px solid #555555",
        marginBottom: "20px",
      }}
    >
      <h3 style={{ color: "#FFAA00", marginBottom: "10px", fontSize: "1.4rem" }}>
        ForceField Info
      </h3>
      <p style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
        Information about the Force Field.
      </p>
      
      {forceFieldData.loading ? (
        <div style={{
          backgroundColor: "#1A1A1A",
          borderRadius: "4px",
          padding: "20px",
          textAlign: "center",
          border: "1px solid #444444",
          marginTop: "10px"
        }}>
          <div style={{
            display: "inline-block",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "3px solid #AAAAAA",
            borderTopColor: "transparent",
            animation: "spin 1.5s linear infinite",
            marginRight: "10px",
            verticalAlign: "middle"
          }} />
          <span style={{ fontSize: "1rem", color: "#AAAAAA", verticalAlign: "middle" }}>
            Loading force field data...
          </span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : forceFieldData.error ? (
        <div style={{
          backgroundColor: "#1A1A1A",
          borderRadius: "4px",
          padding: "20px",
          textAlign: "center",
          border: "1px solid #444444",
          marginTop: "10px"
        }}>
          <span style={{
            display: "inline-block",
            width: "20px",
            height: "20px",
            color: "#FF5555",
            fontSize: "20px",
            fontWeight: "bold",
            marginRight: "10px",
            verticalAlign: "middle"
          }}>
            !
          </span>
          <span style={{ fontSize: "1rem", color: "#FF5555", verticalAlign: "middle" }}>
            Error: {forceFieldData.error}
          </span>
        </div>
      ) : (
        <div style={{ marginTop: "15px" }}>
          <table style={{
            width: "100%",
            backgroundColor: "#1A1A1A",
            borderRadius: "4px",
            marginBottom: "10px",
            border: "1px solid #444444",
            borderCollapse: "collapse",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          }}>
            <thead>
              <tr style={{
                background: "linear-gradient(to right, #222222, #2A2A2A)"
              }}>
                <th style={{
                  padding: "14px 12px",
                  textAlign: "left",
                  borderBottom: "2px solid #555555",
                  color: "#FFAA00",
                  width: "40%",
                  fontSize: "1.05rem"
                }}>
                  Property
                </th>
                <th style={{
                  padding: "14px 12px",
                  textAlign: "left",
                  borderBottom: "2px solid #555555",
                  color: "#FFAA00",
                  fontSize: "1.05rem"
                }}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{
                transition: "background-color 0.2s"
              }}>
                <td style={{
                  padding: "14px 12px",
                  fontWeight: "bold",
                  color: "#55FFFF",
                  borderBottom: "1px solid #333333",
                  background: "rgba(0, 0, 0, 0.1)"
                }}>
                  Energy
                </td>
                <td style={{
                  padding: "14px 12px",
                  color: "#55FFFF",
                  borderBottom: "1px solid #333333"
                }}>
                  {currentEnergy !== null ? (
                    <span style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
                      {currentEnergy.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  ) : "Unknown"}
                </td>
              </tr>
              
              {currentEnergy !== null && forceFieldData.fragmentCount !== null && (
                <tr style={{
                  transition: "background-color 0.2s"
                }}>
                  <td style={{
                    padding: "14px 12px",
                    fontWeight: "bold",
                    color: "#55FFFF",
                    borderBottom: "1px solid #333333"
                  }}>
                    Estimated Protection Time
                  </td>
                  <td style={{
                    padding: "14px 12px",
                    color: "#55FFFF",
                    borderBottom: "1px solid #333333"
                  }}>
                    {(() => {
                      // Calculate daily consumption based on fragment count (8 per fragment)
                      const dailyConsumption = 8 * forceFieldData.fragmentCount;
                      
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
                    })()}
                  </td>
                </tr>
              )}
              
              <tr style={{
                transition: "background-color 0.2s"
              }}>
                <td style={{
                  padding: "14px 12px",
                  fontWeight: "bold",
                  color: "#55FFFF",
                  background: "rgba(0, 0, 0, 0.1)"
                }}>
                  Fragments
                </td>
                <td style={{
                  padding: "14px 12px",
                  color: "#55FFFF"
                }}>
                  {forceFieldData.fragmentCount !== null ? (
                    <span style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
                      {forceFieldData.fragmentCount} fragments
                    </span>
                  ) : "Unknown"}
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: "0.9rem", color: "#AAAAAA", fontStyle: "italic" }}>
            Force fields protect areas from mining, building, and other actions.
          </p>
        </div>
      )}
    </div>
  );
}