const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
const checkToken = require("../validation/checkToken");
const secret = require("../config/secret");

const User = require("../models/User.model");

router.post("/login", (req, res) => {
	const { errors, isValid } = validateLoginInput(req.body);

	if (!isValid) return res.status(400).json(errors);

	const email = req.body.email;
	const password = req.body.password;

	User.findOne({ email })
		.then(user => {
			if (!user) {
				errors.email = "User not found";
				return res.status(404).json(errors);
			}
			bcrypt.compare(password, user.password).then(isMatch => {
				if (isMatch) {
					const payload = { id: user.id };
					jwt.sign(payload, secret.key, (err, token) => {
						if (err)
							console.error("There is some error in token", err);
						else {
							res.cookie(
                                "jwToken", 
                                token, 
                                // { httpOnly: true }
                                );
							res.json({
								name: user.name,
								email: user.email,
								avatar: user.avatar,
								id: user._id,
								lang: user.lang,
								success: true
							});
						}
					});
				} else {
					errors.password = "Incorrect Password";
					return res.status(400).json(errors);
				}
			});
		})
		.catch(e => {
			console.log("err at login", e);
			res.status(400).json("error at login");
        });
});

router.get("/validatingUser", checkToken, (req, res) => {
	let userId = "";
	jwt.verify(req.token, secret.key, (err, authorizedData) => {
		//If token is successfully verified, we can send the autorized data
		if (err) console.log(err);
		else {
			userId = authorizedData.id;
		}
	});
	console.log("req.query = \n", req.query, "user ID= \n", userId);
	if (
		Object.entries(req.query).length === 0 &&
		req.query.constructor === Object
	) {
		console.log("verifyn ACTIVE user");
		User.findOne({ _id: userId }, { password: 0, date: 0 })
			.then(info => {
				if (!info) {
					console.log("info WASN'T FOUND");
					return res.status(404).json(errors);
				} else {
					console.log("-- - - - - - - - - - - - - -\n", info);
					res.json(info);
				}
			})
			.catch(err => {
				console.log(
					"ERRORS, NOT FOUND =======>>>>>>>>>>>>>>>>>>>>>>>>>>",
					err
				);
				return res.json(err);
			});
	} else {
		console.log("find-return data from sended user", req.query);
		User.findOne(req.query)
			.then(friend => {
				if (!friend) {
					res.json(" DOESNT EXIST AT CHAT APP ");
				}
				console.log(friend);
				const { _id, name, email, avatar } = friend;
				res.json({ _id, name, email, avatar, userId });
			})
			.catch(e => console.log(e));
	}
});

router.post("/register", (req, res) => {
	const { errors, isValid } = validateRegisterInput(req.body);

	if (!isValid) return res.status(400).json(errors);
	User.findOne({
		email: req.body.email
	})
		.then(user => {
			// console.log("USER, from ROUTER.POST / resgister:  ", user)
			if (user) {
				return res.status(400).json({
					email: "Email already exist"
				});
			} else {
				const avatar = gravatar.url(req.body.email, {
					s: "200",
					r: "pg",
					d: "mm"
				});
				if (req.body.preferredLang == "") lang = "en-US";
				else {
					lang = req.body.preferredLang;
				}
				const newUser = new User({
					name: req.body.name,
					email: req.body.email,
					password: req.body.password,
					lang: lang,
					avatar
				});

				bcrypt.genSalt(10, (err, salt) => {
					if (err) console.error("There was an error", err);
					else {
						bcrypt.hash(newUser.password, salt, (err, hash) => {
							if (err) console.error("There was an error", err);
							else {
								newUser.password = hash;
								newUser.save().then(user => {
									res.json(user);
								});
							}
						});
					}
				});
			}
		})
		.catch(e => console.log(e));
});

router.post("/friendsInfo", (req, res) => {
	User.find({ _id: { $in: req.body } }, { password: 0, date: 0 })
		.then(response => res.json(response))
		.catch(e => console.log(e));
});

router.get("/lang", (req, res) => {
    const header = req.headers.cookie;
    if(header) {
    const n = header.split(";");
    const aux = n.find(item => item.includes("jwToken"));
    if (aux !== undefined) {
    user = jwt_decode(aux);
			console.log("\n\ntypeof user = ", typeof user);
            User.findOne({ _id: user.id }, { lang: 1 })
			.then(user => {
                if(!user) res.json('en-US')
                console.log("\\nUSER - - - - - - -", user);
				console.log("\n\nUSER FOUND\nSending lang = ", user.lang);
				res.json(user.lang);
			})
			.catch(e => {
                console.log(e);
				res.send(400).json({ error: "lang" });
			});
        }
        else{
            console.log("\n\nNOT USER CONNECTED\nSending lang = 'en-US'");
            res.send("en-US")
        }
    }
    else{
        console.log("\n\nNO HEADERS SETTED\nSending lang = 'en-US'")
        res.send("en-US")
    }
});

router.get("/test", (req, res) => {
	console.log("this is a test");
	res.send(`this is a test`);
});

router.get("/logout", (req, res) => {
	// const header = req.headers.cookie;
	// const n = header.split(";");
	// const token = n.find(item => item.includes("jwToken"));
	// console.log("token", token);
    res.clearCookie(
        "jwToken",
        //  "", 
    // { httpOnly: true }
    );
	res.end();
});

module.exports = router;
