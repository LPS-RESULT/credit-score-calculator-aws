
const ccService = require('./credit-score-service');

/**
 * This is the main handler of this Lambda Function. The main task is to correctly identify the request based
 * on the event input. Then handle it in the service using the correct methods
 *
 * @param event - event mapping to be handled by this Lambda function. The following are expected mappings:
 *      - body - refers to the json request body aka the main payload of the request
 *      - headers - refers to the headers contained in the original request
 *      - method - refers to the http method used
 *      - params - refers to the URL path parameters
 *      - query - refers to the query string parameters
 *      - env - refers to the environment variables mapping which is basically a copy of the stage variables
 *      - context - refers to the API Gateway context which includes information about the authorizers, ID's and user
 *
 * @param fnContext - This is the Lambda function context. Contains info about the underlying config of the function.
 *      Contains the ff properties:
 *      - callbackWaitsForEmptyEventLoop e.g. true
 *      - logGroupName e.g. "/aws/lambda/APIEquipmentModule"
 *      - logStreamName e.g. "2017/09/28/[$LATEST]98c3f9b109704c1aa3e0c2182a1313f9"
 *      - functionName e.g. "APIEquipmentModule"
 *      - memoryLimitInMB e.g. "128"
 *      - functionVersion e.g. "$LATEST"
 *      - invokeid e.g. "d7b721ca-a40e-11e7-9a70-07f3c295f99e"
 *      - awsRequestId e.g. "d7b721ca-a40e-11e7-9a70-07f3c295f99e"
 *      - invokedFunctionArn e.g. "arn:aws:lambda:us-east-1:441215761214:function:APIEquipmentModule"
 */
exports.handler = (event, fnContext) => {
    console.log('[CreditScoreModule] handling:',
        JSON.stringify({fnContext, event},null,4));

    let operation;

    if (event.method === 'POST' && event.body) {
        // GET with a url params id is a getOne operation
        operation = Promise.resolve(ccService.calculateCreditSummary(event.body));
    } else {
        // by default the operation is unsupported
        operation = Promise.reject('Operation is not supported by CreditScoreModule');
    }

    operation.then((result) => {
        fnContext.done(null, result);
    }, (reason) => {
        fnContext.done(reason);
    });
};