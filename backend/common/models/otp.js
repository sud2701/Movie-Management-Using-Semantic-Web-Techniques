const mongooseObject = require("mongoose");
var OtpSchema = new mongooseObject.Schema({
    email: String,
    otp: String
});

module.exports = mongooseObject.model("Otp", OtpSchema);