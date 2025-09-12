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
      
      
      <div
        style={{
          backgroundColor: "#2A2A2A",
          padding: "15px",
          borderRadius: "4px",
          border: "2px solid #555555",
          marginBottom: "20px",
        }}
      >
        <p style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
          Welcome to the VWA tab. Here you can interact with Virtual World Assets.
        </p>
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