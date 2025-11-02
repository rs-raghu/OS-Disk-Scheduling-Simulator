/* =====================================================
   JS/ALGORITHMS/SSTF.JS - SHORTEST SEEK TIME FIRST
   ===================================================== */

/**
 * SSTF (Shortest Seek Time First) Algorithm
 * Always services the request closest to current head position
 * Characteristics: Reduces head movement, but can cause starvation
 */
class SSTF extends AlgorithmBase {
    /**
     * Execute SSTF algorithm
     * @returns {Array<number>} Sequence of disk positions visited
     */
    execute() {
        const sequence = this.initializeSequence();
        const remaining = this.cloneRequests();
        let currentPos = this.initialPosition;

        // Continue until all requests are served
        while (remaining.length > 0) {
            // Find the closest request to current position
            const closest = this.findClosestRequest(currentPos, remaining);
            
            // Move to that request
            sequence.push(closest);
            
            // Update current position
            currentPos = closest;
            
            // Remove the serviced request from remaining
            remaining.splice(remaining.indexOf(closest), 1);
        }

        return sequence;
    }

    /**
     * Get algorithm description
     * @returns {string}
     */
    getDescription() {
        return 'SSTF: Shortest Seek Time First. Always services the request closest to current head position. Reduces head movement but may cause starvation.';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SSTF;
}