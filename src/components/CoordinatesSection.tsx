import { useQuery } from "@tanstack/react-query";
import { connectDustClient } from "dustkit/internal";
import { encodeBlock } from "@dust/world/internal";
import { useState, useEffect } from "react";

// Define location data constants
interface LocationData {
  name: string;
  coordinates: [number, number, number];
}

const LOCATIONS: LocationData[] = [
  {
    name: "Force Field",
    coordinates: [226, 71, -2680],
  },
  {
    name: "Southern Bay",
    coordinates: [360, 69, -2459],
  },
  {
    name: "Campfire Spot",
    coordinates: [384, 70, -2458],
  }
];

// Define styling constants
const STYLES = {
  container: {
    backgroundColor: "#2A2A2A",
    padding: "15px",
    borderRadius: "4px",
    border: "2px solid #555555",
    marginBottom: "20px",
  },
  heading: {
    color: "#FFAA00",
    marginBottom: "10px",
    fontSize: "1.4rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    margin: "0",
  },
  tableHeader: {
    textAlign: "left" as const,
    padding: "8px 5px",
    borderBottom: "2px solid #444444",
    color: "#55FFFF",
  },
  tableRow: {
    borderBottom: "1px solid #444444",
  },
  locationCell: {
    padding: "10px 5px",
    color: "#55FFFF",
    fontWeight: "bold",
  },
  coordinatesCell: {
    padding: "10px 5px",
    textAlign: "center" as const,
  },
  actionCell: {
    padding: "10px 5px",
    textAlign: "right" as const,
  },
  button: {
    padding: "6px 12px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.9rem",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(76, 175, 80, 0.3)",
  },
};

interface CoordinatesSectionProps {
  showFeedback: (message: string, type: "success" | "error" | "info") => void;
}

export function CoordinatesSection({ showFeedback }: CoordinatesSectionProps) {
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });

  // Set waypoint in game
  const setWaypointInGame = async (coordinates: [number, number, number], label: string) => {
    try {
      // Use encodeBlock to convert coordinates to entityId
      const entityId = encodeBlock(coordinates);
      
      await dustClient.data?.provider.request({
        method: "setWaypoint",
        params: {
          entity: entityId as `0x${string}`,
          label,
        },
      });
      
      console.log(`✅ Waypoint set: ${label} at [${coordinates.join(", ")}]`);
      showFeedback(`Waypoint "${label}" has been set in the game!`, "success");
      return true;
    } catch (error) {
      console.error("Error setting waypoint:", error);
      showFeedback(
        `Failed to set waypoint "${label}" in the game.`,
        "error"
      );
      return false;
    }
  };

  return (
    <div style={STYLES.container}>
      <h3 style={STYLES.heading}>
        Coordinates
      </h3>
      <table style={STYLES.table}>
        <thead>
          <tr>
            <th style={{...STYLES.tableHeader, textAlign: "left"}}>Location</th>
            <th style={{...STYLES.tableHeader, textAlign: "center"}}>Coordinates</th>
            <th style={{...STYLES.tableHeader, textAlign: "right"}}>Action</th>
          </tr>
        </thead>
        <tbody>
          {LOCATIONS.map((location, index) => (
            <tr key={index} style={index < LOCATIONS.length - 1 ? STYLES.tableRow : {}}>
              <td style={STYLES.locationCell}>{location.name}</td>
              <td style={STYLES.coordinatesCell}>[{location.coordinates.join(", ")}]</td>
              <td style={STYLES.actionCell}>
                <button
                  onClick={() => setWaypointInGame(location.coordinates, location.name)}
                  style={STYLES.button}
                >
                  📍 Set Waypoint
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}