import { useState, useEffect } from "react";

export default function AdminPage() {
  const [pinInput, setPinInput] = useState("");
  const [ok, setOk] = useState(false);
  const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("admin_ok");
    if (saved === "1") setOk(true);
  }, []);

  function checkPin(e) {
    e.preventDefault();
    if (pinInput === PIN && PIN) {
      localStorage.setItem("admin_ok", "1");
      setOk(true);
    } else {
      alert("PIN inválido");
    }
  }

  if (!ok)
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <form
          onSubmit={checkPin}
          style={{
            padding: "2rem",
            borderRadius: "1rem",
            border: "1px solid #ddd",
            background: "#fff",
          }}
        >
          <h2>Acesso ao Painel</h2>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN"
            style={{ display: "block", marginTop: "1rem", padding: "0.5rem" }}
          />
          <button
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#6D28D9",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Painel Roxo Sabor</h1>
      <p>Parabéns, acesso liberado 🎉</p>
      <a href="/">← Voltar ao site</a>
    </div>
  );
}