/* =====================================================
 * JS/STATE-MANAGER.JS - CENTRALIZED STATE MANAGEMENT
 * ===================================================== */

class StateManager {
    constructor() {
        // Simulation Parameters
        this.algorithm = 'fcfs';
        this.initialHeadPosition = 53;
        this.maxTrackNumber = 199;
        this.requestQueue = [98, 183, 37, 122, 14, 124, 65, 67]; // Default queue
        this.direction = 'low'; // 'low' or 'high' for SCAN/LOOK
        
        // Current Simulation State
        this.allSteps = []; // Pre-calculated steps
        this.currentStepIndex = 0;
        this.isRunning = false;
        this.animationSpeed = 5; // 1-10 scale
        
        // Execution Statistics (reset by resetSimulation)
        this.totalHeadMovement = 0;
        this.seeksCount = 0;
        this.averageSeekTime = 0;
        this.currentHeadPosition = 53;
        this.pendingRequests = [];
        this.servicedRequests = [];
        this.nextTarget = null;
        
        // UI State
        this.isInitialized = false;

        // Initialize with default values
        this.resetSimulation();
    }

    /**
     * Initialize state with user input parameters
     * @param {Object} params - Configuration parameters
     */
    initializeWithParams(params) {
        this.algorithm = params.algorithm || 'fcfs';
        this.initialHeadPosition = parseInt(params.initialHeadPosition) || 53;
        this.maxTrackNumber = parseInt(params.maxTrackNumber) || 199;
        this.requestQueue = this.parseRequestQueue(params.requestQueue) || [];
        this.direction = params.direction || 'low';
        
        // Reset simulation with these new base parameters
        this.resetSimulation();
        this.isInitialized = true;
    }

    /**
     * Parse comma-separated request queue string into array
     * @param {string} queueString - Comma-separated string
     * @returns {Array<number>} Array of request positions
     */
    parseRequestQueue(queueString) {
        if (!queueString || typeof queueString !== 'string') {
            return [];
        }

        const maxTrack = this.maxTrackNumber; // Use current maxTrack for validation
        const requests = queueString
            .split(',')
            .map(str => {
                const num = parseInt(str.trim());
                return !isNaN(num) ? num : null;
            })
            .filter(num => num !== null && num >= 0 && num <= maxTrack);
        
        // Remove duplicates
        return [...new Set(requests)];
    }

    /**
     * Reset simulation to initial parameter state
     */
    resetSimulation() {
        this.allSteps = [];
        this.currentStepIndex = 0;
        this.isRunning = false;
        
        // Reset statistics based on initial params
        this.totalHeadMovement = 0;
        this.seeksCount = 0;
        this.averageSeekTime = 0;
        this.currentHeadPosition = this.initialHeadPosition;
        this.pendingRequests = [...this.requestQueue];
        this.servicedRequests = [];
        this.nextTarget = this.pendingRequests.length > 0 ? this.pendingRequests[0] : null;

        // Create a default initial step
        this.allSteps = [this.createInitialStep()];
    }

    /**
     * Pre-calculate entire simulation sequence
     * @param {Function} algorithmClass - Algorithm class to use
     */
    generateSequence(algorithmClass) {
        // Start from a clean slate based on current params
        this.resetSimulation(); 
        
        try {
            // Create algorithm instance
            const algorithm = new algorithmClass(
                this.initialHeadPosition,
                this.maxTrackNumber,
                [...this.requestQueue],
                this.direction
            );

            // Generate sequence from algorithm
            const sequence = algorithm.execute();

            // Convert sequence to steps array
            this.allSteps = this.convertSequenceToSteps(sequence);

            // Ensure at least one step (initial state)
            if (this.allSteps.length === 0) {
                this.allSteps = [this.createInitialStep()];
            }
            
            // Set first step's nextTarget correctly
            if (this.allSteps.length > 1) {
                this.allSteps[0].nextTarget = this.allSteps[1].headPosition;
            } else {
                this.allSteps[0].nextTarget = null;
            }
            
            this.updateStatistics(); // Update state to step 0
            return this.allSteps;

        } catch (error) {
            console.error('Error generating sequence:', error);
            this.allSteps = [this.createInitialStep()]; // Reset to initial
            this.updateStatistics();
            return this.allSteps;
        }
    }

