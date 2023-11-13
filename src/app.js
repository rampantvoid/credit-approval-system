require("dotenv/config");
const express = require("express");
const app = express();
const InjestData = require("./utils/injest");
const router = require("./routes/register");
const { initializeDatasource } = require("./db/datasource");

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api", router);

app.listen(PORT, async () => {
  await initializeDatasource();
  await InjestData();

  console.log(`Server listening on port ${PORT}`);
});
