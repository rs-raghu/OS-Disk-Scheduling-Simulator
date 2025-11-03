/* =====================================================
 * JS/ALGORITHMS/SCAN.JS - SCAN (ELEVATOR) ALGORITHM
 * -----------------------------------------------------
 * The head moves in one direction, servicing all
 * requests in its path, until it hits the end of the
 * disk. It then reverses direction and repeats.
 * ===================================================== */

/**
 * Implements the SCAN (Elevator) Algorithm.
 * Characteristics: Fairer than SSTF, prevents starvation.
 */
class SCAN extends AlgorithmBase {

    /**
     * Gets the description for the SCAN algorithm.
     * @static
     * @returns {string} The algorithm's description.
     */
    static get description() {
        return 'SCAN (Elevator Algorithm): The head moves to one end of the disk, servicing requests. It then reverses, servicing requests on the way back.';
    }

    /**
     * Executes the SCAN (Elevator) algorithm.
     * @returns {Array<number>} The sequence of disk positions visited.
     */
    execute() {
        const sequence = this.initializeSequence(); // [initialPosition]
        
        // Get all requests to the left and right, including the current position
        // getRequestsLessOrEqual is sorted descending (e.g., [53, 37, 14])
        const leftRequests = this.getRequestsLessOrEqual(this.initialPosition, true);
        // getRequestsGreaterOrEqual is sorted ascending (e.g., [53, 65, 98])
        const rightRequests = this.getRequestsGreaterOrEqual(this.initialPosition, true);

        // Remove the initial position itself from the lists,
        // as it's already in the sequence.
        if (leftRequests[0] === this.initialPosition) {
            leftRequests.shift();
        }
        if (rightRequests[0] === this.initialPosition) {
            rightRequests.shift();
        }
        
        if (this.direction === 'high') {
            // 1. Move high (right), servicing requests
            sequence.push(...rightRequests);
            
            // 2. **SCAN Logic:** Go to the end (maxTrack) if there are requests on the left to come back for.
            if (leftRequests.length > 0) {
                if (sequence[sequence.length - 1] !== this.maxTrack) {
                    sequence.push(this.maxTrack);
                }
            }
            
            // 3. Move back low (left), servicing remaining requests
            sequence.push(...leftRequests);

        } else { // direction === 'low'
            // 1. Move low (left), servicing requests
            sequence.push(...leftRequests);
            
            // 2. **SCAN Logic:** Go to the end (0) if there are requests on the right to come back for.
            if (rightRequests.length > 0) {
                 if (sequence[sequence.length - 1] !== 0) {
                    sequence.push(0);
                }
            }
           
            // 3. Move back high (right), servicing remaining requests
            sequence.push(...rightRequests);
        }

        return sequence;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SCAN;
}