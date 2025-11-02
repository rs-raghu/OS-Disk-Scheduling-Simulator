/* =====================================================
   JS/ALGORITHMS/LOOK.JS - LOOK ALGORITHM
   ===================================================== */

/**
 * LOOK Algorithm
 * Similar to SCAN but doesn't necessarily go all the way to disk end
 * Head reverses direction as soon as there are no more requests in that direction
 * Characteristics: More efficient than SCAN, reduces unnecessary movement
 */
class LOOK extends AlgorithmBase {
    /**
     * Execute LOOK algorithm
     * @returns {Array<number>} Sequence of disk positions visited
     */
    execute() {
        const sequence = this.initializeSequence();
        let currentPos = this.initialPosition;

        // Determine initial direction based on parameter
        let movingUp = (this.direction === 'high');

        // Get requests on left and right
        const leftRequests = this.getRequestsLessThan(currentPos, true);   // Descending order
        const rightRequests = this.getRequestsGreaterThan(currentPos, true); // Ascending order

        if (movingUp) {
            // Moving towards high (right) first
            // Go right as far as the last request on the right
            if (rightRequests.length > 0) {
                sequence.push(...rightRequests);
            }
            // Then go left
            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
        } else {
            // Moving towards low (left) first
            // Go left as far as the last request on the left
            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
            // Then go right
            if (rightRequests.length > 0) {
                sequence.push(...rightRequests);
            }
        }

        return sequence;
    }

    /**
     * Get algorithm description
     * @returns {string}
     */
    getDescription() {
        return 'LOOK: Similar to SCAN but reverses direction immediately when there are no more requests in the current direction. More efficient than SCAN as it avoids unnecessary movement to disk ends.';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LOOK;
}