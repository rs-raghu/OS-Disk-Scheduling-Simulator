/* =====================================================
   JS/ALGORITHMS/FCFS.JS - FIRST COME FIRST SERVE
   ===================================================== */

/**
 * FCFS (First Come First Serve) Algorithm
 * Processes requests in the order they arrive
 * Characteristics: Simple but inefficient, causes head thrashing
 */
class FCFS extends AlgorithmBase {
    /**
     * Execute FCFS algorithm
     * @returns {Array<number>} Sequence of disk positions visited
     */
    execute() {
        // FCFS simply visits requests in the order they appear
        const sequence = this.initializeSequence();
        
        // Add all requests in their original order
        sequence.push(...this.requests);
        
        return sequence;
    }

    /**
     * Get algorithm description
     * @returns {string}
     */
    getDescription() {
        return 'FCFS: First Come First Serve. Serves requests in the order they arrive, without any optimization. Simple but inefficient.';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FCFS;
}