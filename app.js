const express = require("express");
const cors = require("cors");

const eventRoute = require("./routers/eventRoute");
const accountRoute = require("./routers/accountRoute");

const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, //access-control-allow-credentials:true
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: "*",
};

app.use(cors(corsOptions));

app.use("/api/v3/event", eventRoute);
app.use("/api/v3/account", accountRoute);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

module.exports = app;
