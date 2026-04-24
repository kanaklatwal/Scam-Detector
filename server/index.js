const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connect
mongoose.connect("mongodb://127.0.0.1:27017/scamDB");

const ResultSchema = new mongoose.Schema({
  url: String,
  prediction: String,
  riskScore: Number,
  checkedAt: { type: Date, default: Date.now }
});

const Result = mongoose.model("Result", ResultSchema);

// API
app.post("/check-url", async (req, res) => {
  try {
    const { url } = req.body;

    // Call Python ML API
    const response = await axios.post("http://localhost:8000/predict", { url });

    const { prediction, riskScore } = response.data;

    // Save in DB
    const saved = await Result.create({
      url,
      prediction,
      riskScore
    });

    res.json(saved);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));