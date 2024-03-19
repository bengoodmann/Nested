const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");

const fs = require("fs");
const path = require("path");

const dbSync = require("./dbSetup");
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

app.use("/api/user", require("./routes/userRoutes"));
app.get("/verify/:verificationToken", userVerification);





dbSync.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server started at port:${port}`);
  });
});
