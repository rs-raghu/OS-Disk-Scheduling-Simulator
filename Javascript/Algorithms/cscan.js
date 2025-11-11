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

        // --- C-SCAN LOGIC ---
        // This algorithm depends on the starting direction

        if (this.direction === 'high') {
            // 1. Get requests at or to the right, sorted ascending
            const rightRequests = this.getRequestsGreaterOrEqual(this.initialPosition, true);
            
            // 2. Get requests to the left, sorted ascending
            // (getRequestsLessThan sorts b-a, so we reverse it to get a-b)
            const leftRequests = this.getRequestsLessThan(this.initialPosition, true).reverse(); 
            
            // Remove initial position if it was in the list
            if (rightRequests.length > 0 && rightRequests[0] === this.initialPosition) {
                rightRequests.shift();
            }

            // 1. Service all requests to the right
            sequence.push(...rightRequests);

            // 2. If there are requests on the left, scan to the end,
            //    jump to 0, and service the left requests.
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

        } else { // Direction is 'low'

            // 1. Get requests at or to the left, sorted descending
            // (getRequestsLessOrEqual sorts b-a by default)
            const leftRequests = this.getRequestsLessOrEqual(this.initialPosition, true);

            // 2. Get requests to the right, sorted descending
            // (getRequestsGreaterThan sorts a-b, so we reverse it to get b-a)
            const rightRequests = this.getRequestsGreaterThan(this.initialPosition, true).reverse();

            // Remove initial position if it was in the list
            if (leftRequests.length > 0 && leftRequests[0] === this.initialPosition) {
                leftRequests.shift();
            }

            // 1. Service all requests to the left
            sequence.push(...leftRequests);

            // 2. If there are requests on the right, scan to the start,
            //    jump to maxTrack, and service the right requests.
            if (rightRequests.length > 0) {
                // 2a. Move to the start of the disk if not already there
                if (sequence[sequence.length - 1] !== 0) {
                    sequence.push(0);
                }

                // 2b. Jump to the end of the disk
                sequence.push(this.maxTrack);

                // 2c. Service the remaining (right) requests
                sequence.push(...rightRequests);
            }
        }

        return sequence;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSCAN;
}