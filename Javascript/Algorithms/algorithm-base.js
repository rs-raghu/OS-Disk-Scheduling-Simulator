/* =====================================================
 * JS/ALGORITHMS/ALGORITHM-BASE.JS - BASE ALGORITHM CLASS
 * -----------------------------------------------------
 * This "abstract" base class defines the common interface
 * and provides a suite of utility methods that all
 * disk scheduling algorithms can inherit.
 * ===================================================== */

/**
 * Abstract base class for all disk scheduling algorithms.
 * @abstract
 */
class AlgorithmBase {
    /**
     * Initializes the algorithm with all necessary parameters.
     * @param {number} initialPosition - The starting position of the disk head.
     * @param {number} maxTrack - The maximum track number on the disk.
     * @param {Array<number>} requests - A clone of the request queue.
     * @param {string} [direction='low'] - The initial direction ('low' or 'high').
     */
    constructor(initialPosition, maxTrack, requests, direction = 'low') {
        /** @type {number} */
        this.initialPosition = initialPosition;
        /** @type {number} */
        this.maxTrack = maxTrack;
        /** @type {Array<number>} */
        this.requests = [...requests]; // Clone array to prevent mutation of state
        /** @type {string} */
        this.direction = direction;
        
        // Perform initial validation
        this.validateInput();
    }

    /**
     * Provides a default description. Subclasses should override this.
     * @static
     * @returns {string} The algorithm's description.
     */
    static get description() {
        return 'A disk scheduling algorithm.';
    }

    /**
     * Validates the constructor inputs.
     * @private
     * @throws {Error} if any parameter is invalid.
     */
    validateInput() {
        if (this.requests.length === 0) {
            throw new Error('Request queue cannot be empty');
        }
        if (this.initialPosition < 0 || this.initialPosition > this.maxTrack) {
            throw new Error(`Initial position must be between 0 and ${this.maxTrack}`);
        }
        for (const req of this.requests) {
            if (req < 0 || req > this.maxTrack) {
                throw new Error(`Request position ${req} is out of range [0, ${this.maxTrack}]`);
            }
        }
    }

    /**
     * Executes the algorithm and returns the sequence of visited tracks.
     * **This method must be implemented by all subclasses.**
     * @returns {Array<number>} An array of track numbers in the order they were visited.
     * @abstract
     */
    execute() {
        throw new Error('execute() must be implemented by subclass');
    }

    // --- UTILITY METHODS (for use by subclasses) ---

    /**
     * Calculates the total head movement for a given sequence.
     * @param {Array<number>} sequence - The sequence of visited positions.
     * @returns {number} The total head movement (sum of all seek distances).
     */
    calculateTotalMovement(sequence) {
        let total = 0;
        for (let i = 1; i < sequence.length; i++) {
            total += Math.abs(sequence[i] - sequence[i - 1]);
        }
        return total;
    }

    /**
     * Returns a new array of requests sorted in ascending order.
     * @returns {Array<number>}
     */
    getSortedRequests() {
        return [...this.requests].sort((a, b) => a - b);
    }

    /**
     * Gets requests less than the current position.
     * @param {number} currentPos - The current head position.
     * @param {boolean} [sorted=true] - If true, sorts descending (b-a) to find the nearest request first.
     * @returns {Array<number>}
     */
    getRequestsLessThan(currentPos, sorted = true) {
        let result = this.requests.filter(req => req < currentPos);
        if (sorted) {
            result.sort((a, b) => b - a); // Descending order
        }
        return result;
    }

    /**
     * Gets requests greater than or equal to the current position.
     * @param {number} currentPos - The current head position.
     * @param {boolean} [sorted=true] - If true, sorts ascending (a-b) to find the nearest request first.
     * @returns {Array<number>}
     */
    getRequestsGreaterOrEqual(currentPos, sorted = true) {
        let result = this.requests.filter(req => req >= currentPos);
        if (sorted) {
            result.sort((a, b) => a - b); // Ascending order
        }
        return result;
    }
    
    /**
     * Gets requests strictly greater than the current position.
     * @param {number} currentPos - The current head position.
     * @param {boolean} [sorted=true] - If true, sorts ascending (a-b) to find the nearest request first.
     * @returns {Array<number>}
     */
    getRequestsGreaterThan(currentPos, sorted = true) {
        let result = this.requests.filter(req => req > currentPos);
        if (sorted) {
            result.sort((a, b) => a - b); // Ascending order
        }
        return result;
    }

    /**
     * Gets requests less than or equal to the current position.
     * @param {number} currentPos - The current head position.
     * @param {boolean} [sorted=true] - If true, sorts descending (b-a) to find the nearest request first.
     * @returns {Array<number>}
     */
    getRequestsLessOrEqual(currentPos, sorted = true) {
        let result = this.requests.filter(req => req <= currentPos);
        if (sorted) {
            result.sort((a, b) => b - a); // Descending order
        }
        return result;
    }

    /**
     * Finds the request closest to the current position from a list.
     * @param {number} currentPos - The current head position.
     * @param {Array<number>} [available=null] - The list of requests to check. Defaults to all requests.
     * @returns {number|null} The closest request, or null if the list is empty.
     */
    findClosestRequest(currentPos, available = null) {
        const requestsToCheck = available || this.requests;
        if (requestsToCheck.length === 0) return null;

        return requestsToCheck.reduce((closest, current) => {
            const currentDist = Math.abs(current - currentPos);
            const closestDist = Math.abs(closest - currentPos);
            return currentDist < closestDist ? current : closest;
        });
    }

    /**
     * Initializes the sequence array with the starting position.
     * @returns {Array<number>} A new sequence array containing only the initial position.
     */
    initializeSequence() {
        return [this.initialPosition];
    }

    /**
     * Verifies that all original requests were visited in the final sequence.
     * @param {Array<number>} sequence - The generated sequence to verify.
     * @returns {boolean} True if all requests are present.
     */
    verifySequence(sequence) {
        const visitedRequests = sequence.filter(pos => this.requests.includes(pos));
        // Use Set to handle potential duplicates in sequence
        return new Set(visitedRequests).size === this.requests.length;
    }

    /**
     * Creates a deep copy of the original requests array.
     * @returns {Array<number>} A new array.
     */
    cloneRequests() {
        return [...this.requests];
    }

    /**
     * Removes a specific request from an array.
     * @param {Array<number>} array - The array to modify (e.g., a pending queue).
     * @param {number} request - The request to remove.
     * @returns {Array<number>} A new array with the request removed.
     */
    removeRequest(array, request) {
        return array.filter(r => r !== request);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlgorithmBase;
}