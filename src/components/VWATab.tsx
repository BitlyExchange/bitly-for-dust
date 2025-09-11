import { useState, useEffect } from "react";
import { ObjectCard } from "./ObjectCard";

export function VWATab() {
  // State for feedback messages
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  
  // State for VWA object names
  const [objectNames, setObjectNames] = useState<string[]>([]);

  // Function to show feedback
  const showFeedback = (message: string, type: "success" | "error" | "info") => {
    setFeedback({ message, type });
    // Auto-hide feedback after 5 seconds
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
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
      
      {/* Feedback message */}
      {feedback && (
        <div
          style={{
            backgroundColor:
              feedback.type === "success" ? "#4CAF50" :
              feedback.type === "error" ? "#F44336" : "#2196F3",
            color: "white",
            padding: "10px 15px",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "1rem",
          }}
        >
          {feedback.message}
        </div>
      )}
      
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
        {objectNames.length > 0 ? (
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