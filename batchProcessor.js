'use strict';

/**
 * Utility functions for batch processing large date ranges
 * to prevent execution time exceeded errors
 */

/**
 * Split a date range into smaller chunks
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {number} chunkDays - Number of days per chunk (default: 7)
 * @returns {Array} Array of date range objects
 */
function splitDateRange(startDate, endDate, chunkDays = 7) {
    const chunks = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    while (start <= end) {
        const chunkEnd = new Date(start);
        chunkEnd.setDate(chunkEnd.getDate() + chunkDays - 1);
        
        if (chunkEnd > end) {
            chunkEnd.setTime(end.getTime());
        }
        
        chunks.push({
            start: start.toISOString().slice(0, 10),
            end: chunkEnd.toISOString().slice(0, 10)
        });
        
        start.setDate(start.getDate() + chunkDays);
    }
    
    return chunks;
}

/**
 * Validate date range to prevent timeout
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {number} maxDays - Maximum allowed days (default: 31)
 * @returns {Object} Validation result with isValid and message
 */
function validateDateRange(startDate, endDate, maxDays = 31) {
    const fromDate = new Date(startDate);
    const toDate = new Date(endDate);
    const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > maxDays) {
        return {
            isValid: false,
            message: `Date range cannot exceed ${maxDays} days to prevent timeout. Please select a smaller date range.`,
            daysDiff: daysDiff
        };
    }
    
    return {
        isValid: true,
        message: 'Date range is valid',
        daysDiff: daysDiff
    };
}

/**
 * Process data in batches with progress tracking
 * @param {Array} chunks - Array of date range chunks
 * @param {Function} processChunk - Function to process each chunk
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise} Promise that resolves with total results
 */
async function processBatches(chunks, processChunk, onProgress) {
    let totalResults = 0;
    let processedChunks = 0;
    
    for (const chunk of chunks) {
        try {
            const result = await processChunk(chunk);
            totalResults += result || 0;
            processedChunks++;
            
            if (onProgress) {
                onProgress({
                    processed: processedChunks,
                    total: chunks.length,
                    currentChunk: chunk,
                    totalResults: totalResults
                });
            }
            
            // Small delay between chunks to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error processing chunk ${processedChunks + 1}:`, error);
            throw error;
        }
    }
    
    return totalResults;
}

/**
 * Get optimal chunk size based on operation type
 * @param {string} operationType - Type of operation (essl, payment, muster, attendance)
 * @returns {number} Optimal chunk size in days
 */
function getOptimalChunkSize(operationType) {
    const chunkSizes = {
        'essl': 7,        // ESSL data fetch - most intensive
        'payment': 15,    // Payment calculation - moderate
        'muster': 31,     // Attendance muster - less intensive
        'attendance': 31  // Attendance reports - less intensive
    };
    
    return chunkSizes[operationType] || 7;
}

module.exports = {
    splitDateRange,
    validateDateRange,
    processBatches,
    getOptimalChunkSize
};
