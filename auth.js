const app = require("express")();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const config = require("./config/db");
const router = require("./routes/user.routes");
const cookieParser = require("cookie-parser");

mongoose.connect(config.DB, { useNewUrlParser: true }).then(
    function () {
        console.log("Database is connected");
    },
    function (err) {
        console.log("Can not connect to the database" + err);
    }
);

app.use(passport.initialize());
require("./passport")(passport);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser())

app.use("/api/auth", router); // < ======= HERE WAS THE ERROR, i was using ./api/users

app.get("/", (req, res) => {
        res.send(`Welcome from Auth service`);
});

// io.on('connection', socket=> console.log(`New user connected`))

var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log("AUTH Server is runing on PORT " + PORT);
});
