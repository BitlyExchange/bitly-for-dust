import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { connectDustClient } from "dustkit/internal";
import { encodeBlock } from "@dust/world/internal";
import { usePlayerInventory } from "../common/usePlayerInventory";
import { useTokenBalance } from "../common/useTokenBalance";

// Define the props interface for the component
interface ObjectCardProps {
  objectName: string;
  showFeedback?: (message: string, type: "success" | "error" | "info") => void;
}

// Define the interface for the object info from vwa_info.json
interface ObjectInfo {
  icon: string;
  contract: string;
  coordinate: number[][];
  standingpoint: number[];
}

// Define the interface for the vwa_info.json structure
interface VWAInfo {
  [key: string]: ObjectInfo;
}

// Define styling constants
const STYLES = {
  container: {
    backgroundColor: "#2A2A2A",
    padding: "12px",
    borderRadius: "4px",
    border: "2px solid #555555",
    marginBottom: "15px",
    width: "48%", // Allow 2 cards per row with some spacing
    minWidth: "280px",
    boxSizing: "border-box" as const,
  },
  header: {
    color: "#FFAA00",
    marginBottom: "6px",
    fontSize: "1.1rem",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    padding: "4px 0",
    borderBottom: "1px solid #444444",
    fontSize: "0.9rem",
  },
  label: {
    color: "#55FFFF",
    fontWeight: "bold",
  },
  coordinates: {
    color: "#FFFFFF",
    textAlign: "center" as const,
    fontSize: "0.8rem",
  },
  button: {
    padding: "4px 8px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.8rem",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(76, 175, 80, 0.3)",
  },
  optionsContainer: {
    marginBottom: "8px",
  },
  optionRow: {
    display: "flex",
    gap: "6px",
    marginBottom: "6px",
  },
  optionButton: {
    padding: "4px 8px",
    backgroundColor: "#333333",
    color: "white",
    border: "1px solid #555555",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
    transition: "all 0.2s ease",
    fontSize: "0.8rem",
  },
  optionButtonActive: {
    backgroundColor: "#5555FF",
    borderColor: "#7777FF",
  },
  inputRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
    marginBottom: "8px",
  },
  inputLabel: {
    color: "#AAAAAA",
    fontSize: "0.8rem",
  },
  input: {
    padding: "4px 6px",
    backgroundColor: "#333333",
    color: "white",
    border: "1px solid #555555",
    borderRadius: "4px",
    fontSize: "0.9rem",
  },
  maxAmount: {
    color: "#AAAAAA",
    fontSize: "0.7rem",
    textAlign: "right" as const,
  },
  confirmButton: {
    padding: "6px 12px",
    backgroundColor: "#FF5555",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem",
    width: "100%",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(255, 85, 85, 0.3)",
  },
};

