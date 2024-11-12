const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8001;

// Enable CORS for requests from http://localhost:8000
app.use(cors({
  origin: "http://localhost:8000"
}));

// Route to handle temperature requests for a given city
app.get("/temperature/:city", (req, res) => {
  const city = req.params.city;
  const temperature = (Math.random() * 50 - 10).toFixed(2); // Temperature between -10 and 40

  // Send the temperature data as JSON
  res.json({ city, temperature });
});

app.listen(PORT, () => {
  console.log(`Polling server running on http://localhost:${PORT}`);
});