    /**
     * Convert algorithm sequence to step objects
     * @param {Array} sequence - Sequence from algorithm
     * @returns {Array<Object>} Array of step objects
     */
    convertSequenceToSteps(sequence) {
        const steps = [];
        let totalMovement = 0;
        let servicedQueue = [];
        let pendingQueue = [...this.requestQueue];

        // Initial step
        steps.push({
            step: 0,
            headPosition: this.initialHeadPosition,
            nextTarget: null, // Will be set after sequence generation
            totalHeadMovement: 0,
            seekDistance: 0,
            pendingQueue: [...pendingQueue],
            servicedQueue: [],
            currentAction: `Starting at position ${this.initialHeadPosition}. ${pendingQueue.length} pending requests.`
        });

        // Generate steps for each movement
        for (let i = 1; i < sequence.length; i++) {
            const previousPos = sequence[i - 1];
            const currentPos = sequence[i];
            const seekDistance = Math.abs(currentPos - previousPos);
            totalMovement += seekDistance;

            // Check if this request was just serviced
            let servicedThisStep = false;
            if (pendingQueue.includes(currentPos)) {
                servicedThisStep = true;
                servicedQueue.push(currentPos);
                pendingQueue = pendingQueue.filter(req => req !== currentPos);
            }

            // Determine next target
            const nextTarget = (i + 1 < sequence.length) ? sequence[i + 1] : null;

            steps.push({
                step: i,
                headPosition: currentPos,
                nextTarget: nextTarget,
                totalHeadMovement: totalMovement,
                seekDistance: seekDistance,
                pendingQueue: [...pendingQueue],
                servicedQueue: [...servicedQueue],
                currentAction: this.generateActionText(previousPos, currentPos, seekDistance, pendingQueue, servicedThisStep)
            });
        }

        return steps;
    }

    /**
     * Generate descriptive action text for current step
     * @private
     */
    generateActionText(fromPos, toPos, seekDistance, pendingQueue, serviced) {
        const servicedText = serviced ? ' ✓ Serviced!' : '';
        const pendingText = pendingQueue.length > 0 ? `${pendingQueue.length} pending` : 'All requests serviced!';
        return `Moving from ${fromPos} → ${toPos} (Seek: ${seekDistance})${servicedText} | ${pendingText}`;
    }

    /**
     * Create initial step object
     * @private
     */
    createInitialStep() {
        const pending = [...this.requestQueue];
        return {
            step: 0,
            headPosition: this.initialHeadPosition,
            nextTarget: pending.length > 0 ? pending[0] : null, // Best guess
            totalHeadMovement: 0,
            seekDistance: 0,
            pendingQueue: pending,
            servicedQueue: [],
            currentAction: `Ready to start. Head at ${this.initialHeadPosition}. ${pending.length} pending.`
        };
    }

    /**
     * Get current step object
     * @returns {Object} Current step state
     */
    getCurrentStep() {
        if (!this.allSteps || this.allSteps.length === 0) {
            return this.createInitialStep();
        }
        return this.allSteps[Math.min(this.currentStepIndex, this.allSteps.length - 1)];
    }

    /**
     * Move to next step
     * @returns {boolean} True if moved, false if at end
     */
    nextStep() {
        if (this.currentStepIndex < this.allSteps.length - 1) {
            this.currentStepIndex++;
            this.updateStatistics();
            return true;
        }
        return false;
    }

