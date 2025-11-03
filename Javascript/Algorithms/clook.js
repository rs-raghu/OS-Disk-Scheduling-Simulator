/* =====================================================
 * JS/ALGORITHMS/CLOOK.JS - C-LOOK (CIRCULAR LOOK) ALGORITHM
 * -----------------------------------------------------
 * A more efficient version of C-SCAN. The head moves
 * to the last request in one direction (e.g., high),
 * then "jumps" to the first request in the other "half"
 * (e.g., the lowest request) and continues moving
 * in the *same* direction.
 * ===================================================== */

/**
 * Implements the C-LOOK (Circular LOOK) algorithm.
 * Characteristics: Efficient and provides good, uniform wait times.
 */
class CLOOK extends AlgorithmBase {

    /**
     * Gets the description for the C-LOOK algorithm.
     * @static
     * @returns {string} The algorithm's description.
     */
    static get description() {
        return 'C-LOOK (Circular LOOK): A "smarter" C-SCAN. The head "jumps" from the last request in one direction to the first in the other.';
    }

    /**
     * Executes the C-LOOK (Circular) algorithm.
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

        // --- C-LOOK Logic (always moves high) ---

        // 1. Service all requests to the right
        sequence.push(...rightRequests);

        // 2. If there are requests on the left, jump to them
        // and service them in ascending order.
        if (leftRequests.length > 0) {
            sequence.push(...leftRequests);
        }

        return sequence;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CLOOK;
}