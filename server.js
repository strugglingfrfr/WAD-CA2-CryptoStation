const cryptoRoutes = require("./routes/routesCrypto");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// Allow JSON in requests
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "frontEnd")));

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/cryptoDB")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB error:", err));

// Routes
app.use("/api", cryptoRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
