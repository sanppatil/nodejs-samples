const { getAuthorizationTokenUsingMasterKey } = require("./cosmos-auth-token");

var request = require('request');

var verb = "POST";
var resourceType = "docs";
var resourceId = "dbs/" + process.env.COSMOS_DATABASE_ID + "/colls/" + process.env.COSMOS_CONTAINER_ID;
var date = new Date().toUTCString();
var masterKey = process.env.COSMOS_MASTER_KEY
var url = process.env.COSMOS_HOST + resourceId + "/docs";

var authToken = getAuthorizationTokenUsingMasterKey(verb, resourceType, resourceId, date, masterKey);

var options = {
    method: verb,
    url: url,
    headers: {
        'Authorization': authToken,
        'x-ms-documentdb-isquery': 'True',
        'Content-Type': 'application/query+json',
        'x-ms-date': date,
        'x-ms-version': '2018-12-31',
        'x-ms-documentdb-query-enablecrosspartition': 'True'
    },
    body: JSON.stringify({
        "query": "SELECT TOP 1 * FROM c WHERE c.partition_key = @pk",
        "parameters": [
            {
                "name": "@pk",
                "value": "GYE_MMU"
            }
        ]
    })
};

request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
});