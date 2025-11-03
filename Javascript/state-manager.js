/* =====================================================
 * JS/STATE-MANAGER.JS - CENTRALIZED STATE MANAGEMENT
 * -----------------------------------------------------
 * This class is the single source of truth for the
 * entire application. It holds:
 * 1. Configuration parameters (from user input).
 * 2. The pre-calculated simulation (allSteps).
 * 3. The current animation state (currentStepIndex, isRunning).
 * 4. Live-calculated statistics for the UI.
 * ===================================================== */

class StateManager {
    constructor() {
        // --- Simulation Parameters ---
        /** @type {string} The name of the selected algorithm (e.g., 'fcfs'). */
        this.algorithm = 'fcfs';
        /** @type {number} The starting position of the disk head. */
        this.initialHeadPosition = 53;
        /** @type {number} The maximum track number (e.g., 199). */
        this.maxTrackNumber = 199;
        /** @type {Array<number>} The parsed and validated list of requests. */
        this.requestQueue = [98, 183, 37, 122, 14, 124, 65, 67];
        /** @type {string} The initial direction for SCAN/LOOK ('low' or 'high'). */
        this.direction = 'low';
        
        // --- Simulation State ---
        /** @type {Array<object>} An array of all pre-calculated steps. */
        this.allSteps = [];
        /** @type {number} The index of the currently displayed step in allSteps. */
        this.currentStepIndex = 0;
        /** @type {boolean} Whether the animation is currently playing. */
        this.isRunning = false;
        /** @type {number} The speed of the animation (1-10). */
        this.animationSpeed = 5;
        
        // --- Live Statistics (derived from the current step) ---
        /** @type {number} Total seeks distance accumulated up to the current step. */
        this.totalHeadMovement = 0;
        /** @type {number} Total number of seeks performed up to the current step. */
        this.seeksCount = 0;
        /** @type {number} The calculated average seek time. */
        this.averageSeekTime = 0;
        /** @type {number} The head's position at the current step. */
        this.currentHeadPosition = 53;
        /** @type {Array<number>} Requests not yet serviced at the current step. */
        this.pendingRequests = [];
        /** @type {Array<number>} Requests serviced up to the current step. */
        this.servicedRequests = [];
        /** @type {number | null} The next track the head will move to. */
        this.nextTarget = null;
        
        /** @type {boolean} Flag to indicate if params have been set. */
        this.isInitialized = false;

        // Initialize state with default values
        this.resetSimulation();
    }

    /**
     * Initializes the state with user-provided parameters from the DOM.
     * @param {object} params - Configuration parameters object.
     * @param {string} params.algorithm
     * @param {string} params.initialHeadPosition
     * @param {string} params.maxTrackNumber
     * @param {string} params.requestQueue
     * @param {string} params.direction
     */
    initializeWithParams(params) {
        this.algorithm = params.algorithm || 'fcfs';
        this.initialHeadPosition = parseInt(params.initialHeadPosition) || 53;
        this.maxTrackNumber = parseInt(params.maxTrackNumber) || 199;
        // Parse the queue string *after* setting maxTrackNumber for validation
        this.requestQueue = this.parseRequestQueue(params.requestQueue) || [];
        this.direction = params.direction || 'low';
        
        // Reset simulation with these new base parameters
        this.resetSimulation();
        this.isInitialized = true;
    }

    /**
     * Parses a comma-separated string into a validated array of numbers.
     * Filters out duplicates and numbers outside the [0, maxTrackNumber] range.
     * @param {string} queueString - The comma-separated string of requests.
     * @returns {Array<number>} A sorted, unique array of valid request numbers.
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
     * Resets the simulation state to its initial (Step 0) configuration
     * based on the current parameters.
     * @private
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

        // Create a default initial step (Step 0)
        this.allSteps = [this.createInitialStep()];
    }

    /**
     * Pre-calculates the entire simulation sequence.
     * This is the core logic that runs the selected algorithm.
     * @param {class} algorithmClass - The algorithm class (e.g., FCFS, SSTF).
     * @returns {Array<object>} The array of all generated steps.
     */
    generateSequence(algorithmClass) {
        // Start from a clean slate based on current params
        this.resetSimulation(); 
        
        try {
            // 1. Create algorithm instance
            const algorithm = new algorithmClass(
                this.initialHeadPosition,
                this.maxTrackNumber,
                [...this.requestQueue],
                this.direction
            );

            // 2. Generate the raw visit sequence from the algorithm
            // e.g., [53, 98, 183, 37, ...]
            const sequence = algorithm.execute();

            // 3. Convert the raw sequence into a detailed array of step objects
            this.allSteps = this.convertSequenceToSteps(sequence);

            // 4. Ensure at least one step (initial state) exists
            if (this.allSteps.length === 0) {
                this.allSteps = [this.createInitialStep()];
            }
            
            // 5. Fix the nextTarget for Step 0
            if (this.allSteps.length > 1) {
                this.allSteps[0].nextTarget = this.allSteps[1].headPosition;
            } else {
                this.allSteps[0].nextTarget = null; // No moves to make
            }
            
            // 6. Update main state properties to reflect Step 0
            this.updateStatistics();
            return this.allSteps;

        } catch (error) {
            console.error('Error generating sequence:', error);
            this.allSteps = [this.createInitialStep()]; // Reset to initial on error
            this.updateStatistics();
            return this.allSteps;
        }
    }

