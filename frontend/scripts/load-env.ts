const { writeFile } = require('fs');
const { argv } = require('yargs');

// read environment variables from .env file
require('dotenv').config();

// read the command line arguments passed with yargs
const environment = argv.environment;
const isProduction = environment === 'prod';

const targetPath = isProduction
    ? `./src/environments/environment.prod.ts`
    : `./src/environments/environment.ts`;

// we have access to our environment variables
// in the process.env object thanks to dotenv
const environmentFileContent = `
export const environment = {
    production: ${isProduction},
    API_GATEWAY_DOMAIN:"${process.env.API_GATEWAY_DOMAIN}",
    USER_DOMAIN:"${process.env.USER_DOMAIN}",
    REVIEW_SERVICE_DOMAIN:"${process.env.REVIEW_SERVICE_DOMAIN}",
    MOVIE_RECOMMENDER_DOMAIN:"${process.env.MOVIE_RECOMMENDER_DOMAIN}"
};
`;
// write the content to the respective file
writeFile(targetPath, environmentFileContent, function (err) {
    if (err) {
        console.log(err);
    }

    console.log(`Wrote variables to ${targetPath}`);
});