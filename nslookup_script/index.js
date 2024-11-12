const fs = require('fs');
const { exec } = require('child_process');
const csv = require('csv-parser');

// Function to perform nslookup on a given host
function nslookup(host) {
    return new Promise((resolve, reject) => {
        exec(`nslookup ${host}`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error performing nslookup on ${host}: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Function to read the CSV file and get the list of hosts
function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const hosts = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.host) {
                    hosts.push(row.host);
                }
            })
            .on('end', () => {
                resolve(hosts);
            })
            .on('error', (err) => {
                reject(`Error reading CSV file: ${err}`);
            });
    });
}

// Function to write the nslookup results to a file
function writeResults(filePath, results) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, results, (err) => {
            if (err) {
                reject(`Error writing to file: ${err}`);
            } else {
                resolve(`Results saved to ${filePath}`);
            }
        });
    });
}

// Main function
async function main() {
    const inputCsv = 'hosts.csv';  // Path to the CSV file containing hostnames
    const outputFile = 'nslookup_results.txt';  // Path to output file

    try {
        // Read the hosts from CSV
        const hosts = await readCsv(inputCsv);

        if (hosts.length === 0) {
            console.log("No hosts found in the CSV file.");
            return;
        }

        // Perform nslookup for each host and accumulate results
        let results = '';
        for (const host of hosts) {
            try {
                const result = await nslookup(host);
                results += `nslookup result for ${host}:\n${result}\n\n`;
            } catch (err) {
                results += `${err}\n\n`;
            }
        }

        // Write results to output file
        const message = await writeResults(outputFile, results);
        console.log(message);
    } catch (err) {
        console.error(err);
    }
}

// Run the script
main();
