const express = require("express");
const cors = require("cors");

const eventRoute = require("./routers/eventRoute");
const accountRoute = require("./routers/accountRoute");

const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:3000",
  "http://eventdtl.in",
  "http://www.eventdtl.in",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, //access-control-allow-credentials:true
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use("/api/v3/event", eventRoute);
app.use("/api/v3/account", accountRoute);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

module.exports = app;
