const mongoose = require("mongoose");
const Crypto = require("./models/crypto");
const PriceHistory = require("./models/priceHistory");

mongoose.connect("mongodb://localhost:27017/cryptoDB")
  .then(() => console.log("DB Connected"))
  .catch(err => console.log("DB Error:", err));



//realistic base price for the cryptos
const cryptoData = [
  { name: "Bitcoin", symbol: "BTC", price: 45000, marketCap: 850000000000, monthlyHigh: 47000, monthlyLow: 42000 },
  { name: "Ethereum", symbol: "ETH", price: 2300, marketCap: 280000000000, monthlyHigh: 2500, monthlyLow: 2100 },
  { name: "Solana", symbol: "SOL", price: 110, marketCap: 48000000000, monthlyHigh: 125, monthlyLow: 90 },
  { name: "XRP", symbol: "XRP", price: 0.62, marketCap: 33000000000, monthlyHigh: 0.70, monthlyLow: 0.50 },
  { name: "BNB", symbol: "BNB", price: 320, marketCap: 49000000000, monthlyHigh: 350, monthlyLow: 300 }
];


// function to generate  month datat for thh graph
function generateHistory(basePrice) {
  const history = [];
  let current = basePrice * 0.95; // start slightly lower so graph rises naturally

  for (let i = 30; i >= 1; i--) {
    // daily % change between -3% to +3% (realistic)
    const change = (Math.random() * 6 - 3) / 100;
    current = current + current * change;

    const date = new Date();
    date.setDate(date.getDate() - i);

    history.push({
      date: date,
      price: parseFloat(current.toFixed(2))
    });
  }

  return history;
}


//seeding function
async function seedDatabase() {
  try {
    console.log("Clearing old data...");
    await Crypto.deleteMany({});
    await PriceHistory.deleteMany({});

    console.log("Inserting cryptos...");
    const insertedCryptos = await Crypto.insertMany(cryptoData);

    console.log("Generating price history...");
    const allHistory = [];

    insertedCryptos.forEach(crypto => {
      const history = generateHistory(crypto.price);
      history.forEach(h => {
        allHistory.push({
          cryptoId: crypto._id,
          date: h.date,
          price: h.price
        });
      });
    });

    await PriceHistory.insertMany(allHistory);

    console.log("Seeding complete!");
    mongoose.connection.close();
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

seedDatabase();
