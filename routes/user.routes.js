const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
const checkToken = require("../validation/checkToken")
const secret = require('../config/secret');

const User = require("../models/User.model");

router.post("/login", (req, res) => {
    // console.log(req.body)
    const { errors, isValid } = validateLoginInput(req.body);

    if (!isValid) return res.status(400).json(errors);

    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email }).then(user => {
        if (!user) {
            errors.email = "User not found";
            return res.status(404).json(errors);
        }
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const payload = { id: user.id };
                jwt.sign(
                    payload,
                    secret.key,
                    (err, token) => {
                        if (err) console.error("There is some error in token", err);
                        else {
                            res.json({
                                success: true,
                                token,
                            });
                        }
                    }
                );
            } else {
                errors.password = "Incorrect Password";
                return res.status(400).json(errors);
            }
        });
    });
});

router.get("/validatingUser", checkToken, (req, res) => {
    let userId = '';
    jwt.verify(req.body, secret.key, (err, authorizedData) => {
        //If token is successfully verified, we can send the autorized data 
        if (err) {
            console.log(err)
        }
        else {
            userId = authorizedData.id;
        }
    })

    if (Object.entries(req.query).length === 0 && req.query.constructor === Object) {
        console.log("verifyn ACTIVE user")
        User.findOne({ _id: userId }, { password: 0, date: 0 })
            .then(info => {
                if (!info) {
                    console.log("info WASN'T FOUND")
                    return res.status(404).json(errors)
                }
                else {
                    // console.log(info)
                    res.json(info)
                }
            }).catch(err => {
                console.log('ERRORS, NOT FOUND =======>>>>>>>>>>>>>>>>>>>>>>>>>>', err);
                return err;
            })

    }
    else {
        console.log("find-return data from sended user", req.query)
        const restrictions = { _id: 1 }
        User.findOne(req.query)
            .then(friend => {
                console.log(friend)
                const { _id } = friend
                res.json({ _id, userId })
            })
            .catch(e => console.log(e))
    }
}
);

router.post("/register", (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);
    if (!isValid) return res.status(400).json(errors);
    User.findOne({
        email: req.body.email
    }).then(user => {
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
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
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
    });
});

router.get("/friendsInfo",(req,res)=>{
    // const arr = JSON.parse(req.query.data)
    let key = 0
    const {contactID, status} = req.query
    console.log(req.query)
    User.findOne({_id:contactID})
        .then(user => {
            console.log("friend ------",user)
            const info = {user};
            info.status = status
            console.log("friend with STATUS - - - - - -",info)
            res.json(info)
        })
    .catch(e => console.log(e))
    })





// router.get("/friendsInfo", (req, res) => {
//     console.log("req.query -- ", req.query)
//     let friend = {};
//     for (const key in req.query) {
//         if (req.query.hasOwnProperty(key)) {
//             const element = JSON.parse(req.query[key]);
//             // console.log(element) //getting every element of the array as an OBJECT
            
//             // function x(a){
//                 friend = findData(element)
//                 console.log(typeof a)
//                 console.log(" - - - FRIEND - - - TO SEND BACK-",friend)
//                 res.json(friend)
//             // }
//             // x(friend)
//         }
//     }
// })

// const findData = (elem) => {
//     console.log("- elem - \n", elem)
//     let fullFriend ={};
//     User.findOne({ _id: elem.contactID }, { _id: 0, password: 0, date: 0 })
//         .then((info) => {
//             if (!info) {
//                 console.log("info WASN'T FOUND")
//                 return res.status(404).json(errors)
//             }
//             else {
//                 fullFriend = { info };
//                 fullFriend.status = elem.status
//                 console.log(" - full friend - ",fullFriend)
//                 // SHOULD BE RETURNING THE WHOLE INFO FOR A FRIEND
//             }
//         })
//         .catch(err => {
//             console.log('ERRORS, NOT FOUND =======>>>>>>>>>>>>>>>>>>>>>>>>>>', err);
//             return err;
//         })
//         return fullFriend
// }

module.exports = router;
