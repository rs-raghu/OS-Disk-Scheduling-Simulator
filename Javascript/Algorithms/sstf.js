/* =====================================================
 * JS/ALGORITHMS/SSTF.JS - SHORTEST SEEK TIME FIRST
 * -----------------------------------------------------
 * This algorithm is a greedy algorithm that selects
 * the request with the minimum seek time (closest
 * track) from the current head position.
 * ===================================================== */

/**
 * Implements the SSTF (Shortest Seek Time First) algorithm.
 * Characteristics: Reduces average seek time, but can lead
 * to "starvation" of requests that are far from the head.
 */
class SSTF extends AlgorithmBase {

    /**
     * Gets the description for the SSTF algorithm.
     * @static
     * @returns {string} The algorithm's description.
     */
    static get description() {
        return 'SSTF (Shortest Seek Time First): Always serves the request closest to the current head position. Efficient, but can cause starvation.';
    }

    /**
     * Executes the SSTF algorithm.
     * @returns {Array<number>} The sequence of disk positions visited.
     */
    execute() {
        const sequence = this.initializeSequence(); // [initialPosition]
        const remaining = this.cloneRequests();
        let currentPos = this.initialPosition;

        // Continue until all requests are served
        while (remaining.length > 0) {
            // Find the request closest to the current head position
            const closest = this.findClosestRequest(currentPos, remaining);
            
            // Move to that request
            sequence.push(closest);
            
            // Update the current position for the next search
            currentPos = closest;
            
            // Remove the serviced request from the pending list
            remaining.splice(remaining.indexOf(closest), 1);
        }

        return sequence;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SSTF;
}