    /**
     * Converts a raw algorithm sequence (array of positions) into
     * a detailed array of step objects for the timeline.
     * @param {Array<number>} sequence - The raw sequence from algorithm.execute().
     * @returns {Array<object>} An array of step objects.
     * @private
     */
    convertSequenceToSteps(sequence) {
        const steps = [];
        let totalMovement = 0;
        let servicedQueue = [];
        let pendingQueue = [...this.requestQueue];

        // 1. Add the Initial Step (Step 0)
        steps.push({
            step: 0,
            headPosition: this.initialHeadPosition,
            nextTarget: null, // Will be set in generateSequence
            totalHeadMovement: 0,
            seekDistance: 0,
            pendingQueue: [...pendingQueue],
            servicedQueue: [],
            currentAction: `Starting at position ${this.initialHeadPosition}. ${pendingQueue.length} pending requests.`
        });

        // 2. Generate steps for each subsequent movement
        for (let i = 1; i < sequence.length; i++) {
            const previousPos = sequence[i - 1];
            const currentPos = sequence[i];
            const seekDistance = Math.abs(currentPos - previousPos);
            totalMovement += seekDistance;

            // Check if this move just serviced a request
            let servicedThisStep = false;
            if (pendingQueue.includes(currentPos)) {
                servicedThisStep = true;
                servicedQueue.push(currentPos);
                pendingQueue = pendingQueue.filter(req => req !== currentPos);
            }

            // Determine the next target
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
     * Generates a human-readable description for a simulation step.
     * @param {number} fromPos - The previous head position.
     * @param {number} toPos - The current head position.
     * @param {number} seekDistance - The distance of this move.
     * @param {Array<number>} pendingQueue - The remaining queue.
     * @param {boolean} serviced - Whether a request was serviced at toPos.
     * @returns {string} The descriptive action text.
     * @private
     */
    generateActionText(fromPos, toPos, seekDistance, pendingQueue, serviced) {
        const servicedText = serviced ? ' ✓ Serviced!' : '';
        const pendingText = pendingQueue.length > 0 ? `${pendingQueue.length} pending` : 'All requests serviced!';
        return `Moving from ${fromPos} → ${toPos} (Seek: ${seekDistance})${servicedText} | ${pendingText}`;
    }

    /**
     * Creates a default step object for Step 0.
     * @returns {object} The initial step object.
     * @private
     */
    createInitialStep() {
        const pending = [...this.requestQueue];
        const nextTarget = this.allSteps?.length > 1 ? this.allSteps[1].headPosition : (pending.length > 0 ? pending[0] : null);
        return {
            step: 0,
            headPosition: this.initialHeadPosition,
            nextTarget: nextTarget, // Best guess
            totalHeadMovement: 0,
            seekDistance: 0,
            pendingQueue: pending,
            servicedQueue: [],
            currentAction: `Ready to start. Head at ${this.initialHeadPosition}. ${pending.length} pending.`
        };
    }

    /**
     * Gets the step object for the current timeline index.
     * @returns {object} The current step object.
     */
    getCurrentStep() {
        if (!this.allSteps || this.allSteps.length === 0) {
            return this.createInitialStep();
        }
        return this.allSteps[Math.min(this.currentStepIndex, this.allSteps.length - 1)];
    }

    /**
     * Moves the simulation to the next step.
     * @returns {boolean} True if the step changed, false if at the end.
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
     * Moves the simulation to the previous step.
     * @returns {boolean} True if the step changed, false if at the start.
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
     * Jumps the simulation to a specific step index.
     * @param {number} stepIndex - The step index to jump to (0-based).
     */
    jumpToStep(stepIndex) {
        const index = Math.max(0, Math.min(stepIndex, this.allSteps.length - 1));
        this.currentStepIndex = index;
        this.updateStatistics();
    }

    /**
     * Updates the top-level state properties (e.g., this.totalHeadMovement)
     * to reflect the values from the current step object.
     * This is the bridge between the pre-calculated steps and the live UI.
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
        // currentStep.step is the number of seeks performed
        this.seeksCount = currentStep.step;
        if (this.seeksCount > 0) {
            this.averageSeekTime = this.totalHeadMovement / this.seeksCount;
        } else {
            this.averageSeekTime = 0;
        }
    }

    /**
     * Checks if the simulation is at the final step.
     * @returns {boolean}
     */
    isComplete() {
        return this.currentStepIndex === this.allSteps.length - 1;
    }

    /**
     * Checks if the simulation is at the first step (Step 0).
     * @returns {boolean}
     */
    isAtStart() {
        return this.currentStepIndex === 0;
    }

    /**
     * Gets the simulation progress as a percentage.
     * @returns {number} Progress from 0-100.
     */
    getProgress() {
        if (!this.allSteps || this.allSteps.length <= 1) return 0;
        return Math.round((this.currentStepIndex / (this.allSteps.length - 1)) * 100);
    }

    /**
     * Gets all simulation data for PDF export.
     * This is a read-only method and does not change the current step.
     * @returns {object} A complete object of simulation data.
     */
    getExportData() {
        // Get the final step data without changing the current state
        const finalStep = this.allSteps.length > 0
            ? this.allSteps[this.allSteps.length - 1]
            : this.createInitialStep();
            
        const finalSeeks = finalStep.step;
        const finalTotalMovement = finalStep.totalHeadMovement;
        const finalAvgSeek = (finalSeeks > 0) ? (finalTotalMovement / finalSeeks) : 0;
        
        return {
            algorithm: this.algorithm,
            initialHeadPosition: this.initialHeadPosition,
            maxTrackNumber: this.maxTrackNumber,
            requestQueue: this.requestQueue,
            direction: (this.algorithm === 'scan' || this.algorithm === 'cscan' || this.algorithm === 'look' || this.algorithm === 'clook') ? this.direction : null,
            totalHeadMovement: finalTotalMovement,
            averageSeekTime: finalAvgSeek.toFixed(2),
            seeksCount: finalSeeks,
            allSteps: this.allSteps,
            timestamp: new Date().toLocaleString()
        };
    }

    /**
     * Sets the animation speed.
     * @param {number} speed - A value from 1 (slow) to 10 (fast).
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(1, Math.min(10, speed));
    }

    /**
     * Gets the animation delay in milliseconds based on the speed.
     * @returns {number} The delay in milliseconds.
     */
    getAnimationDelay() {
        // Maps speed 1 (slow) -> 1000ms
        // Maps speed 10 (fast) -> 100ms
        return (11 - this.animationSpeed) * 100;
    }

    /**
     * Toggles the running state.
     * @returns {boolean} The new running state.
     */
    toggleRunning() {
        this.isRunning = !this.isRunning;
        return this.isRunning;
    }

    /**
     * Pauses the simulation.
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Resumes the simulation if not complete.
     */
    resume() {
        if (!this.isComplete()) {
            this.isRunning = true;
        }
    }

    /**
     * Gets the step info string "X / Y" for the UI.
     * @returns {string} The step information string.
     */
    getStepInfo() {
        // allSteps.length - 1 is the total number of steps (since it's 0-indexed)
        const totalSteps = this.allSteps.length > 0 ? this.allSteps.length - 1 : 0;
        return `${this.currentStepIndex} / ${totalSteps}`;
    }

    /**
     * Validates the current parameters before running a simulation.
     * @returns {{valid: boolean, errors: Array<string>}} Validation result object.
     */
    validateParameters() {
        const errors = [];

        if (this.requestQueue.length === 0) {
            errors.push('Request queue cannot be empty (or all inputs were invalid/out of bounds).');
        }

        if (this.initialHeadPosition < 0 || this.initialHeadPosition > this.maxTrackNumber) {
            errors.push(`Initial head position must be between 0 and ${this.maxTrackNumber}.`);
        }

        if (this.maxTrackNumber < 10) {
            errors.push('Max track number must be at least 10.');
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