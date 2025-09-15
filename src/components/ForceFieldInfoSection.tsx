import { useState, useEffect, useRef } from "react";
import {
  fetchForceFieldData,
  calculateUpdatedEnergy,
  calculateProtectionTime,
  type ForceFieldData,
  type ForceFieldCoordinates
} from "../common/forceFieldEnergy";

export function ForceFieldInfoSection() {
  // ForceField data state
  const [forceFieldData, setForceFieldData] = useState<ForceFieldData>({
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
  const forceFieldCoordinates: ForceFieldCoordinates = [226, 71, -2680];

  // Fetch ForceField data
  useEffect(() => {
    const loadForceFieldData = async () => {
      try {
        setForceFieldData(prev => ({ ...prev, loading: true, error: null }));
        
        // Fetch force field data using the abstracted function
        const data = await fetchForceFieldData(forceFieldCoordinates);
        
        setForceFieldData(data);
        
        // Initialize current energy
        setCurrentEnergy(data.energy);
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
    
    loadForceFieldData();
    
    // Set up interval to update energy consumption
    const intervalId = setInterval(() => {
      setCurrentEnergy(prevEnergy => {
        if (prevEnergy === null || forceFieldData.fragmentCount === null) return prevEnergy;
        
        // Calculate time elapsed since last update
        const now = Date.now();
        const elapsedMs = now - lastUpdateTimeRef.current;
        
        // Update last update time
        lastUpdateTimeRef.current = now;
        
        // Calculate new energy value using the abstracted function
        return calculateUpdatedEnergy(prevEnergy, forceFieldData.fragmentCount, elapsedMs);
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
                    {calculateProtectionTime(currentEnergy, forceFieldData.fragmentCount)}
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