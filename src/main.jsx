import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { start, settle } from "./store.js";
import "./styles.css";

// send what is waiting and take the server's copy before the app reads her progress; offline, or slower than 2.5 s,
// it opens with what the phone has (the waiting changes go up later, see store.js)
Promise.race([start().catch(() => {}), new Promise(r => setTimeout(r, 2500))]).then(() => {
  settle();
  createRoot(document.getElementById("root")).render(<App />);
});
