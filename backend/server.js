const express = require("express");
const cors = require("cors");
const quotesRouter = require("./routes/quotes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/quotes", quotesRouter);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ errors: ["Request body is not valid JSON."] });
  console.error(err);
  res.status(500).json({ errors: ["Something went wrong on the server."] });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`HealthCoverSim API on http://localhost:${PORT}`));
}
module.exports = app;