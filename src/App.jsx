import React, { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
const handleAsk = async () => {

  console.log(import.meta.env.VITE_API_URL);

  const res = await fetch(import.meta.env.VITE_API_URL + "/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: input,
      systemPrompt: "Explain in simple steps",
    }),
  });

  const data = await res.json();
  setResponse(data.text);
};
  return (
    <div style={{ padding: "20px" }}>
      <h1>Sign Language Tutor 🤟</h1>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type something..."
        style={{ padding: "10px", width: "300px" }}
      />

      <br /><br />

      <button onClick={handleAsk}>Ask AI</button>

      <p>{response}</p>
    </div>
  );
}

export default App;