export function ObjectCard({ objectName, showFeedback = () => {} }: ObjectCardProps) {
  // State for the component
  const [objectInfo, setObjectInfo] = useState<ObjectInfo | null>(null);
  const [option, setOption] = useState<"tokenize" | "claim">("tokenize");
  const [amount, setAmount] = useState<string>("0");
  const [maxAmount, setMaxAmount] = useState<string>("Loading...");
  const [isAmountValid, setIsAmountValid] = useState<boolean>(false);

  // Get the dust client
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });
  
  // Get player's inventory for this object
  const inventoryQuery = usePlayerInventory(objectName);
  
  // Get token balance for the contract address in vwaInfo
  const tokenBalanceQuery = useTokenBalance(objectInfo?.contract || "");
  
  // Update maxAmount based on inventory when option changes or inventory data loads
  useEffect(() => {
    if (option === "tokenize" && inventoryQuery.data !== undefined) {
      // If tokenize is selected, set max to player's inventory count
      setMaxAmount(inventoryQuery.data.toString());
    } else if (option === "claim" && objectInfo?.contract) {
      // For claim, get the player's token balance for the contract
      if (tokenBalanceQuery.data !== undefined) {
        setMaxAmount(tokenBalanceQuery.data.toString());
      } else {
        setMaxAmount("Loading...");
      }
    }
    
    // Validate current amount whenever maxAmount changes
    validateAmount(amount);
  }, [option, inventoryQuery.data, tokenBalanceQuery.data, objectInfo?.contract]);

  // Load the object info from vwa_info.json
  useEffect(() => {
    const loadObjectInfo = async () => {
      try {
        // In a real app, you might want to fetch this from an API
        // For now, we'll import it directly
        const vwaInfo: VWAInfo = await import("../vwa_info.json").then(
          (module) => module.default
        );
        
        if (vwaInfo[objectName]) {
          setObjectInfo(vwaInfo[objectName]);
          // Max amount will be set by the useEffect that watches option and inventory
        } else {
          console.error(`Object ${objectName} not found in vwa_info.json`);
          showFeedback(`Object ${objectName} not found`, "error");
        }
      } catch (error) {
        console.error("Error loading object info:", error);
        showFeedback("Failed to load object information", "error");
      }
    };

    loadObjectInfo();
  }, [objectName, showFeedback]);

  // Set waypoint in game
  const setWaypointInGame = async () => {
    if (!objectInfo || !objectInfo.standingpoint) {
      showFeedback("No standing point coordinates available", "error");
      return;
    }

    try {
      // Use encodeBlock to convert coordinates to entityId
      const entityId = encodeBlock(objectInfo.standingpoint as [number, number, number]);
      
      await dustClient.data?.provider.request({
        method: "setWaypoint",
        params: {
          entity: entityId as `0x${string}`,
          label: objectName,
        },
      });
      
      console.log(`✅ Waypoint set: ${objectName} at [${objectInfo.standingpoint.join(", ")}]`);
      showFeedback(`Waypoint "${objectName}" has been set in the game!`, "success");
    } catch (error) {
      console.error("Error setting waypoint:", error);
      showFeedback(
        `Failed to set waypoint "${objectName}" in the game.`,
        "error"
      );
    }
  };

  // Validate amount against maxAmount
  const validateAmount = (value: string) => {
    // Check if maxAmount is a number (not "Loading...")
    if (maxAmount === "Loading...") {
      setIsAmountValid(false);
      return;
    }
    
    const numValue = parseInt(value || "0");
    const numMaxAmount = parseInt(maxAmount);
    
    // Amount is valid if it's a positive integer and doesn't exceed maxAmount
    const valid = numValue > 0 && numValue <= numMaxAmount;
    setIsAmountValid(valid);
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setAmount(value);
      validateAmount(value);
    }
  };

  // Handle confirm button click
  const handleConfirm = () => {
    // In a real app, this would call a contract method
    showFeedback(
      `${option === "tokenize" ? "Tokenized" : "Claimed"} ${amount} tokens for ${objectName}`,
      "success"
    );
  };

  // If object info is not loaded yet, show loading
  if (!objectInfo) {
    return (
      <div style={STYLES.container}>
        <h3 style={STYLES.header}>Loading...</h3>
      </div>
    );
  }

  return (
    <div style={STYLES.container}>
      {/* Header with object name */}
      <h3 style={STYLES.header}>{objectName}</h3>

      {/* Standing point coordinates with set waypoint button */}
      <div style={STYLES.row}>
        <span style={STYLES.label}>Standing Point:</span>
        <span style={STYLES.coordinates}>[{objectInfo.standingpoint.join(", ")}]</span>
        <button
          onClick={setWaypointInGame}
          style={STYLES.button}
        >
          📍 Set Waypoint
        </button>
      </div>

      {/* Options for tokenize and claim */}
      <div style={STYLES.optionsContainer}>
        <div style={STYLES.optionRow}>
          <button
            style={{
              ...STYLES.optionButton,
              ...(option === "tokenize" ? STYLES.optionButtonActive : {}),
            }}
            onClick={() => setOption("tokenize")}
          >
            Tokenize
          </button>
          <button
            style={{
              ...STYLES.optionButton,
              ...(option === "claim" ? STYLES.optionButtonActive : {}),
            }}
            onClick={() => setOption("claim")}
          >
            Claim
          </button>
        </div>
      </div>

      {/* Amount input and max amount display */}
      <div style={STYLES.inputRow}>
        <label style={STYLES.inputLabel}>Amount:</label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          style={STYLES.input}
          min="0"
          max={maxAmount !== "Loading..." ? maxAmount : undefined}
        />
        <div style={STYLES.maxAmount}>
          Max: {maxAmount}
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        style={{
          ...STYLES.confirmButton,
          opacity: isAmountValid ? 1 : 0.5,
          cursor: isAmountValid ? "pointer" : "not-allowed",
        }}
        disabled={!isAmountValid}
      >
        Confirm
      </button>
    </div>
  );
}