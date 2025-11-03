/* =====================================================
 * JS/ALGORITHMS/CSCAN.JS - C-SCAN (CIRCULAR SCAN) ALGORITHM
 * -----------------------------------------------------
 * The head moves in one direction (e.g., high) servicing
 * all requests until it hits the end of the disk (maxTrack).
 * It then "jumps" to the other end (0) and continues
 * moving in the *same* direction (high) servicing
 * the remaining requests.
 * ===================================================== */

/**
 * Implements the C-SCAN (Circular SCAN) algorithm.
 * Characteristics: Provides a more uniform wait time than SCAN.
 */
class CSCAN extends AlgorithmBase {

    /**
     * Gets the description for the C-SCAN algorithm.
     * @static
     * @returns {string} The algorithm's description.
     */
    static get description() {
        return 'C-SCAN (Circular SCAN): The head moves to one end, then jumps to the other and continues in the same direction.';
    }

    /**
     * Executes the C-SCAN (Circular) algorithm.
     * @returns {Array<number>} The sequence of disk positions visited.
     */
    execute() {
        const sequence = this.initializeSequence(); // [initialPosition]

        // 1. Get requests at or to the right, sorted ascending
        const rightRequests = this.getRequestsGreaterOrEqual(this.initialPosition, true);
        
        // 2. Get requests to the left, sorted ascending
        const leftRequests = this.getRequestsLessThan(this.initialPosition, true).reverse(); // .reverse() to make ascending
        
        // Remove initial position if it was in the list
        if (rightRequests[0] === this.initialPosition) {
            rightRequests.shift();
        }

        // --- C-SCAN Logic (always moves high) ---

        // 1. Service all requests to the right
        sequence.push(...rightRequests);

        // 2. If there are requests on the left, scan to the end,
        // jump to 0, and service the left requests.
        if (leftRequests.length > 0) {
            // 2a. Move to the end of the disk if not already there
            if (sequence[sequence.length - 1] !== this.maxTrack) {
                sequence.push(this.maxTrack);
            }
            
            // 2b. Jump to the start of the disk
            sequence.push(0);
            
            // 2c. Service the remaining (left) requests
            sequence.push(...leftRequests);
        }

        return sequence;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSCAN;
}