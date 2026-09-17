/**
 * ---------------------------------------------------------
 * ETL Pipeline
 * ---------------------------------------------------------
 * Coordinates the complete
 * Extract → Transform → Load workflow.
 */

const { createSource, extractCSV } = require("./extract");
const { CSVToJSONTransform } = require("./transform");
const { createDestination, loadData } = require("./load");

/**
 * Creates the basic ETL pipeline structure.
 *
 * @param {Object} config - Pipeline configuration
 * @returns {Object} ETL pipeline information
 */
const createETLPipeline = (config = {}) => {
    const source = createSource(config.source || {});
    const destination = createDestination(config.destination || {});

    return {
        source,
        destination,
        stages: [
            "Extract",
            "Transform",
            "Load"
        ]
    };
};

module.exports = {
    createETLPipeline,
    createSource,
    extractCSV,
    CSVToJSONTransform,
    createDestination,
    loadData
};