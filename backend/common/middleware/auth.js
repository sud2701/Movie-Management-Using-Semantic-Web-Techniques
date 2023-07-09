const jwtObject = require("jsonwebtoken");
const session = require('express-session');

const setUpAuthenticationMiddleware = (app, ROUTES) => {
    var memoryStore = new session.MemoryStore();
    app.use(session({
        secret: '5Nu@1T^oInxZQf8OvbXPBSiNe7^!IF',
        resave: false,
        saveUninitialized: true,
        store: memoryStore
    }));
    ROUTES.forEach(route => {
        if (route.auth) {
            app.use(route.url, authenticateRequest);
        }
    });
};

const authenticateRequest = (request, response, next) => {
    try {
        const headerToken = request.header("x-auth-token");
        if (!headerToken) return response.status(403).send("Access denied");

        const user = jwtObject.verify(headerToken, process.env.JWTPRIVATEKEY);
        request.user = user;
        next();
    } catch (error) {
        response.status(400).send("Invalid token");
    }
}

exports.setUpAuthenticationMiddleware = setUpAuthenticationMiddleware;
exports.authenticateRequest = authenticateRequest;