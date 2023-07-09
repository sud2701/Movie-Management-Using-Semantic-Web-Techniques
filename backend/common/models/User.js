const mongooseConnector = require("mongoose");
const schemaObject = mongooseConnector.Schema;
const jwtObject = require("jsonwebtoken");
const JoiObject = require("joi");

const userSchema = new schemaObject({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

userSchema.methods.generateAuthenticationToken = () => {
    const token = jwtObject.sign(
        { _id: this._id, name: this.name },
        process.env.JWTPRIVATEKEY
    );
    return token;
};

const User = mongooseConnector.model("user", userSchema);

const validateData = (userDetails) => {
    const schema = JoiObject.object({
        name: JoiObject.string().required(),
        username: JoiObject.string().required(),
        email: JoiObject.string().email().required(),
        password: JoiObject.string().required(),
    });
    return schema.validate(userDetails);
};

module.exports = { User, validateData };