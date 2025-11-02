/* =====================================================
   JS/ALGORITHMS/ALGORITHM-BASE.JS - BASE ALGORITHM CLASS
   ===================================================== */

/**
 * Abstract base class for all disk scheduling algorithms
 * Defines the common interface and utility methods
 */
class AlgorithmBase {
    /**
     * Initialize algorithm with parameters
     * @param {number} initialPosition - Initial head position
     * @param {number} maxTrack - Maximum track number
     * @param {Array<number>} requests - Array of request positions
     * @param {string} direction - Direction preference ('low' or 'high')
     */
    constructor(initialPosition, maxTrack, requests, direction = 'low') {
        this.initialPosition = initialPosition;
        this.maxTrack = maxTrack;
        this.requests = [...requests]; // Clone array to avoid mutations
        this.direction = direction;
        
        // Validation
        this.validateInput();
    }

    /**
     * Validate input parameters
     * @private
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
     * Execute algorithm and return sequence
     * Must be implemented by subclasses
     * @returns {Array<number>} Sequence of positions visited
     */
    execute() {
        throw new Error('execute() must be implemented by subclass');
    }

    /**
     * Calculate total head movement for a sequence
     * @param {Array<number>} sequence - Sequence of positions
     * @returns {number} Total movement distance
     */
    calculateTotalMovement(sequence) {
        let total = 0;
        for (let i = 1; i < sequence.length; i++) {
            total += Math.abs(sequence[i] - sequence[i - 1]);
        }
        return total;
    }

    /**
     * Get sorted requests in ascending order
     * @returns {Array<number>} Sorted requests
     */
    getSortedRequests() {
        return [...this.requests].sort((a, b) => a - b);
    }

    /**
     * Get requests less than current position
     * @param {number} currentPos - Current position
     * @param {boolean} sorted - Return sorted (default true)
     * @returns {Array<number>} Requests less than currentPos
     */
    getRequestsLessThan(currentPos, sorted = true) {
        let result = this.requests.filter(req => req < currentPos);
        if (sorted) {
            result.sort((a, b) => b - a); // Descending order
        }
        return result;
    }

    /**
     * Get requests greater than or equal to current position
     * @param {number} currentPos - Current position
     * @param {boolean} sorted - Return sorted (default true)
     * @returns {Array<number>} Requests >= currentPos
     */
    getRequestsGreaterOrEqual(currentPos, sorted = true) {
        let result = this.requests.filter(req => req >= currentPos);
        if (sorted) {
            result.sort((a, b) => a - b); // Ascending order
        }
        return result;
    }

    /**
     * Get requests greater than current position
     * @param {number} currentPos - Current position
     * @param {boolean} sorted - Return sorted (default true)
     * @returns {Array<number>} Requests > currentPos
     */
    getRequestsGreaterThan(currentPos, sorted = true) {
        let result = this.requests.filter(req => req > currentPos);
        if (sorted) {
            result.sort((a, b) => a - b); // Ascending order
        }
        return result;
    }

    /**
     * Get requests less than or equal to current position
     * @param {number} currentPos - Current position
     * @param {boolean} sorted - Return sorted (default true)
     * @returns {Array<number>} Requests <= currentPos
     */
    getRequestsLessOrEqual(currentPos, sorted = true) {
        let result = this.requests.filter(req => req <= currentPos);
        if (sorted) {
            result.sort((a, b) => b - a); // Descending order
        }
        return result;
    }

    /**
     * Find closest request to current position
     * @param {number} currentPos - Current position
     * @param {Array<number>} available - Available requests (default: all)
     * @returns {number|null} Closest request or null if none available
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
     * Get description of algorithm
     * @returns {string} Algorithm description
     */
    getDescription() {
        throw new Error('getDescription() must be implemented by subclass');
    }

    /**
     * Initialize sequence with starting position
     * @returns {Array<number>} Sequence with starting position
     */
    initializeSequence() {
        return [this.initialPosition];
    }

    /**
     * Verify sequence completeness
     * @param {Array<number>} sequence - Sequence to verify
     * @returns {boolean} True if all requests are in sequence
     */
    verifySequence(sequence) {
        const visitedRequests = sequence.filter(pos => this.requests.includes(pos));
        return visitedRequests.length === this.requests.length;
    }

    /**
     * Remove duplicate consecutive positions from sequence
     * @param {Array<number>} sequence - Original sequence
     * @returns {Array<number>} Sequence with no consecutive duplicates
     */
    removeDuplicatePositions(sequence) {
        if (sequence.length <= 1) return sequence;

        return sequence.reduce((result, current) => {
            if (result.length === 0 || result[result.length - 1] !== current) {
                result.push(current);
            }
            return result;
        }, []);
    }

    /**
     * Create a deep copy of requests array
     * @returns {Array<number>} Copy of requests
     */
    cloneRequests() {
        return [...this.requests];
    }

    /**
     * Remove request from array
     * @param {Array<number>} array - Array to modify
     * @param {number} request - Request to remove
     * @returns {Array<number>} Modified array
     */
    removeRequest(array, request) {
        return array.filter(r => r !== request);
    }

    /**
     * Format algorithm info for logging
     * @returns {string} Formatted info
     */
    getInfo() {
        return `Algorithm: ${this.constructor.name}
Initial Position: ${this.initialPosition}
Max Track: ${this.maxTrack}
Requests: ${this.requests.join(', ')}
Direction: ${this.direction}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlgorithmBase;
}