const mongoose = require("mongoose");

const cryptoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  marketCap: { type: Number, required: true },
  monthlyHigh: { type: Number, required: true },
  monthlyLow: { type: Number, required: true }
});

module.exports = mongoose.model("Crypto", cryptoSchema);
