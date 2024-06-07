const { createBulkLoad } = require ("./api-client-utils");

var hostname="google.com"

var numberOfAPICalls = 25;
createBulkLoad(hostname, numberOfAPICalls);