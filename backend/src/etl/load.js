/**
 * ---------------------------------------------------------
 * Load Module
 * ---------------------------------------------------------
 * Defines the destination stage of the ETL pipeline.
 *
 * Responsibilities:
 * - Receive transformed data records
 * - Write output stream to the designated target destination
 * - Support JSON file destination writing
 */

const fs = require("fs");
const path = require("path");
const { Writable } = require("stream");

/**
 * Creates a destination configuration object.
 *
 * @param {Object} destConfig - Destination configuration
 * @returns {Object} Prepared destination details
 */
const createDestination = (destConfig = {}) => {
    return {
        type: destConfig.type || "json",
        path: destConfig.path || path.join(__dirname, "../../uploads/output.json")
    };
};

/**
 * Writes transformed records to a destination JSON file.
 *
 * @param {Array<Object>} records - Transformed records array
 * @param {Object} destinationConfig - Target destination config
 * @returns {Promise<Object>} Summary of the load operation
 */
const loadData = async (records, destinationConfig = {}) => {
    const config = createDestination(destinationConfig);

    return new Promise((resolve, reject) => {
        try {
            const outputDir = path.dirname(config.path);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const writeStream = fs.createWriteStream(config.path, { encoding: "utf-8" });

            writeStream.on("error", (err) => {
                reject(err);
            });

            writeStream.on("finish", () => {
                resolve({
                    success: true,
                    destinationType: config.type,
                    outputPath: config.path,
                    recordsCount: records.length
                });
            });

            writeStream.write(JSON.stringify(records, null, 2));
            writeStream.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createDestination,
    loadData
};