const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema({
  cryptoId: { type: mongoose.Schema.Types.ObjectId, ref: "Crypto", required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true }
});

module.exports = mongoose.model("PriceHistory", priceHistorySchema);
