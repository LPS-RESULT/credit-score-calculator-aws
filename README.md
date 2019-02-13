# README

## About Credit Score Calculator AWS

MEAN Puppeteer is built by awesome people.

## Developer's Guide

It is important to note that each folder in this repository
is its own module for the Lambda function, the reason behind this is to isolate
the required dependencies thus making sure the lambda function will be in its
smallest size during uploads.

### Getting Started

So to get started, go that specific directory you plan to modify:

    credit-score-calculator-aws$ cd APICreditScoreModule
    
Then head on to installing its required packages.

    credit-score-calculator-aws/APICreditScoreModule$ npm install

### Zipping and Uploading the Code

After modifying you may then create a zip for it and upload the file of the code
to lambda. When on a Mac, you can zip via:

    credit-score-calculator-aws/APICreditScoreModule$ zip -r lambda -o *
    
Or you can also opt to use the npm lambda script

    npm run-script lambda

## Module Directory

In this section, the different directories will be explained in greater detail. Modules in this project are classified 
into two types - API Modules and Non API Modules:

**API Modules**

- Have their own counterpart API Gateway Endpoints. e.g APIAssetsModule is `/assets`
- Since input is usually an `http request`, the event would have some mappings:
    - body - refers to the json request body aka the main payload of the request
    - headers - refers to the headers contained in the original request
    - method - refers to the http method used
    - params - refers to the URL path parameters
    - query - refers to the query string parameters
    - env - refers to the environment variables mapping which is basically a copy of the stage variables
    - context - refers to the API Gateway context which includes information about the authorizers, ID's and user

API's usually have 5 common methods that comprise most of the different CRUD tasks:

- GET /endpoint
    - Provides a paginatable interface of the resource
- GET /endpoint/id
- POST /endpoint
- PUT /endpoint/id
- DELETE /endpoint/id

**Non API Modules**

- Don't have counterpart API Gateway Endpoints. And are probably used by other Insite resources.
- Common usage is for Cloudwatch triggers - CloudWatch invokes the particular module to serve a recurring purpose,
such as storing cache, or cleaning up storages

The current convention of setting up function triggers is using the `trigger` event attribute. So the event would look
something like:

    { "trigger": "NAME_OF_ACTION" }
    
In cases where extra parameters are needed, you can use `triggerParams` attribute:

    {
        "trigger": "NAME_OF_ACTION",
        "triggerParams": {
            "param1": 123,
            "param2": "456"
            "param3": [7,8,9],
            "param4": {
                "x": 0
            }
        }
    }

#### PING

The Admin module serves as a Lambda function for all administrative features such as dealing with databases
and triggering functions in other modules. These are the supported methods under Admin module:


Executed via event:

    { "trigger": "PING" }

This is a PING-PONG method that simply responds with the text "PONG" when triggered. This function is primarily
used to keep Lambda functions warmed up - cached, up and running in the cloud. 


### APICreditScoreModule

This module contains methods that can be used to make calculations for credit scores.

To run API tests for APICreditScore:

    credit-score-calculator-aws/APICreditScoreModule$ npm test
    
This is a shortcut to invoking mocha:

    mocha tests/**/*.js --reporter spec --timeout 30000

## License

Copyright © 2019, LPS
