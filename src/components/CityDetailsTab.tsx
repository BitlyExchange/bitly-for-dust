import { useState, useEffect } from "react";
import { CoordinatesSection } from "./CoordinatesSection";
import { SpawnSection } from "./SpawnSection";
import { ForceFieldInfoSection } from "./ForceFieldInfoSection";

export function CityDetailsTab() {

  // Feedback state
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
    id: string;
  } | null>(null);

  // Auto-hide feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);


  const showFeedback = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = Date.now().toString();
    setFeedback({ message, type, id });
  };

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
          color: "#55FF55",
          fontSize: "1.8rem",
          marginBottom: "15px",
          textAlign: "center",
          textShadow: "2px 2px #3F3F3F",
        }}
      >
        City Details
      </h2>
      
      <CoordinatesSection showFeedback={showFeedback} />
      <SpawnSection />
      <ForceFieldInfoSection />

      {/* Feedback Display */}
      {feedback && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor:
              feedback.type === "success"
                ? "#4CAF50"
                : feedback.type === "error"
                  ? "#f44336"
                  : "#2196F3",
            color: "white",
            padding: "20px 30px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 1000,
            maxWidth: "400px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}