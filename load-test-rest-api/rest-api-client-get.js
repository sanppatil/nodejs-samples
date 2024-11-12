const { createBulkLoad } = require ("./api-client-utils");
require("dotenv").config();

var hostname=process.env.HOST_NAME

var numberOfAPICalls = 10;
createBulkLoad(hostname, numberOfAPICalls);