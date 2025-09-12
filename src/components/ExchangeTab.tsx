import React, { useState, useEffect } from "react";

export function ExchangeTab() {
  const [activeTab, setActiveTab] = useState("cityCurrencies");
  const [iframeHeight, setIframeHeight] = useState("calc(100vh - 120px)");

  // Update iframe height on window resize
  useEffect(() => {
    const updateHeight = () => {
      setIframeHeight(`calc(200vh + 120px)`);
    };
    
    window.addEventListener('resize', updateHeight);
    updateHeight();
    
    return () => window.removeEventListener('resize', updateHeight);
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
        maxWidth: "100%",
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2
        style={{
          color: "#5DADE2",
          fontSize: "1.8rem",
          marginBottom: "15px",
          textAlign: "center",
          textShadow: "2px 2px #3F3F3F",
        }}
      >
        Exchange
      </h2>

      {/* User Manual Link - Highlighted */}
      <div style={{
        marginBottom: "20px",
        backgroundColor: "#4A4A4A",
        border: "2px solid #5DADE2",
        borderRadius: "4px",
        padding: "10px",
        display: "flex",
        alignItems: "center"
      }}>
        <a
          href="https://docs.bitly.exchange/exchange/for_trader"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#5DADE2",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            fontWeight: "bold"
          }}
          onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
          onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
        >
          📖 User Manual
        </a>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        borderBottom: "2px solid #555555",
        marginBottom: "15px"
      }}>
        <button
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            color: activeTab === "cityCurrencies" ? "#55FF55" : "#AAAAAA",
            borderBottom: activeTab === "cityCurrencies" ? "2px solid #55FF55" : "none",
            fontFamily: "'Minecraft', monospace",
            fontSize: "1rem",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={() => setActiveTab("cityCurrencies")}
        >
          City Currencies
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            color: activeTab === "vwaTokens" ? "#55FF55" : "#AAAAAA",
            borderBottom: activeTab === "vwaTokens" ? "2px solid #55FF55" : "none",
            fontFamily: "'Minecraft', monospace",
            fontSize: "1rem",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("vwaTokens")}
        >
          VWA Tokens
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeTab === "cityCurrencies" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Highlighted Note */}
            <div style={{
              backgroundColor: "#4A4A4A",
              border: "2px solid #FFCC00",
              borderRadius: "4px",
              padding: "10px",
              marginBottom: "15px",
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{ marginRight: "10px", color: "#FFCC00", fontWeight: "bold" }}>Note:</span>
              <span>
                You can also choose to click {" "}
                <a
                  href="https://token.bitly.exchange/dashboard/markets?networkId=690&marketName=dust_currency"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#5DADE2",
                    textDecoration: "none",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                  this link
                </a>
                {" "} to trade
              </span>
            </div>
            <div style={{
              flex: 1,
              border: "2px solid #555555",
              borderRadius: "4px",
              height: iframeHeight,
              overflow: "hidden"
            }}>
              <iframe
                src="https://verify.walletconnect.com/"
                style={{
                  width: "0px",
                  height: "0px",
                  border: "none"
                }}
              />
              <iframe
                src="https://token.bitly.exchange/dashboard/markets?networkId=690&marketName=dust_currency"
                style={{
                  width: "100%",
                  height:"700px",
                  border: "none"
                }}
                title="City Currencies Dashboard"
              />
            </div>
          </div>
        )}
        {activeTab === "vwaTokens" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Highlighted Note */}
            <div style={{
              backgroundColor: "#4A4A4A",
              border: "2px solid #FFCC00",
              borderRadius: "4px",
              padding: "10px",
              marginBottom: "15px",
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{ marginRight: "10px", color: "#FFCC00", fontWeight: "bold" }}>Note:</span>
              <span>
                You can also choose to click {" "}
                <a
                  href="https://token.bitly.exchange/dashboard/markets?networkId=690&marketName=dust_vwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#5DADE2",
                    textDecoration: "none",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                  this link
                </a>
                {" "} to trade
              </span>
            </div>
            <div style={{
              flex: 1,
              border: "2px solid #555555",
              borderRadius: "4px",
              height: iframeHeight,
              overflow: "hidden"
            }}>
              <iframe
                src="https://verify.walletconnect.com/"
                style={{
                  width: "0px",
                  height: "0px",
                  border: "none"
                }}
              />
              <iframe
                src="https://token.bitly.exchange/dashboard/markets?networkId=690&marketName=dust_vwa"
                style={{
                  width: "100%",
                  height:"700px",
                  border: "none"
                }}
                title="VWA Tokens Dashboard"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}