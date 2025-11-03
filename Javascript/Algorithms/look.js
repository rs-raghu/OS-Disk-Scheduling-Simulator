/* =====================================================
 * JS/ALGORITHMS/LOOK.JS - LOOK ALGORITHM
 * -----------------------------------------------------
 * A more efficient version of SCAN. The head moves in
 * one direction servicing requests, but reverses
 * immediately after servicing the last request in that
 * direction (it doesn't go to the disk end).
 * ===================================================== */

/**
 * Implements the LOOK algorithm.
 * Characteristics: More efficient than SCAN as it avoids
 * unnecessary travel to the disk ends.
 */
class LOOK extends AlgorithmBase {

    /**
     * Gets the description for the LOOK algorithm.
     * @static
     * @returns {string} The algorithm's description.
     */
    static get description() {
        return 'LOOK: A "smarter" SCAN. The head reverses direction after the last request in its path, without going to the end of the disk.';
    }

    /**
     * Executes the LOOK algorithm.
     * @returns {Array<number>} The sequence of disk positions visited.
     */
    execute() {
        const sequence = this.initializeSequence(); // [initialPosition]

        // 1. Get requests to the left, sorted descending (e.g., [37, 14])
        const leftRequests = this.getRequestsLessThan(this.initialPosition, true);
        
        // 2. Get requests to the right, sorted ascending (e.g., [65, 98])
        const rightRequests = this.getRequestsGreaterThan(this.initialPosition, true);
        
        // --- LOOK Logic ---
        if (this.direction === 'high') {
            // 1. Move high, servicing all requests
            sequence.push(...rightRequests);
            
            // 2. Move low, servicing all remaining
            sequence.push(...leftRequests);
        } else { // direction === 'low'
            // 1. Move low, servicing all requests
            sequence.push(...leftRequests);
            
            // 2. Move high, servicing all remaining
            sequence.push(...rightRequests);
        }

        return sequence;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LOOK;
}