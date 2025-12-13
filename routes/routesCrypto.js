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

// add a new crypto, After discussion with lecturer , user side add feature
router.post("/cryptos", async (req, res) => {
    try {
      const { name, symbol, price, marketCap, monthlyHigh, monthlyLow } = req.body;
  
      // create the crypto
      const newCrypto = await Crypto.create({
        name,
        symbol,
        price,
        marketCap,
        monthlyHigh,
        monthlyLow
      });
  
      // generate simple price history (30 days) like i did in seed.js
      const history = [];
      let current = price * 0.95;
  
      for (let i = 30; i >= 1; i--) {
        const change = (Math.random() * 6 - 3) / 100;
        current = current + current * change;
  
        const date = new Date();
        date.setDate(date.getDate() - i);
  
        history.push({
          cryptoId: newCrypto._id,
          date: date,
          price: parseFloat(current.toFixed(2))
        });
      }
  
      await PriceHistory.insertMany(history);
  
      res.json(newCrypto);
  
    } catch (err) {
      console.error("Error adding crypto:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  

// update crypto details, user side sdit feature
router.put("/cryptos/:id", async (req, res) => {
    try {
      const { price, marketCap, monthlyHigh, monthlyLow } = req.body;
  
      const updatedCrypto = await Crypto.findByIdAndUpdate(
        req.params.id,
        {
          price,
          marketCap,
          monthlyHigh,
          monthlyLow
        },
        { new: true }
      );
  
      if (!updatedCrypto) {
        return res.status(404).json({ message: "Crypto not found" });
      }
  
      res.json(updatedCrypto);
  
    } catch (err) {
      console.error("Error updating crypto:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

// delete crypto and its price history, user side delete feature
router.delete("/cryptos/:id", async (req, res) => {
    try {
      const deletedCrypto = await Crypto.findByIdAndDelete(req.params.id);
  
      if (!deletedCrypto) {
        return res.status(404).json({ message: "Crypto not found" });
      }
  
      // also delete price history for this crypto
      await PriceHistory.deleteMany({ cryptoId: req.params.id });
  
      res.json({ message: "Crypto deleted" });
  
    } catch (err) {
      console.error("Error deleting crypto:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
module.exports = router;
