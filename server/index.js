const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// simple test API
app.post("/check-url", async (req, res) => {
  try {
    const { url } = req.body;

    // TEMP response (fake)
    res.json({
      url,
      prediction: "safe",
      riskScore: 20
    });

  } catch (error) {
    res.status(500).json({ error: "error" });
  }
});

// IMPORTANT (Render ke liye)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});