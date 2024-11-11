const express = require("express");
const path = require("path");

const app = express();
const PORT = 8000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`UI server running on http://localhost:${PORT}`);
});
