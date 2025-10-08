import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ textAlign: "center", color: "white", marginTop: "50px" }}>
      <h1>🎨 VR 3D Gallery veikia!</h1>
      <p>Čia netrukus bus tavo paveikslų galerija 🖼️</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);