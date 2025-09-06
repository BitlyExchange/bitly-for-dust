import React from 'react';

export function NewsTab() {
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
          color: "#FFAA00",
          fontSize: "1.8rem",
          marginBottom: "15px",
          textAlign: "center",
          textShadow: "2px 2px #3F3F3F",
        }}
      >
        News
      </h2>
      <iframe
        src="https://www.bitly.exchange/news?embed=true"
        title="Bitly News"
        width="100%"
        height="600px"
        style={{ border: "none" }}
      />
    </div>
  );
}