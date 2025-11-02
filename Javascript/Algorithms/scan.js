/* =====================================================
   JS/ALGORITHMS/SCAN.JS - SCAN (ELEVATOR) ALGORITHM
   ===================================================== */

/**
 * SCAN (Elevator) Algorithm
 * Head moves in one direction until it reaches the end, then reverses
 * Services all requests in its path
 * Characteristics: Fair distribution, predictable, better than FCFS
 */
class SCAN extends AlgorithmBase {
    /**
     * Execute SCAN algorithm
     * @returns {Array<number>} Sequence of disk positions visited
     */
    execute() {
        const sequence = this.initializeSequence();
        let currentPos = this.initialPosition;

        // Determine initial direction based on parameter
        let movingUp = (this.direction === 'high');

        // Get requests on left and right
        const leftRequests = this.getRequestsLessThan(currentPos, true);   // Descending order
        const rightRequests = this.getRequestsGreaterOrEqual(currentPos, true); // Ascending order

        // Remove current position from rightRequests if it exists
        const rightFiltered = rightRequests.filter(r => r !== currentPos);

        if (movingUp) {
            // Moving towards high (right) first
            sequence.push(...rightFiltered);
            sequence.push(...leftRequests);
        } else {
            // Moving towards low (left) first
            sequence.push(...leftRequests);
            sequence.push(...rightFiltered);
        }

        return sequence;
    }

    /**
     * Get algorithm description
     * @returns {string}
     */
    getDescription() {
        return 'SCAN: Elevator Algorithm. Head moves in one direction serving all requests until it reaches the end, then reverses direction. Fair and predictable.';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SCAN;
}