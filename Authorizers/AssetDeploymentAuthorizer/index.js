/*
* Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
*
*     http://aws.amazon.com/apache2.0/
*
* or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
console.log('Loading function');

const aws = require('aws-sdk');
const KJUR = require('jsrsasign');
const base64 = require('base-64');
const crypto = require('crypto');

aws.config.update({
    region: 'us-east-1'
});

const lambda = new aws.Lambda();

function getSignedPayload(assetId, privateKey) {
    // initialize
    let sig = new KJUR.crypto.Signature({'alg': 'SHA256withRSA'});
    // initialize for signature generation
    sig.init(privateKey);   // rsaPrivateKey of RSAKey object
    // update data
    return sig.signString(assetId);
}

function validatePayload(assetId, publicKey, signed) {
    // initialize
    let sig = new KJUR.crypto.Signature({'alg': 'SHA256withRSA'});
    // initialize for signature validation
    sig.init(publicKey); // signer's certificate
    // update data
    sig.updateString(assetId);
    // verify signature
    return sig.verify(signed);
}

function validatePayload2(pl, pk, si) {
    var verify = crypto.createVerify('sha1WithRSAEncryption');
    verify.update(pl);
    return verify.verify(pk,si,'hex');
}

/**
 * This is a necessary function to invoke lambda calls of other modules
 * @param target
 * @param payload
 * @returns {Promise<any>}
 */
function execute(target, payload) {
    return new Promise((resolve, reject) => {
        lambda.invoke({
            FunctionName: target,
            InvocationType: 'RequestResponse', // wait for response
            Payload: JSON.stringify(payload, null, 2) // pass params
        }, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(JSON.parse(data.Payload));
            }
        });
    });
}

function generatePolicy(principalId, effect, resource) {
    var authResponse = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        let policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        let statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = {};
    return authResponse;
}

exports.handler = function(event, context, callback) {
    let signature = event.headers['x-signature']; // decode from base 64
    let timestamp = parseInt(event.headers['x-timestamp']); // using the timestamp parse it
    let assetId = event.headers['x-asset-id'];

    if (signature && timestamp && assetId) {
        // try verifying the payload, fetch first the asset data
        execute('APIAssetsModule', {
            method: 'GET',
            params: {
                id: assetId
            }
        }).then((asset) => {
            console.log('Validating', JSON.stringify({
                payload: assetId+":"+timestamp,
                key: asset.greengrass.cores[0].keysAndCertificate.keyPair.PublicKey,
                signature: signature
            }, null, 4));
            let valid = validatePayload2(
                assetId+":"+timestamp,
                asset.greengrass.cores[0].keysAndCertificate.keyPair.PublicKey,
                signature
            );
            if(valid) {
                let dateThen = timestamp * 1000;
                let dateNow = new Date().getTime();
                const dateWindow = 5 * 60 * 1000; // 5 minutes
                if(dateNow - dateThen < dateWindow) {
                    // if the request is made within 5 minutes of the timestamp and completion of the request
                    // then continue
                    // return allow policy
                    callback(null, generatePolicy('user', 'Allow', event.methodArn));
                } else {
                    callback('Request Expired', generatePolicy('user', 'Deny', event.methodArn));
                }
            } else {
                callback('Invalid Request', generatePolicy('user', 'Deny', event.methodArn));
            }
        })
    } else {
        //invalid request
        callback('Unauthorized', generatePolicy('user', 'Deny', event.methodArn));
    }
};

