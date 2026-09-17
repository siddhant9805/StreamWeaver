/**
 * ---------------------------------------------------------
 * Transform Module (Hardened against edge cases)
 * ---------------------------------------------------------
 * Handles:
 * - Windows (\r\n) and Unix (\n) line breaks
 * - Empty rows and trailing newlines
 * - Missing / uneven columns
 * - Case-insensitive header matching for transformations
 */

const { Transform } = require("stream");

class CSVToJSONTransform extends Transform {
    constructor(options = {}) {
        super({
            ...options,
            readableObjectMode: true
        });

        this.headers = null;
        this.buffer = "";
        this.transformRules = options.transformRules || {};
    }

    /**
     * Cleans raw text chunks, removing carriage returns (\r).
     */
    cleanLine(line) {
        return line.replace(/\r/g, "").trim();
    }

    /**
     * Maps raw values to headers while handling uneven column counts.
     */
    createRow(values) {
        const row = {};
        const uppercaseRules = (this.transformRules.uppercaseFields || []).map(f => f.toLowerCase());

        this.headers.forEach((header, index) => {
            let val = values[index] !== undefined ? values[index].replace(/\r/g, "").trim() : "";

            // Apply uppercase transform if rule matches (case-insensitive)
            if (uppercaseRules.includes(header.toLowerCase())) {
                val = val.toUpperCase();
            }

            row[header] = val;
        });

        return row;
    }

    /**
     * Checks if a row meets filter criteria safely.
     */
    matchesFilter(row) {
        const filter = this.transformRules.filter;
        if (!filter || !filter.field) {
            return true;
        }

        // Find matching key case-insensitively
        const actualKey = Object.keys(row).find(k => k.toLowerCase() === filter.field.toLowerCase());
        if (!actualKey) return true;

        const val = row[actualKey];
        if (val === undefined || val === "") return false;

        // Numerical minimum comparison
        if (filter.min !== undefined) {
            const num = Number(val);
            if (isNaN(num) || num < Number(filter.min)) {
                return false;
            }
        }

        // Exact match comparison
        if (filter.equals !== undefined) {
            if (String(val).toLowerCase() !== String(filter.equals).toLowerCase()) {
                return false;
            }
        }

        return true;
    }

    _transform(chunk, encoding, callback) {
        try {
            this.buffer += chunk.toString();
            const lines = this.buffer.split("\n");

            // Keep the last incomplete fragment in the buffer
            this.buffer = lines.pop();

            for (const rawLine of lines) {
                const line = this.cleanLine(rawLine);
                if (!line) continue; // Skip empty rows

                // Initialize headers from first row
                if (!this.headers) {
                    this.headers = line.split(",").map(h => h.replace(/\r/g, "").trim());
                    continue;
                }

                const values = line.split(",");
                const row = this.createRow(values);

                if (this.matchesFilter(row)) {
                    this.push(row);
                }
            }

            callback();
        } catch (error) {
            callback(error);
        }
    }

    _flush(callback) {
        try {
            if (this.buffer) {
                const line = this.cleanLine(this.buffer);
                if (line && this.headers) {
                    const values = line.split(",");
                    const row = this.createRow(values);
                    if (this.matchesFilter(row)) {
                        this.push(row);
                    }
                }
            }
            callback();
        } catch (error) {
            callback(error);
        }
    }
}

module.exports = {
    CSVToJSONTransform
};