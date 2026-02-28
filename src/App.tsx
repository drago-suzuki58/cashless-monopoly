import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Bank from "./pages/Bank";
import Player from "./pages/Player";

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen w-full md:max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bank" element={<Bank />} />
          <Route path="/player" element={<Player />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
