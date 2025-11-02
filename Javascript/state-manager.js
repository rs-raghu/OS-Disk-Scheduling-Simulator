/* =====================================================
   JS/STATE-MANAGER.JS - CENTRALIZED STATE MANAGEMENT
   ===================================================== */

class StateManager {
    constructor() {
        // Simulation Parameters
        this.algorithm = 'fcfs';
        this.initialHeadPosition = 53;
        this.maxTrackNumber = 199;
        this.requestQueue = [];
        this.direction = 'low'; // 'low' or 'high' for SCAN/LOOK
        
        // Current Simulation State
        this.allSteps = []; // Pre-calculated steps
        this.currentStepIndex = 0;
        this.isRunning = false;
        this.animationSpeed = 5; // 1-10 scale
        
        // Execution Statistics
        this.totalHeadMovement = 0;
        this.seeksCount = 0;
        this.averageSeekTime = 0;
        this.currentHeadPosition = 0;
        this.pendingRequests = [];
        this.servicedRequests = [];
        this.nextTarget = null;
        
        // UI State
        this.isInitialized = false;
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

        return queueString
            .split(',')
            .map(str => {
                const num = parseInt(str.trim());
                return !isNaN(num) ? num : null;
            })
            .filter(num => num !== null && num >= 0 && num <= this.maxTrackNumber);
    }

    /**
     * Reset simulation to initial state
     */
    resetSimulation() {
        this.allSteps = [];
        this.currentStepIndex = 0;
        this.isRunning = false;
        this.totalHeadMovement = 0;
        this.seeksCount = 0;
        this.averageSeekTime = 0;
        this.currentHeadPosition = this.initialHeadPosition;
        this.pendingRequests = [...this.requestQueue];
        this.servicedRequests = [];
        this.nextTarget = this.pendingRequests.length > 0 ? this.pendingRequests[0] : null;
    }

    /**
     * Pre-calculate entire simulation sequence
     * @param {Function} algorithmClass - Algorithm class to use
     */
    generateSequence(algorithmClass) {
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

            return this.allSteps;
        } catch (error) {
            console.error('Error generating sequence:', error);
            this.allSteps = [this.createInitialStep()];
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
            nextTarget: pendingQueue.length > 0 ? pendingQueue[0] : null,
            totalHeadMovement: 0,
            seekDistance: 0,
            pendingQueue: [...pendingQueue],
            servicedQueue: [],
            currentAction: `Starting at position ${this.initialHeadPosition}. Pending requests: ${pendingQueue.length}`
        });

        // Generate steps for each movement
        for (let i = 1; i < sequence.length; i++) {
            const previousPos = sequence[i - 1];
            const currentPos = sequence[i];
            const seekDistance = Math.abs(currentPos - previousPos);
            totalMovement += seekDistance;

            // Check if this request was just serviced
            if (pendingQueue.includes(currentPos)) {
                servicedQueue.push(currentPos);
                pendingQueue = pendingQueue.filter(req => req !== currentPos);
            }

            // Determine next target
            let nextTarget = null;
            if (pendingQueue.length > 0) {
                nextTarget = i + 1 < sequence.length ? sequence[i + 1] : pendingQueue[0];
            }

            steps.push({
                step: i,
                headPosition: currentPos,
                nextTarget: nextTarget,
                totalHeadMovement: totalMovement,
                seekDistance: seekDistance,
                pendingQueue: [...pendingQueue],
                servicedQueue: [...servicedQueue],
                currentAction: this.generateActionText(previousPos, currentPos, seekDistance, pendingQueue)
            });
        }

        return steps;
    }

    /**
     * Generate descriptive action text for current step
     * @private
     */
    generateActionText(fromPos, toPos, seekDistance, pendingQueue) {
        const serviced = this.requestQueue.includes(toPos) ? ' ✓ Serviced!' : '';
        const pending = pendingQueue.length > 0 ? `${pendingQueue.length} pending` : 'All serviced!';
        return `Moving from ${fromPos} → ${toPos} (Seek: ${seekDistance})${serviced} | ${pending}`;
    }

    /**
     * Create initial step object
     * @private
     */
    createInitialStep() {
        return {
            step: 0,
            headPosition: this.initialHeadPosition,
            nextTarget: this.pendingRequests.length > 0 ? this.pendingRequests[0] : null,
            totalHeadMovement: 0,
            seekDistance: 0,
            pendingQueue: [...this.pendingRequests],
            servicedQueue: [],
            currentAction: `Ready to start. Head at position ${this.initialHeadPosition}`
        };
    }

    /**
     * Get current step object
     * @returns {Object} Current step state
     */
    getCurrentStep() {
        if (this.allSteps.length === 0) {
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
        if (currentStep.step > 0) {
            this.seeksCount = currentStep.step;
            this.averageSeekTime = this.totalHeadMovement / this.seeksCount;
        } else {
            this.seeksCount = 0;
            this.averageSeekTime = 0;
        }
    }

    /**
     * Check if simulation is complete
     * @returns {boolean}
     */
    isComplete() {
        return this.currentStepIndex === this.allSteps.length - 1 && this.pendingRequests.length === 0;
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
        if (this.allSteps.length === 0) return 0;
        return Math.round((this.currentStepIndex / (this.allSteps.length - 1)) * 100);
    }

    /**
     * Get all simulation data for export
     * @returns {Object} Complete simulation data
     */
    getExportData() {
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
        // Higher speed = shorter delay
        // Speed 1 = 1000ms, Speed 10 = 100ms
        return (1000 / this.animationSpeed);
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
        return `${this.currentStepIndex} / ${this.allSteps.length}`;
    }

    /**
     * Validate parameters before simulation
     * @returns {Object} Validation result {valid: boolean, errors: Array}
     */
    validateParameters() {
        const errors = [];

        if (this.requestQueue.length === 0) {
            errors.push('Request queue cannot be empty');
        }

        if (this.initialHeadPosition < 0 || this.initialHeadPosition > this.maxTrackNumber) {
            errors.push(`Initial head position must be between 0 and ${this.maxTrackNumber}`);
        }

        if (this.maxTrackNumber < 10) {
            errors.push('Max track number must be at least 10');
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