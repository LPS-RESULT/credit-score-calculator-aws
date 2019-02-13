
const jwt = require('jsonwebtoken');
const aws = require("aws-sdk");
const jwksClient = require('jwks-rsa');
let iam = new aws.IAM();

const client = jwksClient({
    cache: true,
    strictSsl: true, // Default value
    jwksUri: 'https://acadia.auth0.com/.well-known/jwks.json'
});

exports.handler = (event, context, callback) => {
    let token = event.authorizationToken.split(" ")[1];
    let decoded = jwt.decode(token, {complete: true});
    if (decoded) {
        client.getSigningKey(decoded.header.kid, (err, key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;

            jwt.verify(token, signingKey, {"ignoreExpiration": decoded.payload.name.indexOf("@key.api") >= 0}, (err, profile) => {
                 if (err) {
                    callback("Token Expired: " + err);
                } else {
                    Object.keys(profile).forEach((key) => {
                        if (key.startsWith("https://acadiaenergy.com/"))
                            profile[key.substring(key.lastIndexOf("/") + 1)] = profile[key];
                    });
                    let params = {
                        PolicyName: 'execute-api-policy',
                        RoleName: 'api-access'
                    };
                    iam.getRolePolicy(params, (err, data) => {
                        if (err) console.log(err, err.stack); // an error occurred
                        else {
                            let response = {
                                principalId: profile.reference,
                                policyDocument: JSON.parse(decodeURIComponent(data.PolicyDocument)),
                                context: profile
                            };
                            callback(null, response);
                        }
                    });
                }

            });
        });
    } else {
        callback("Invalid or missing authentication token.");
    }
};
