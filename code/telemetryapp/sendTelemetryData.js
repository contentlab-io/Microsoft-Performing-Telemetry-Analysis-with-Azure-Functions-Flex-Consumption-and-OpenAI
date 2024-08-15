const fs = require('fs');
const csv = require('csvtojson');
const axios = require('axios');

// Define the path to your CSV file
const csvFilePath = 'telemetry.csv';

// Define the URL of your Azure Function
const azureFunctionUrl = 'http://localhost:7071/api/telemetryapp';

// Read the CSV file and convert it to JSON
csv()
    .fromFile(csvFilePath)
    .then((jsonArray) => {
        // Send the JSON data to the Azure Function
        axios.post(azureFunctionUrl, jsonArray, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log(`Status: ${response.status}`);
            console.log('Body:', response.data);
        })
        .catch(error => {
            console.error('Error:', error.message);
        });
    })
    .catch(error => {
        console.error('Error reading CSV file:', error.message);
    });
