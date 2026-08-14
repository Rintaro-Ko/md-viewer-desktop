// Must precede App (and therefore App.css), which overrides some of these :root values.
import "@rk-design/tokens/tokens.vars.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
