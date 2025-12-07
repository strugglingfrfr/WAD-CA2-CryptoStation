const express = require("express");
const router = express.Router();

const Crypto = require("../models/crypto");
const PriceHistory = require("../models/priceHistory");



// get all cryptos routes for the main landing page
router.get("/cryptos", async (req, res) => {
  try {
    const cryptos = await Crypto.find({});
    res.json(cryptos);
  } catch (err) {
    console.error("Error getting cryptos:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// get one crypto by id for second page which has more details 
router.get("/cryptos/:id", async (req, res) => {
  try {
    const crypto = await Crypto.findById(req.params.id);

    if (!crypto) {
      return res.status(404).json({ message: "Crypto not found" });
    }

    res.json(crypto);
  } catch (err) {
    console.error("Error getting crypto:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// get price history the graph (chart.js data)
router.get("/history/:id", async (req, res) => {
  try {
    const history = await PriceHistory.find({ cryptoId: req.params.id }).sort({ date: 1 });

    if (!history) {
      return res.status(404).json({ message: "No history found" });
    }

    // Build Chart.js-friendly arrays
    const labels = history.map(record => record.date.toISOString().split("T")[0]);
    const prices = history.map(record => record.price);

    res.json({ labels, prices });

  } catch (err) {
    console.error("Error getting history:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
