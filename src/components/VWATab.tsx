import { useState, useEffect } from "react";
import { message } from "antd";
import { ObjectCard } from "./ObjectCard";
import { useSyncStatus } from "../mud/useSyncStatus";

export function VWATab() {
  // Get sync status
  const syncStatus = useSyncStatus();
  
  // State for VWA object names
  const [objectNames, setObjectNames] = useState<string[]>([]);

  // Function to show feedback using Ant Design's message component
  const showFeedback = (msg: string, type: "success" | "error" | "info") => {
    message[type](msg, 5); // Display message for 5 seconds
  };
  
  // Load object names from vwa_info.json
  useEffect(() => {
    const loadVWAInfo = async () => {
      try {
        const vwaInfo = await import("../vwa_info.json").then(
          (module) => module.default
        );
        
        // Extract keys from vwa_info.json as object names
        const names = Object.keys(vwaInfo);
        setObjectNames(names);
      } catch (error) {
        console.error("Error loading VWA info:", error);
        showFeedback("Failed to load VWA information", "error");
      }
    };
    
    loadVWAInfo();
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#3E3E3E",
        padding: "20px",
        borderRadius: "8px",
        border: "4px solid #555555",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
        color: "#FFFFFF",
        fontFamily: "'Minecraft', monospace",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          color: "#5555FF",
          fontSize: "1.8rem",
          marginBottom: "15px",
          textAlign: "center",
          textShadow: "2px 2px #3F3F3F",
        }}
      >
        VWA (Virtual World Asset)
      </h2>
      
      {/* Instructions section */}
      <div
        style={{
          marginBottom: "20px",
          backgroundColor: "#3E3E3E",
          border: "4px solid #555555",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
          fontFamily: "'Minecraft', monospace",
          padding: "15px",
        }}
      >
        <h3 style={{
          color: "#5555FF",
          textShadow: "1px 1px #3F3F3F",
          fontWeight: "bold",
          marginTop: 0,
          marginBottom: "10px"
        }}>
          Instructions
        </h3>
        <div style={{
          backgroundColor: "#4E4E4E",
          borderRadius: "4px",
          padding: "15px",
          margin: "0",
          color: "#FFFFFF",
        }}>
          <p style={{ margin: 0 }}>
            Stand on red block (Mushroom) at Standing Point and then tokenize/claim
          </p>
        </div>
      </div>
      
      {/* Cards container with flex layout - 2 cards per row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "15px",
        }}
      >
        {!syncStatus.isLive ? (
          <div style={{ textAlign: "center", width: "100%", padding: "20px" }}>
            <p>Syncing blockchain data: {syncStatus.percentage}%</p>
            <div style={{
              width: "100%",
              height: "10px",
              backgroundColor: "#555555",
              borderRadius: "5px",
              overflow: "hidden",
              marginTop: "10px"
            }}>
              <div style={{
                width: `${syncStatus.percentage}%`,
                height: "100%",
                backgroundColor: "#5555FF",
                borderRadius: "5px"
              }}></div>
            </div>
          </div>
        ) : objectNames.length > 0 ? (
          objectNames.map((name) => (
            <ObjectCard key={name} objectName={name} showFeedback={showFeedback} />
          ))
        ) : (
          <div style={{ textAlign: "center", width: "100%", padding: "20px" }}>
            Loading VWA objects...
          </div>
        )}
      </div>
    </div>
  );
}