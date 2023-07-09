
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const { ROUTES } = require("./routes/routes");
var cors = require('cors');
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
const { setupLogging } = require("./log/logging");
const { setupRateLimit } = require("./rate-limiter/ratelimit");
const { setupProxies } = require("./proxy/proxy");

const app = express();
const port = 3000;

app.use(cors(corsOptions));
const { setUpAuthenticationMiddleware } = require("./middleware/auth");
setupLogging(app);
setupRateLimit(app, ROUTES);
setUpAuthenticationMiddleware(app, ROUTES);
setupProxies(app, ROUTES);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})