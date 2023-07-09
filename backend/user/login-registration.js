const expressObject = require('express');
const app = expressObject();
const bcrypt = require('bcryptjs');
const connection = require("./db/database");
const sendToQueue = require('./queue/sender');
const passwordValidator = require('password-validator');
const schema = new passwordValidator();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

connection();

schema
    .is().min(8)
    .is().max(32)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().symbols()
    .is().not().oneOf(['Passw0rd', 'Password123']);


var User = require('./models/User').User;
var validateData = require('./models/User').validateData;
var Otp = require('./models/otp');

app.use(expressObject.json());
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
// ===========================
//  Running Port.
// ===========================
app.listen(8080);
console.log("Server is listening port 8080 !!!!");


app.get('/check-email', (request, response) => {
    const email = request.query.email;
    User.find({ email: email }, (err, emailList) => {
        if (err) {
            return response.send({ message: "Error" });
        } else {
            if (emailList.length > 0) {
                response.send({ message: "invalid" });
            } else {
                response.send({ message: "valid" });
            }
        }
    });
});

app.get('/check-username', (request, response) => {
    const username = request.query.username;
    User.find({ username: username }, (err, usernameList) => {
        if (err) {
            return response.send({ message: "error" });
        } else {
            if (usernameList.length > 0) {
                response.send({ message: "invalid" });
            } else {
                response.send({ message: "valid" });
            }
        }
    });
});

app.post('/create-otp', (request, response) => {
    var email = request.body.email;
    const otpInt = Math.floor((Math.random() * 999999) + 1);
    const otpString = otpInt.toString();
    const sr = 10;
    bcrypt.genSalt(sr, (err, salt) => {
        if (err) {
            return response.send({ message: "error" });
        } else {
            bcrypt.hash(otpString, salt, (err, hash) => {
                if (err) {
                    return response.send({ message: "error" });
                }
                else {
                    var mailOptions = {
                        from: process.env.SERVER_MAIL_ID,
                        to: email,
                        subject: 'Welcome to Movie Management',
                        text: 'For the first login use the given OTP : ' + otpString
                    };
                    sendToQueue('mailer', mailOptions);
                    var otp = new Otp({
                        email: email,
                        otp: hash
                    });
                    Otp.create(otp, (err) => {
                        if (err) {
                            return response.send({ message: "error" });
                        } else {
                            response.send({ message: "ok" });
                        }
                    });
                }
            });
        }
    });
});

app.post('/check-otp', (request, response) => {
    const email = request.body.email;
    const otp = request.body.otp;
    Otp.find({ email: email }, (err, result) => {
        if (err) {
            return response.send({ message: "error" });
        } else {
            if (result.length > 0) {
                bcrypt.compare(otp, result[0].otp, (err, r) => {
                    if (err) {
                        return response.send({ message: "error" });
                    }
                    else {
                        if (r == true) {
                            Otp.deleteOne({ email: email }, (err) => {
                                if (err) {
                                    return response.send({ message: "error" });
                                }
                            });
                            return response.send({ message: "valid" });
                        } else {
                            return response.send({ message: "invalid" });
                        }
                    }
                });
            }
        }
    });
});

app.post('/signup', (request, response) => {
    const username = request.body.username;
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const { error } = validateData(request.body);
    if (error) {
        console.log('here');
        return response.status(400).send("error");
    }
    if (schema.validate(password)) {
        const sr = 10;
        bcrypt.genSalt(sr, function (err, salt) {
            if (err) {
                return response.send({ message: "error" });
            } else {
                bcrypt.hash(password, salt, function (err, hash) {
                    if (err) {
                        return response.send({ message: "error" });
                    } else {
                        var newUser = new User({
                            name: name,
                            username: username,
                            email: email,
                            password: hash
                        });
                        User.create(newUser, (err) => {
                            if (err) {
                                return response.send({ message: "error" });
                            }
                        });
                        return response.send({ message: "ok" });
                    }
                });
            }
        });
    } else {
        return response.send("invalid");
    }
});

app.post('/login', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    User.find({ username: username }, (err, user) => {
        if (err) {
            return response.send({ message: "error" });
        } else {
            if (user.length == 1) {
                bcrypt.compare(password, user[0].password, (err, r) => {
                    if (err) {
                        return response.send({ message: "error" });
                    } else {
                        if (r == true) {
                            const token = user[0].generateAuthenticationToken();
                            response.set({
                                'content-type': 'application/json',
                            });
                            return response.send({ message: "valid", 'x-auth-token': token });
                        } else {
                            return response.send({ message: "invalid" });
                        }
                    }
                });
            } else {
                return response.send({ message: "invalid" });
            }
        }
    });
});
