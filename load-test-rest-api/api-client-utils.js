var request = require('request');
const { performance } = require('perf_hooks');
require('console-stamp')(console);

function findAverage(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return Math.round(sum / arr.length);
}

const makeAPICall = async (hostname) => {
    var uri = '';
    var options = {
        'method': 'GET',
        'url': 'https://' + hostname + uri,
        'headers': {
            'apikey': 'xxxx',
            'Cache-Control' : 'no-store'
        }
    };
    return new Promise((resolve, reject) => {
        request(options, (error) => {
            if (error) reject(error);
            resolve();
        });
    });
}

const createBulkLoad = async (hostname, numberOfAPICalls) => {
    try {
        var perfData = [];
        for (let i = 1; i <= numberOfAPICalls; i++) {
            const start = performance.now();
            await makeAPICall(hostname)
            const end = performance.now();
            var elapsedTime = Math.round(end - start);
            perfData.push(elapsedTime);
            if (elapsedTime > 1000)
                console.log(`${i.toString().padStart(3, '0')} - Time taken by API call (${hostname}) is ${elapsedTime}ms. !!!HIGH LATENCY!!!`);
            else
                console.log(`${i.toString().padStart(3, '0')} - Time taken by API call (${hostname}) is ${elapsedTime}ms.`);
        }
        console.log(`Maximum response time with (${hostname}): ${Math.max(...perfData)}ms`);
        console.log(`Minimum response time with (${hostname}): ${Math.min(...perfData)}ms`);
        console.log(`Average response time with (${hostname}): ${findAverage(perfData)}ms`);

    } catch (error) {
        console.error('ERROR:' + error);
    }
}


module.exports = {
    createBulkLoad
}