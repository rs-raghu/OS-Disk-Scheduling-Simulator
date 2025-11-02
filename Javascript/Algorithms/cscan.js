/* =====================================================
   JS/ALGORITHMS/CSCAN.JS - C-SCAN (CIRCULAR SCAN) ALGORITHM
   ===================================================== */

/**
 * C-SCAN (Circular SCAN) Algorithm
 * Head moves in one direction serving requests, then jumps back to the beginning
 * Only services requests in one direction per pass
 * Characteristics: Provides uniform wait time, more fair than SCAN
 */
class CSCAN extends AlgorithmBase {
    /**
     * Execute C-SCAN algorithm
     * @returns {Array<number>} Sequence of disk positions visited
     */
    execute() {
        const sequence = this.initializeSequence();
        let currentPos = this.initialPosition;

        // Get requests on left and right
        const leftRequests = this.getRequestsLessThan(currentPos, true);   // Descending order
        const rightRequests = this.getRequestsGreaterOrEqual(currentPos, true); // Ascending order

        // Remove current position from rightRequests if it exists
        const rightFiltered = rightRequests.filter(r => r !== currentPos);

        // C-SCAN always goes right first, services all requests, then wraps around
        // Service requests to the right (including current position)
        sequence.push(...rightFiltered);

        // Jump to 0 if there are requests on the left
        if (leftRequests.length > 0) {
            sequence.push(0);
            // Service requests from left side in ascending order (since we're going right)
            sequence.push(...leftRequests);
        }

        return sequence;
    }

    /**
     * Get algorithm description
     * @returns {string}
     */
    getDescription() {
        return 'C-SCAN: Circular SCAN. Head moves in one direction serving all requests to the right, then jumps to 0 and services requests from the left. Provides more uniform wait time than SCAN.';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSCAN;
}