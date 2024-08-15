const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const fs = require('fs');

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request.');

    if (req.body && Array.isArray(req.body)) {
        const rows = req.body.map(row => ({
            ts: new Date(row.ts), // Assuming ts is already a valid date string or number
            device: row.device,
            co: parseFloat(row.co),
            humidity: parseFloat(row.humidity),
            light: row.light === true || row.light === 'true',
            lpg: parseFloat(row.lpg),
            motion: row.motion === true || row.motion === 'true',
            smoke: parseFloat(row.smoke),
            temp: parseFloat(row.temp)
        }));

        // context.log(`Parsed rows: ${JSON.stringify(rows)}`);

        const endpoint = process.env.OpenAIEndpoint; // Read endpoint from environment variable
        const deployment_name = "telemetry-gpt4";
        const credential = new AzureKeyCredential(process.env.OpenAIKey); // Read key from environment variable

        try {
            // Send data to OpenAI for analysis
            const client = new OpenAIClient(endpoint, credential);
            const prompt = `Check if there are anomalies in the following data: ${JSON.stringify(rows)}`;
            const result = await client.getChatCompletions(deployment_name, [
                { role: "system", content: "You are an AI that helps to analyze OpenTelemetry data" },
                { role: "user", content: prompt }
            ]);

            // Log and save OpenAI response to a text file
            const responseText = JSON.stringify(result, null, 2);
            context.log('Received response from OpenAI:', responseText);

            // Save response to a text file (if needed)
            const outputPath = `${context.executionContext.functionDirectory}/gpt-response.txt`;
            fs.writeFileSync(outputPath, responseText);

            context.log('Data bound to telemetryData binding.');

            context.res = {
                status: 200,
                body: "Data ingested and analyzed successfully"
            };
        } catch (error) {
            context.log.error('Error processing JSON data:', error);
            context.res = {
                status: 500,
                body: "Error processing JSON data"
            };
        }
    } else {
        context.res = {
            status: 400,
            body: "Please provide an array of data objects in the request body"
        };
    }
};
