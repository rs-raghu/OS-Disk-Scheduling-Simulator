/* =====================================================
   JS/ALGORITHMS/CLOOK.JS - C-LOOK (CIRCULAR LOOK) ALGORITHM
   ===================================================== */

/**
 * C-LOOK (Circular LOOK) Algorithm
 * Similar to C-SCAN but only goes as far as the last request in each direction
 * Provides circular motion without going all the way to disk ends
 * Characteristics: Most efficient among scanning algorithms
 */
class CLOOK extends AlgorithmBase {
    /**
     * Execute C-LOOK algorithm
     * @returns {Array<number>} Sequence of disk positions visited
     */
    execute() {
        const sequence = this.initializeSequence();
        let currentPos = this.initialPosition;

        // Get requests on left and right
        const leftRequests = this.getRequestsLessThan(currentPos, true);   // Descending order
        const rightRequests = this.getRequestsGreaterThan(currentPos, true); // Ascending order

        // Check if current position itself is a request
        const currentIsRequest = this.requests.includes(currentPos);
        if (currentIsRequest && rightRequests.length === 0 && leftRequests.length > 0) {
            // If only left requests exist, go left
            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
        } else {
            // C-LOOK: Always process right requests first
            if (rightRequests.length > 0) {
                sequence.push(...rightRequests);
            }

            // Then wrap around and process left requests
            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
        }

        return sequence;
    }

    /**
     * Get algorithm description
     * @returns {string}
     */
    getDescription() {
        return 'C-LOOK: Circular LOOK. Combines C-SCAN and LOOK: goes to the farthest request in one direction, then jumps to the farthest request in the other direction. Most efficient among circular algorithms.';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CLOOK;
}