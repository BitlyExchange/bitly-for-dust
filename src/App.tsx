import { useState } from "react";
import { CityDetailsTab } from "./components/CityDetailsTab";
import { VWATab } from "./components/VWATab";
import { NewsTab } from "./components/NewsTab";
import { ExchangeTab } from "./components/ExchangeTab";
import { ReferencesTab } from "./components/ReferencesTab";

type TabType = "cityDetails" | "vwa" | "news" | "exchange" | "references";

export function App() {
  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>("cityDetails");

  return (
    <div 
      style={{ 
        padding: "20px", 
        maxWidth: "1200px", 
        margin: "0 auto",
        backgroundColor: "#1D1D1D",
        minHeight: "100vh",
        fontFamily: "'Minecraft', monospace",
        color: "#FFFFFF"
      }}
    >
      {/* Header */}
      <h1
        style={{
          textAlign: "center",
          color: "#FFFFFF",
          marginBottom: "10px",
          fontSize: "2.5rem",
          fontWeight: "bold",
          textShadow: "2px 2px 0px #000000, 4px 4px 0px #555555",
          letterSpacing: "2px",
          paddingBottom: "10px",
          backgroundImage: "linear-gradient(to right, #55FF55, #5555FF, #FFAA00, #FF5555)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Bitly
      </h1>

      {/* Description */}
      <p
        style={{
          textAlign: "center",
          color: "#AAAAAA",
          fontSize: "1.2rem",
          marginBottom: "30px",
          textShadow: "1px 1px 0px #000000",
        }}
      >
        Control Panel for City & Exchange
      </p>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "2px solid #555555",
          padding: "0 10px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setActiveTab("cityDetails")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "cityDetails" ? "#55FF55" : "#333333",
            color: activeTab === "cityDetails" ? "#000000" : "#FFFFFF",
            border: "2px solid #555555",
            borderBottom: activeTab === "cityDetails" ? "2px solid #55FF55" : "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontFamily: "'Minecraft', monospace",
            fontSize: "1rem",
            fontWeight: "bold",
            textShadow: activeTab === "cityDetails" ? "none" : "1px 1px 0px #000000",
            transition: "all 0.2s ease",
          }}
        >
          City Details
        </button>
        <button
          onClick={() => setActiveTab("exchange")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "exchange" ? "#55AAFF" : "#333333",
            color: activeTab === "exchange" ? "#000000" : "#FFFFFF",
            border: "2px solid #555555",
            borderBottom: activeTab === "exchange" ? "2px solid #55AAFF" : "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontFamily: "'Minecraft', monospace",
            fontSize: "1rem",
            fontWeight: "bold",
            textShadow: activeTab === "exchange" ? "none" : "1px 1px 0px #000000",
            transition: "all 0.2s ease",
          }}
        >
          Exchange
        </button>
        <button
          onClick={() => setActiveTab("vwa")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "vwa" ? "#5555FF" : "#333333",
            color: activeTab === "vwa" ? "#FFFFFF" : "#FFFFFF",
            border: "2px solid #555555",
            borderBottom: activeTab === "vwa" ? "2px solid #5555FF" : "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontFamily: "'Minecraft', monospace",
            fontSize: "1rem",
            fontWeight: "bold",
            textShadow: "1px 1px 0px #000000",
            transition: "all 0.2s ease",
          }}
        >
          VWA
        </button>
        <button
          onClick={() => setActiveTab("news")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "news" ? "#FFAA00" : "#333333",
            color: activeTab === "news" ? "#000000" : "#FFFFFF",
            border: "2px solid #555555",
            borderBottom: activeTab === "news" ? "2px solid #FFAA00" : "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontFamily: "'Minecraft', monospace",
            fontSize: "1rem",
            fontWeight: "bold",
            textShadow: activeTab === "news" ? "none" : "1px 1px 0px #000000",
            transition: "all 0.2s ease",
          }}
        >
          News
        </button>
        <button
          onClick={() => setActiveTab("references")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "references" ? "#FF5555" : "#333333",
            color: activeTab === "references" ? "#000000" : "#FFFFFF",
            border: "2px solid #555555",
            borderBottom: activeTab === "references" ? "2px solid #FF5555" : "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontFamily: "'Minecraft', monospace",
            fontSize: "1rem",
            fontWeight: "bold",
            textShadow: activeTab === "references" ? "none" : "1px 1px 0px #000000",
            transition: "all 0.2s ease",
          }}
        >
          References
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: "20px 0" }}>
        {activeTab === "cityDetails" && <CityDetailsTab />}
        {activeTab === "vwa" && <VWATab />}
        {activeTab === "news" && <NewsTab />}
        {activeTab === "exchange" && <ExchangeTab />}
        {activeTab === "references" && <ReferencesTab />}
      </div>
    </div>
  );
}