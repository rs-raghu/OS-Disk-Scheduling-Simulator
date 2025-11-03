/* =====================================================
 * JS/ALGORITHMS/FCFS.JS - FIRST COME FIRST SERVE
 * -----------------------------------------------------
 * This is the simplest disk scheduling algorithm.
 * It services requests in the exact order they appear
 * in the queue.
 * ===================================================== */

/**
 * Implements the FCFS (First Come First Serve) algorithm.
 * Characteristics: Simple but inefficient, can cause high seek times.
 */
class FCFS extends AlgorithmBase {

    /**
     * Gets the description for the FCFS algorithm.
     * This static property is read by the controller to update the UI.
     * @static
     * @returns {string} The algorithm's description.
     */
    static get description() {
        return 'FCFS (First Come First Serve): Serves requests in the order they arrive. Simple but highly inefficient.';
    }

    /**
     * Executes the FCFS algorithm.
     * @returns {Array<number>} The sequence of disk positions visited.
     */
    execute() {
        // FCFS simply visits the initial position, then all requests
        // in their original, un-sorted order.
        const sequence = this.initializeSequence(); // [initialPosition]
        
        // Add all requests in their original order
        sequence.push(...this.requests);
        
        return sequence;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FCFS;
}