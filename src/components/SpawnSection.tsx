import { Vec3 } from "@dust/world/internal";
import React, { useState, useEffect, useRef } from "react";
import { Card, InputNumber, Button, Statistic, Row, Col, Typography } from "antd";
import { fetchForceFieldData, calculateUpdatedEnergy } from "../common/forceFieldEnergy";
import { spawnPlayer } from "../common/spawnPlayer";
import { useDustClient } from "../common/useDustClient";
import { usePlayerEntityId } from "../common/usePlayerEntityId";
import { useTokenBalance } from "../common/useTokenBalance";

const { Title, Text } = Typography;

// Constants
const Constants = {
  ORIGIN_ENERGY_POINT: 1n * 1000n * 1000n * 100000000000000n // 1M energy
};

export const SPAWN_TILE: Vec3 = [223, 71, -2681];
export const MAX_PLAYER_ENERGY = 8176;

// ForceField coordinates
const forceFieldCoordinates: [number, number, number] = [226, 71, -2680];

// BETToken address
const BET_TOKEN_CONTRACT_ADDRESS = "0x9e9dDaEc378d9202f31685472Feb32c488De3313";

export function SpawnSection() {
  const { data: dustClient } = useDustClient();
  const { data: playerEntityId } = usePlayerEntityId();
  const { data: tokenBalance = 0, isLoading: isLoadingBalance } = useTokenBalance(BET_TOKEN_CONTRACT_ADDRESS);
  
  // Energy data state
  const [energyData, setEnergyData] = useState({
    energy: null as number | null,
    loading: true,
    error: null as string | null,
  });
  
  // Current energy state that will be updated dynamically
  const [currentEnergy, setCurrentEnergy] = useState<number | null>(null);
  
  // Multiplier state
  const [multiplier, setMultiplier] = useState<number | null>(null);
  
  // Spawn energy percentage
  const [spawnEnergyPercent, setSpawnEnergyPercent] = useState<number>(10); // Default 10%
  
  // Cost calculation
  const [costAmount, setCostAmount] = useState<number>(0);
  
  // Loading state for spawn action
  const [isSpawning, setIsSpawning] = useState(false);
  
  // Last update timestamp
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  // Fetch energy data
  useEffect(() => {
    const loadEnergyData = async () => {
      try {
        setEnergyData(prev => ({ ...prev, loading: true, error: null }));
        
        // Fetch force field data
        const data = await fetchForceFieldData(forceFieldCoordinates);
        
        setEnergyData({
          energy: data.energy,
          loading: false,
          error: null
        });
        
        // Initialize current energy
        setCurrentEnergy(data.energy);
        lastUpdateTimeRef.current = Date.now();
      } catch (error) {
        console.error("Error fetching energy data:", error);
        setEnergyData({
          energy: null,
          loading: false,
          error: "Failed to fetch energy data"
        });
      }
    };
    
    loadEnergyData();
    
    // Set up interval to update energy consumption
    const intervalId = setInterval(() => {
      setCurrentEnergy(prevEnergy => {
        if (prevEnergy === null) return prevEnergy;
        
        // Calculate time elapsed since last update
        const now = Date.now();
        const elapsedMs = now - lastUpdateTimeRef.current;
        
        // Update last update time
        lastUpdateTimeRef.current = now;
        
        // Calculate new energy value - assuming 10 fragments for this example
        // In a real implementation, you would use the actual fragment count
        return calculateUpdatedEnergy(prevEnergy, 10, elapsedMs);
      });
    }, 1000); // Update every second
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Calculate multiplier whenever energy changes
  useEffect(() => {
    if (currentEnergy !== null && currentEnergy > 0) {
      // Convert BigInt to number for calculation
      const originEnergyPoint = Number(Constants.ORIGIN_ENERGY_POINT) / 10**14;
      const calculatedMultiplier = originEnergyPoint / currentEnergy;
      setMultiplier(calculatedMultiplier);
      
      // Update cost based on current multiplier and spawn energy percentage
      if (spawnEnergyPercent > 0) {
        setCostAmount(MAX_PLAYER_ENERGY * calculatedMultiplier * spawnEnergyPercent / 100);
      }
    }
  }, [currentEnergy, spawnEnergyPercent]);
  
  // Update cost when spawn energy percentage changes
  useEffect(() => {
    if (multiplier !== null && spawnEnergyPercent > 0) {
      setCostAmount(MAX_PLAYER_ENERGY * multiplier * spawnEnergyPercent / 100);
    }
  }, [multiplier, spawnEnergyPercent]);
  
  // Handle spawn action
  const handleSpawn = async () => {
    if (!dustClient || !playerEntityId || spawnEnergyPercent <= 0) {
      return;
    }
    
    try {
      setIsSpawning(true);
      
      // Convert percentage to decimal (0-1 range)
      const energyPercentDecimal = spawnEnergyPercent / 100;
      
      console.log("ww: param: ", energyPercentDecimal, SPAWN_TILE, playerEntityId, dustClient);

      await spawnPlayer(
        energyPercentDecimal,
        SPAWN_TILE,
        playerEntityId,
        dustClient
      );
      
      // Success message or state update
      console.log("Spawn successful!");
    } catch (error) {
      console.error("Error spawning:", error);
    } finally {
      setIsSpawning(false);
    }
  };
  
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
        Spawn Section
      </h3>
      
      {energyData.loading ? (
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
            Loading energy data...
          </span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : energyData.error ? (
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
            Error: {energyData.error}
          </span>
        </div>
        ) : (
        <Row gutter={[16, 16]}>
            {/* Left side - Multiplier Card */}
            <Col xs={24} md={10}>
              <Card
                style={{
                  height: "100%",
                  background: "linear-gradient(145deg, #1A1A1A 0%, #151515 100%)",
                  border: "1px solid #333333",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  overflow: "hidden",
                  position: "relative"
                }}
                bodyStyle={{ padding: "24px", height: "100%" }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "80px",
                  height: "80px",
                  background: "radial-gradient(circle at top right, rgba(85, 255, 255, 0.1), transparent 70%)",
                  pointerEvents: "none"
                }} />
                
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <Title level={4} style={{
                    color: "#55FFFF",
                    marginBottom: "8px",
                    fontSize: "1.2rem",
                    fontWeight: "500"
                  }}>
                    Energy Multiplier
                  </Title>
                  <div style={{
                    fontSize: "3rem",
                    fontWeight: "700",
                    color: "#FFAA00",
                    textShadow: "0 0 10px rgba(255, 170, 0, 0.3)",
                    lineHeight: "1.2"
                  }}>
                    {multiplier !== null ? (multiplier * 100).toFixed(2) : "..."}
                    <span style={{ fontSize: "1.8rem" }}>%</span>
                  </div>
                  <Text style={{ color: "#999999", fontSize: "0.9rem" }}>
                    Lower FF Energy = Higher multiplier = higher cost
                  </Text>
                </div>
                
                <div style={{
                  marginTop: "24px",
                  padding: "12px",
                  background: "rgba(255, 170, 0, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 170, 0, 0.2)"
                }}>
                  <Text style={{ color: "#BBBBBB", fontSize: "0.9rem", display: "block", textAlign: "center" }}>
                    Multiplier is based on current force field energy levels
                  </Text>
                </div>
              </Card>
            </Col>
            
            {/* Right side - Spawn Controls */}
            <Col xs={24} md={14}>
              <Card
                style={{
                  height: "100%",
                  background: "linear-gradient(145deg, #1A1A1A 0%, #151515 100%)",
                  border: "1px solid #333333",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
                }}
                bodyStyle={{ padding: "24px" }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <Text style={{
                    color: "#55FFFF",
                    display: "block",
                    marginBottom: "10px",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}>
                    Spawn Energy Percentage
                  </Text>
                  <InputNumber
                    min={1}
                    max={30}
                    defaultValue={10}
                    style={{
                      width: "100%",
                      height: "40px"
                    }}
                    onChange={(value) => setSpawnEnergyPercent(value || 0)}
                    addonAfter={<span style={{ fontWeight: "bold" }}>%</span>}
                  />
                  <div style={{
                    marginTop: "8px",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <Text style={{ color: "#999999", fontSize: "0.8rem" }}>Min: 1%</Text>
                    <Text style={{ color: "#999999", fontSize: "0.8rem" }}>Max: 30%</Text>
                  </div>
                </div>
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div style={{
                      marginBottom: "16px",
                      background: "rgba(255, 170, 0, 0.05)",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 170, 0, 0.1)"
                    }}>
                      <Text style={{
                        color: "#55FFFF",
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "0.9rem"
                      }}>
                        Cost Amount
                      </Text>
                      <div style={{
                        fontSize: "1.6rem",
                        fontWeight: "600",
                        color: "#FFAA00",
                        lineHeight: "1.2"
                      }}>
                        {costAmount.toFixed(2)}
                      </div>
                      <Text style={{ color: "#999999", fontSize: "0.8rem" }}>
                        Tokens required
                      </Text>
                    </div>
                  </Col>
                  
                  <Col span={12}>
                    <div style={{
                      marginBottom: "16px",
                      background: tokenBalance >= costAmount ? "rgba(82, 196, 26, 0.05)" : "rgba(255, 77, 79, 0.05)",
                      padding: "12px",
                      borderRadius: "8px",
                      border: tokenBalance >= costAmount ? "1px solid rgba(82, 196, 26, 0.1)" : "1px solid rgba(255, 77, 79, 0.1)"
                    }}>
                      <Text style={{
                        color: "#55FFFF",
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "0.9rem"
                      }}>
                        Your Balance
                      </Text>
                      <div style={{
                        fontSize: "1.6rem",
                        fontWeight: "600",
                        color: tokenBalance >= costAmount ? "#52c41a" : "#ff4d4f",
                        lineHeight: "1.2"
                      }}>
                        {isLoadingBalance ? "..." : tokenBalance.toFixed(2)}
                      </div>
                      <Text style={{
                        color: tokenBalance >= costAmount ? "#52c41a" : "#ff4d4f",
                        fontSize: "0.8rem"
                      }}>
                        {tokenBalance >= costAmount ? "Sufficient" : "Insufficient"}
                      </Text>
                    </div>
                  </Col>
                </Row>
                
                <Button
                  type="primary"
                  size="large"
                  style={{
                    width: "100%",
                    height: "48px",
                    marginTop: "8px",
                    background: tokenBalance >= costAmount ?
                      "linear-gradient(135deg, #FFAA00 0%, #FF7700 100%)" :
                      "linear-gradient(135deg, #555555 0%, #444444 100%)",
                    borderColor: tokenBalance >= costAmount ? "#FF7700" : "#444444",
                    boxShadow: tokenBalance >= costAmount ?
                      "0 4px 12px rgba(255, 170, 0, 0.3)" :
                      "none",
                    fontSize: "1.1rem",
                    fontWeight: "600"
                  }}
                  loading={isSpawning}
                  disabled={!dustClient || !playerEntityId || tokenBalance < costAmount}
                  onClick={handleSpawn}
                >
                  {isSpawning ? "Spawning..." : "Spawn Player"}
                </Button>
                
                {tokenBalance < costAmount && (
                  <div style={{
                    marginTop: "12px",
                    textAlign: "center",
                    color: "#ff4d4f",
                    fontSize: "0.9rem"
                  }}>
                    Insufficient token balance to spawn
                  </div>
                )}
              </Card>
            </Col>
          </Row>
      )}
    </div>
  );
}