    /**
     * Move to previous step
     * @returns {boolean} True if moved, false if at beginning
     */
    previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.updateStatistics();
            return true;
        }
        return false;
    }

    /**
     * Jump to specific step
     * @param {number} stepIndex - Step number to jump to
     */
    jumpToStep(stepIndex) {
        const index = Math.max(0, Math.min(stepIndex, this.allSteps.length - 1));
        this.currentStepIndex = index;
        this.updateStatistics();
    }

    /**
     * Update statistics from current step
     * @private
     */
    updateStatistics() {
        const currentStep = this.getCurrentStep();
        this.currentHeadPosition = currentStep.headPosition;
        this.totalHeadMovement = currentStep.totalHeadMovement;
        this.pendingRequests = [...currentStep.pendingQueue];
        this.servicedRequests = [...currentStep.servicedQueue];
        this.nextTarget = currentStep.nextTarget;
        
        // Calculate average seek time
        // Use (step) as number of seeks, which is correct
        this.seeksCount = currentStep.step;
        if (this.seeksCount > 0) {
            this.averageSeekTime = this.totalHeadMovement / this.seeksCount;
        } else {
            this.averageSeekTime = 0;
        }
    }

    /**
     * Check if simulation is complete
     * @returns {boolean}
     */
    isComplete() {
        return this.currentStepIndex === this.allSteps.length - 1;
    }

    /**
     * Check if simulation is at start
     * @returns {boolean}
     */
    isAtStart() {
        return this.currentStepIndex === 0;
    }

    /**
     * Get progress percentage
     * @returns {number} Progress from 0-100
     */
    getProgress() {
        if (!this.allSteps || this.allSteps.length <= 1) return 0;
        return Math.round((this.currentStepIndex / (this.allSteps.length - 1)) * 100);
    }

    /**
     * Get all simulation data for export
     * @returns {Object} Complete simulation data
     */
    getExportData() {
        // Update stats to final step before exporting
        this.jumpToStep(this.allSteps.length - 1);
        
        return {
            algorithm: this.algorithm,
            initialHeadPosition: this.initialHeadPosition,
            maxTrackNumber: this.maxTrackNumber,
            requestQueue: this.requestQueue,
            direction: this.direction,
            totalHeadMovement: this.totalHeadMovement,
            averageSeekTime: this.averageSeekTime.toFixed(2),
            seeksCount: this.seeksCount,
            allSteps: this.allSteps,
            timestamp: new Date().toLocaleString()
        };
    }

    /**
     * Set animation speed (1-10)
     * @param {number} speed - Speed value 1-10
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(1, Math.min(10, speed));
    }

    /**
     * Get animation delay in milliseconds
     * @returns {number} Delay in ms
     */
    getAnimationDelay() {
        // Maps speed 1 (slow) to 1000ms
        // Maps speed 10 (fast) to 100ms
        // (11 - speed) * 100 would map 1->1000, 10->100
        return (11 - this.animationSpeed) * 100;
    }

    /**
     * Toggle running state
     */
    toggleRunning() {
        this.isRunning = !this.isRunning;
        return this.isRunning;
    }

    /**
     * Pause simulation
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Resume simulation
     */
    resume() {
        if (!this.isComplete()) {
            this.isRunning = true;
        }
    }

    /**
     * Get step info string
     * @returns {string} Step information
     */
    getStepInfo() {
        // Use allSteps.length - 1 as the max step number
        const totalSteps = this.allSteps.length > 0 ? this.allSteps.length - 1 : 0;
        return `${this.currentStepIndex} / ${totalSteps}`;
    }

    /**
     * Validate parameters before simulation
     * @returns {Object} Validation result {valid: boolean, errors: Array}
     */
    validateParameters() {
        const errors = [];

        if (this.requestQueue.length === 0) {
            errors.push('Request queue cannot be empty.');
        }

        if (this.initialHeadPosition < 0 || this.initialHeadPosition > this.maxTrackNumber) {
            errors.push(`Initial head position must be between 0 and ${this.maxTrackNumber}.`);
        }

        if (this.maxTrackNumber < 10) {
            errors.push('Max track number must be at least 10.');
        }
        
        // Check if all requests are within bounds (should be handled by parseRequestQueue, but good to double-check)
        if (this.requestQueue.some(req => req > this.maxTrackNumber || req < 0)) {
            errors.push('One or more requests are outside the Max Track boundary.');
        }


        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
