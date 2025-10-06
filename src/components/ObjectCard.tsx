import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlayerPositionQuery } from "../common/usePlayerPositionQuery";
import { connectDustClient } from "dustkit/internal";
import { encodeBlock, objects, Vec3 } from "@dust/world/internal";
import { Button, InputNumber } from "antd";
import { usePlayerInventory } from "../common/usePlayerInventory";
import { InteractWithChest } from "../common/InteractWithChest";
import { useTokenBalance } from "../common/useTokenBalance";
import { usePlayerEntityId } from "../common/usePlayerEntityId";
import { Hex } from "viem";

// Define the props interface for the component
interface ObjectCardProps {
  objectName: string;
  showFeedback?: (message: string, type: "success" | "error" | "info") => void;
}

// Define the interface for the object info from vwa_info.json
interface ObjectInfo {
  icon: string;
  contract: string;
  coordinate: Vec3[];
  standingpoint: Vec3;
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
    backgroundColor: "#FFFFFF",
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
  const [option, setOption] = useState<"tokenize" | "claim">("claim");
  const [amount, setAmount] = useState<string>("0");
  const [maxAmount, setMaxAmount] = useState<string>("Loading...");
  const [isAmountValid, setIsAmountValid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Get the query client for invalidating queries
  const queryClient = useQueryClient();

  // Get the dust client
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });
  
  // Get player's entity ID
  const playerEntityIdQuery = usePlayerEntityId();
  
  // Get player's inventory for this object
  const inventoryQuery = usePlayerInventory(objectName);
  
  // Get token balance for the contract address in vwaInfo
  const tokenBalanceQuery = useTokenBalance(objectInfo?.contract || "");
  
  // Update maxAmount based on inventory when option changes or inventory data loads
  useEffect(() => {
    console.log("ww: inventoryQuery.data", inventoryQuery.data, tokenBalanceQuery.data);
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
        const rawVwaInfo = await import("../vwa_info.json").then(
          (module) => module.default
        );
        
        // Transform the raw data to ensure coordinate arrays are properly typed as Vec3[]
        const vwaInfo: VWAInfo = Object.entries(rawVwaInfo).reduce((acc, [key, value]) => {
          // Ensure each coordinate array item is properly typed as Vec3
          const objectInfo = value as any;
          const typedObjectInfo: ObjectInfo = {
            ...objectInfo,
            coordinate: objectInfo.coordinate.map((coords: number[]) => coords as Vec3),
            standingpoint: objectInfo.standingpoint as Vec3
          };
          
          acc[key] = typedObjectInfo;
          return acc;
        }, {} as VWAInfo);
        
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
    // This controls when the Confirm button is enabled/disabled
    const valid = numValue > 0 && numValue <= numMaxAmount;
    setIsAmountValid(valid);
  };

  // Handle amount change
  const handleAmountChange = (value: number | null) => {
    const stringValue = value?.toString() || "0";
    setAmount(stringValue);
    validateAmount(stringValue);
  };

  // Check if player is at standing point (exact position match)
  const isPlayerAtStandingPoint = (playerPos: { x: number; y: number; z: number }, standingPoint: Vec3): boolean => {
    return (
      playerPos.x === standingPoint[0] &&
      playerPos.y === standingPoint[1] &&
      playerPos.z === standingPoint[2]
    );
  };

  // Get player's current position
  const playerPositionQuery = usePlayerPositionQuery();

  // Handle confirm button click
  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (!dustClient.data) {
        showFeedback("Dust client not connected", "error");
        setLoading(false);
        return;
      }

      if (!objectInfo || !objectInfo.coordinate || objectInfo.coordinate.length === 0) {
        showFeedback("Object coordinates not available", "error");
        setLoading(false);
        return;
      }
      
      // Check if player is at the standing point
      if (playerPositionQuery.data && objectInfo.standingpoint) {
        if (!isPlayerAtStandingPoint(playerPositionQuery.data, objectInfo.standingpoint)) {
          showFeedback("You need to be exactly at the standing point to perform this action", "error");
          setLoading(false);
          return;
        }
      }

      // Get player entity ID
      const playerEntityId = playerEntityIdQuery.data;
      
      if (!playerEntityId) {
        showFeedback("Player entity ID not available", "error");
        setLoading(false);
        return;
      }

      // Get object type ID
      const objectTypeId = (objects.find(e => e.name === objectName))?.id;
      if (!objectTypeId) {
        showFeedback(`Object type ${objectName} not found`, "error");
        setLoading(false);
        return;
      }

      const numAmount = parseInt(amount);

      // Use the extracted InteractWithChest function
      await InteractWithChest(
        option,
        numAmount,
        objectInfo.coordinate as Vec3[],
        objectTypeId,
        playerEntityId as Hex,
        dustClient.data
      );
      
      // Reset amount field
      setAmount("0");

      // Wait 2sec
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Invalidate player inventory query to refresh inventory count
      queryClient.invalidateQueries({ queryKey: ["player-inventory", playerEntityId, objectName] });
      // Invalidate token balance query to refresh token balance
      queryClient.invalidateQueries({ queryKey: ["tokenBalance", objectInfo.contract, playerEntityId] });

      // Show success message
      showFeedback(
        `${option === "tokenize" ? "Tokenized" : "Claimed"} ${amount} ${objectName} successfully`,
        "success"
      );
      
      setLoading(false);
    } catch (error: any) {
      console.error("Transfer error:", error);
      showFeedback(
        `Failed to ${option === "tokenize" ? "tokenize" : "claim"} ${objectName}: ${error.message || "Unknown error"}`,
        "error"
      );
      setLoading(false);
    }
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
      <h3 style={STYLES.header}>
        <img
          src={objectInfo.icon}
          alt={`${objectName} icon`}
          style={{
            width: '20px',
            height: '20px',
            marginRight: '8px',
            verticalAlign: 'middle'
          }}
        />
        {objectName}
      </h3>

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
              ...(option === "claim" ? STYLES.optionButtonActive : {}),
            }}
            onClick={() => setOption("claim")}
          >
            Claim
          </button>
          <button
            style={{
              ...STYLES.optionButton,
              ...(option === "tokenize" ? STYLES.optionButtonActive : {}),
            }}
            onClick={() => setOption("tokenize")}
          >
            Tokenize
          </button>
        </div>
      </div>

      {/* Amount input and max amount display */}
      <div style={STYLES.inputRow}>
        <label style={STYLES.inputLabel}>Amount:</label>
        <InputNumber
          value={parseInt(amount) || 0}
          onChange={handleAmountChange}
          style={{ ...STYLES.input, width: '100%' }}
          min={0}
          max={maxAmount !== "Loading..." ? parseInt(maxAmount) : undefined}
          controls
          keyboard
          precision={0}
          step={1}
          stringMode={false}
          disabled={loading || maxAmount === "Loading..."}
        />
        <div style={STYLES.maxAmount}>
          Max: {Number(maxAmount).toFixed(0)} 
        </div>
      </div>

      {/* Confirm button */}
      <Button
        type="primary"
        danger
        onClick={handleConfirm}
        style={{
          ...STYLES.confirmButton,
        }}
        disabled={!isAmountValid}
        loading={loading}
      >
        Confirm
      </Button>
    </div>
  );
}