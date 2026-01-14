require('dotenv').config({ path: '/www/wwwroot/Sales_Order_Furniture_Server/.env' });
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const logger = require("./utils/logger");
const httpLogger = require("./Middleware/httpLogger");
const SignupRoute = require("./Router/SignupRoute");
const LoginRoute = require("./Router/LoginRoute");
const dbconnect = require("./utils/dbconnect");
const Routes = require("./Router/Routes");
const Controller = require("./Controller/Logic");
const allowedOrigins = process.env.API_URL.split(",");
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO 
Controller.initSocket(server);

// CORS configuration
const corsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(httpLogger); // Register HTTP logger first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Routes
app.use("/api", Routes);
app.use("/auth", LoginRoute);
app.use("/user", SignupRoute);

// Start server after DB connection
const PORT = process.env.PORT || 6000;
dbconnect()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`App listening on port ${PORT}!`);
    });
  })
  .catch((error) => {
    logger.error("Database connection failed", error);
    process.exit(1);
  });
