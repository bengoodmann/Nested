const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");

const fs = require("fs");
const path = require("path");

const staticDir = path.join(__dirname, "public");

const dbConnector = require("./db");
const { userVerification } = require("./controllers/userController");

require("dotenv").config();

const port = process.env.PORT;

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  {
    flags: "a",
  }
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(morgan("common", { stream: accessLogStream }));
app.use(express.static(staticDir));

app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/task", require("./routes/taskRoutes"));
app.get("/verify/:verificationToken", userVerification);

dbConnector();
app.listen(port, () => {
  console.log(`Server started at port:${port}`);
});
