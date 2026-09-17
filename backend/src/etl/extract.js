/**
 * ---------------------------------------------------------
 * Extract Module
 * ---------------------------------------------------------
 * Defines the source component of the ETL pipeline.
 */

const fs = require("fs");
const path = require("path");
const { readCSV } = require("../utils/csvParser");

/**
 * Creates a source configuration for the ETL pipeline.
 */
const createSource = (sourceConfig = {}) => {
    return {
        type: sourceConfig.type || sourceConfig.sourceType || "csv",
        path: sourceConfig.path || sourceConfig.sourcePath || null
    };
};

/**
 * Reads data from the configured CSV source.
 * Includes defensive file-existence validation.
 *
 * @param {Object} sourceConfig - Source configuration
 * @returns {Promise<string>} CSV data
 */
const extractCSV = async (sourceConfig) => {
    const type = sourceConfig.type || sourceConfig.sourceType || "csv";
    const filePath = sourceConfig.path || sourceConfig.sourcePath;

    if (type !== "csv") {
        throw new Error(`[Extract Stage] Unsupported source type '${type}'. Only 'csv' is supported.`);
    }

    if (!filePath) {
        throw new Error("[Extract Stage] Source file path is required.");
    }

    // Resolve path relative to backend root if not absolute
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`[Extract Stage] Source file not found at path: ${filePath}`);
    }

    try {
        return await readCSV(resolvedPath);
    } catch (err) {
        throw new Error(`[Extract Stage] Failed to read CSV: ${err.message}`);
    }
};

module.exports = {
    createSource,
    extractCSV
};