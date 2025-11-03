/* =====================================================
 * JS/CONTROLLER.JS - APPLICATION CONTROLLER
 * -----------------------------------------------------
 * This class acts as the "brain" of the application.
 * It connects the State (data), the Renderer (view),
 * and the user interface (HTML elements).
 *
 * Responsibilities:
 * - Setting up all event listeners.
 * - Orchestrating the simulation (generating, starting, stopping).
 * - Managing the animation loop (using requestAnimationFrame).
 * - Handling all UI updates (stats, queues, buttons).
 * - Managing PDF export.
 * ===================================================== */

class Controller {
    /**
     * Creates a new Controller instance.
     * @param {StateManager} stateManager - The application's state manager.
     * @param {CanvasRenderer} canvasRenderer - The application's canvas renderer.
     * @param {function} showSimulationView - Function to show the simulation panel.
     * @param {function} showConfigView - Function to show the configuration panel.
     */
    constructor(stateManager, canvasRenderer, showSimulationView, showConfigView) {
        this.state = stateManager;
        this.renderer = canvasRenderer;
        this.algorithms = new Map();
        
        // View-switching functions from main.js
        this.showSimulationView = showSimulationView;
        this.showConfigView = showConfigView;

        /**
         * A cache for frequently accessed DOM elements.
         * @type {Object<string, HTMLElement>}
         */
        this.ui = {};

        // --- Animation Loop Properties ---
        /**
         * The ID of the current animation frame request.
         * @type {number | null}
         * @private
         */
        this.animationFrameId = null;
        
        /**
         * The timestamp of the last animation step.
         * @type {number}
         * @private
         */
        this.lastTimestamp = 0;
    }

    /**
     * Registers a new algorithm class with the controller.
     * @param {string} name - The short name (key) of the algorithm (e.g., "fcfs").
     * @param {class} AlgorithmClass - The algorithm class (e.g., FCFS).
     */
    registerAlgorithm(name, AlgorithmClass) {
        this.algorithms.set(name, AlgorithmClass);
    }

    /**
     * Initializes the controller by caching UI elements and setting up listeners.
     */
    init() {
        // Cache all UI elements for performance
        this.ui.playPauseBtn = document.getElementById('playPauseBtn');
        this.ui.stepForwardBtn = document.getElementById('stepForwardBtn');
        this.ui.stepBackwardBtn = document.getElementById('stepBackwardBtn');
        this.ui.resetBtn = document.getElementById('resetBtn');
        this.ui.exportBtn = document.getElementById('exportBtn');
        this.ui.algorithmSelect = document.getElementById('algorithmSelect');
        this.ui.speedSlider = document.getElementById('speedSlider');

        // Statistics elements
        this.ui.currentHeadPosition = document.getElementById('currentHeadPosition');
        this.ui.totalHeadMovement = document.getElementById('totalHeadMovement');
        this.ui.seeksCount = document.getElementById('seeksCount');
        this.ui.averageSeekTime = document.getElementById('averageSeekTime');
        this.ui.nextTargetDisplay = document.getElementById('nextTargetDisplay');

        // Queue containers
        this.ui.initialQueue = document.getElementById('initialQueue');
        this.ui.servicedQueue = document.getElementById('servicedQueue');
        
        // Step display
        this.ui.currentStepDisplay = document.getElementById('currentStepDisplay');
        this.ui.currentActionText = document.getElementById('currentActionText'); // For errors/info
        this.ui.algorithmDescription = document.getElementById('algorithmDescription');

        // Setup event listeners for the SIMULATION PANEL
        this.setupEventListeners();
    }

    /**
     * Sets up all event listeners for the simulation controls.
     * @private
     */
    setupEventListeners() {
        this.ui.playPauseBtn.addEventListener('click', () => this.toggleRunPause());
        this.ui.stepForwardBtn.addEventListener('click', () => this.handleStepForward());
        this.ui.stepBackwardBtn.addEventListener('click', () => this.handleStepBackward());
        this.ui.resetBtn.addEventListener('click', () => this.handleResetAnimation());
        this.ui.exportBtn.addEventListener('click', () => this.handleExport());
        this.ui.speedSlider.addEventListener('input', (e) => this.handleSpeedChange(e));

        // Window resize
        window.addEventListener('resize', () => this.renderer.handleResize());
    }

    /**
     * Handles the click of the main "Run Simulation" button.
     * Validates inputs, generates the simulation, and switches to the sim view.
     */
    handleRunSimulation() {
        console.log('Handle Run Simulation');
        const success = this.generateSimulation(false); // false = show errors
        if (success) {
            // Only switch views if generation was successful
            this.showSimulationView();
            // Start the animation immediately
            this.toggleRunPause(true); // Force play
        }
    }

    /**
     * Handles the click of the "Reset Algorithm" button.
     * Stops animation, clears state, and returns to the config view.
     */
    handleFullReset() {
        console.log('Handle Full Reset');
        this.stopAnimation();
        
        this.state.initializeWithParams(this.getParametersFromDOM());
        
        this.updateAllUI(); 
        this.renderer.resetTrace(); 
        this.renderer.render(); 
        
        // Manually clear the persistent queue displays
        if (this.ui.initialQueue) {
            this.ui.initialQueue.innerHTML = '<span class="queue-empty">No simulation run</span>';
        }
        if (this.ui.servicedQueue) {
            this.ui.servicedQueue.innerHTML = '<span class="queue-empty">No services yet</span>';
        }

        this.showConfigView(); // Switch back to config panel
    }


    /**
     * Generates the simulation steps based on the current DOM parameters.
     * @param {boolean} [silent=false] - If true, validation errors will not be shown to the user.
     * @returns {boolean} True if simulation was generated successfully, false otherwise.
     */
    generateSimulation(silent = false) {
        try {
            this.stopAnimation(); // Stop any running animation

            // 1. Get parameters from DOM
            const params = this.getParametersFromDOM();

            // 2. Validate parameters and initialize state
            this.state.initializeWithParams(params);
            const validation = this.state.validateParameters();

            if (!validation.valid) {
                if (!silent) {
                    this.showError('Error: ' + validation.errors.join('\n'));
                }
                return false; // Indicate failure
            }

            // 3. Get the correct algorithm class
            const AlgorithmClass = this.algorithms.get(this.state.algorithm);
            if (!AlgorithmClass) {
                throw new Error(`Algorithm ${this.state.algorithm} not found`);
            }

            // 4. Generate the full sequence of steps
            this.state.generateSequence(AlgorithmClass);
            this.renderer.resetTrace();
            this.renderer.updateTraceHistory();

            // 5. Update UI to Step 0
            this.updateAllUI(); // Updates stats, queues, etc. to their initial state
            this.updateAlgorithmDescription();
            this.updateInitialQueue();
            
            return true; // Indicate success

        } catch (error) {
            if (!silent) {
                console.error('Error generating simulation:', error);
                this.showError('Error: ' + error.message);
            }
            return false; // Indicate failure
        }
    }

    /**
     * Reads all input values from the DOM.
     * @returns {object} An object containing all configuration parameters.
     * @private
     */
    getParametersFromDOM() {
        return {
            algorithm: document.getElementById('algorithmSelect').value,
            initialHeadPosition: document.getElementById('initialHeadPosition').value,
            maxTrackNumber: document.getElementById('maxTrackNumber').value,
            requestQueue: document.getElementById('requestQueue').value,
            direction: document.querySelector('input[name="direction"]:checked').value
        };
    }

    /**
     * Toggles the animation between running and paused states.
     * @param {boolean | null} [forcePlay=null] - If true, force play. If false, force pause.
     */
    toggleRunPause(forcePlay = null) {
        // If the animation is finished, "Play" becomes "Replay"
        if (this.state.isComplete()) {
            this.handleResetAnimation();
            forcePlay = true; // Always play after reset
        }

        const shouldBeRunning = forcePlay !== null ? forcePlay : !this.state.isRunning;

        if (shouldBeRunning) {
            this.state.resume();
            this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Pause</span>';
            this.ui.playPauseBtn.classList.add('active');
            this.startAnimation();
        } else {
            this.state.pause();
            this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
            this.ui.playPauseBtn.classList.remove('active');
            this.stopAnimation();
        }
    }

    /**
     * Starts the animation loop using requestAnimationFrame.
     * @private
     */
    startAnimation() {
        if (this.animationFrameId) {
            // Loop is already running
            return;
        }
        
        // Reset last timestamp to start fresh
        this.lastTimestamp = performance.now();
        
        // Bind the loop function to `this` context
        const animationLoop = this.animationLoop.bind(this);
        this.animationFrameId = requestAnimationFrame(animationLoop);
    }

    /**
     * The main animation loop.
     * @param {number} timestamp - The current time provided by requestAnimationFrame.
     * @private
     */
    animationLoop(timestamp) {
        if (!this.state.isRunning) {
            this.animationFrameId = null; // Stop the loop
            return;
        }

        const delay = this.state.getAnimationDelay();
        const elapsed = timestamp - this.lastTimestamp;

        if (elapsed > delay) {
            this.lastTimestamp = timestamp - (elapsed % delay); // Adjust timestamp
            
            if (!this.state.nextStep()) {
                // --- Animation finished ---
                this.stopAnimation(); // This also pauses state
                this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Replay</span>';
                this.ui.playPauseBtn.classList.remove('active');
            } else {
                // --- Normal step ---
                this.renderer.updateTraceHistory();
                this.updateAllUI(); // This will update pending queue and stats
            }
        }

        // Request the next frame
        if (this.state.isRunning) {
             this.animationFrameId = requestAnimationFrame(this.animationLoop.bind(this));
        } else {
            this.animationFrameId = null;
        }
    }


    /**
     * Stops the animation loop.
     * @private
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.state.pause(); // Ensure state knows it's paused
    }

    /**
     * Handles the "Step Forward" button click.
     */
    handleStepForward() {
        this.stopAnimation();
        this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        if (this.state.nextStep()) {
            this.renderer.updateTraceHistory();
            this.updateAllUI();
        }
    }

    /**
     * Handles the "Step Backward" button click.
     */
    handleStepBackward() {
        this.stopAnimation();
        this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        if (this.state.previousStep()) {
            this.renderer.updateTraceHistory(); 
            this.updateAllUI();
        }
    }

    /**
     * Handles the "Reset Animation" button click.
     * Resets the animation to step 0 without regenerating data.
     */
    handleResetAnimation() {
        this.stopAnimation();
        this.state.jumpToStep(0); // Go to step 0
        this.renderer.resetTrace();
        this.renderer.updateTraceHistory();

        this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        // Update UI to reflect Step 0
        this.updateAllUI();
    }

    /**
     * Handles the animation speed slider change.
     * @param {Event} event - The input event from the slider.
     */
    handleSpeedChange(event) {
        const speed = parseInt(event.target.value);
        this.state.setAnimationSpeed(speed);
        // No need to restart the loop, the new delay will be picked up
        // on the next frame check.
    }

    /**
     * Handles the "Export PDF" button click.
     * Pauses animation, generates PDF, and resumes.
     */
    async handleExport() {
        const wasRunning = this.state.isRunning;
        if (wasRunning) {
            this.toggleRunPause(false); // Force pause
        }

        // Wait a moment for UI to settle
        await new Promise(resolve => setTimeout(resolve, 50));

        // Save current step, jump to end for a complete report
        const currentStep = this.state.currentStepIndex;
        this.state.jumpToStep(this.state.allSteps.length - 1);
        this.renderer.updateTraceHistory();
        this.updateAllUI(); // Update UI to final state

        try {
            const exportData = this.state.getExportData();
            await this.generatePDF(exportData);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showError('Error: ' + error.message);
        }

        // Jump back to the step the user was on
        this.state.jumpToStep(currentStep);
        this.renderer.updateTraceHistory();
        this.updateAllUI(); // Update UI back to previous state

        if (wasRunning) {
           this.toggleRunPause(true); // Resume playing
        }
    }


    /**
     * Generates a multi-page PDF report of the simulation.
     * This is a complex utility function. In a larger refactor,
     * it could be moved to its own `PDFGenerator.js` module.
     * @param {object} exportData - Data object from stateManager.getExportData().
     * @private
     */
    async generatePDF(exportData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');

        // --- STYLING CONSTANTS ---
        const COLOR_PRIMARY = '#007BFF'; // Blue
        const COLOR_DARK = '#333333';    // Dark gray text
        const COLOR_LIGHT = '#777777';   // Light gray text
        const COLOR_BG = '#F8F9FA';      // Light gray background
        const COLOR_WHITE = '#FFFFFF';
        const margin = 40;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - margin * 2;
        let yPos = margin;

        // --- HELPER FUNCTION: Draw Section Header ---
        const drawSectionHeader = (text, y) => {
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLOR_DARK);
            doc.text(text, margin, y);
            y += 8; // space for line
            doc.setDrawColor(COLOR_PRIMARY); // Blue line
            doc.setLineWidth(2);
            doc.line(margin, y, margin + contentWidth, y);
            return y + 25; // Return new yPos
        };

        // --- HELPER FUNCTION: Draw Key-Value Pair ---
        const drawKeyValue = (key, value, y) => {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLOR_DARK);
            doc.text(key + ':', margin + 10, y);
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(COLOR_DARK);
            doc.text(String(value), margin + 160, y); // Align values
            return y + 20;
        };

        // --- 1. TITLE & TIMESTAMP ---
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(COLOR_PRIMARY);
        doc.text('Disk Scheduling Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 25;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(COLOR_LIGHT);
        doc.text(`Generated: ${exportData.timestamp}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 40;

        // --- 2. PARAMETERS ---
        yPos = drawSectionHeader('Parameters', yPos);
        const paramYStart = yPos; // For box drawing

        yPos = drawKeyValue('Algorithm', exportData.algorithm.toUpperCase(), yPos);
        yPos = drawKeyValue('Initial Head Position', exportData.initialHeadPosition, yPos);
        yPos = drawKeyValue('Max Track Number', exportData.maxTrackNumber, yPos);
        if (exportData.direction) {
            yPos = drawKeyValue('Direction', exportData.direction, yPos);
        }
        
        // Request Queue (special handling)
        doc.setFont(undefined, 'bold');
        doc.setTextColor(COLOR_DARK);
        doc.text('Request Queue:', margin + 10, yPos);
        yPos += 20;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(COLOR_LIGHT);
        const queueText = doc.splitTextToSize(exportData.requestQueue.join(', '), contentWidth - 20);
        doc.text(queueText, margin + 10, yPos);
        yPos += (queueText.length * 12) + 10;

        // Draw box around parameters
        doc.setDrawColor(COLOR_LIGHT);
        doc.setLineWidth(0.5);
        doc.rect(margin, paramYStart - 20, contentWidth, yPos - paramYStart + 10, 'S'); // 'S' = stroke
        yPos += 30;

        // --- 3. RESULTS (STAT BOXES) ---
        yPos = drawSectionHeader('Results', yPos);
        
        const statWidth = (contentWidth - 20) / 3; // 3 stats, 10pt padding
        const statHeight = 60;

        // Helper to draw a stat box
        const drawStatBox = (x, y, w, h, label, value) => {
            doc.setFillColor(COLOR_BG);
            doc.setDrawColor(COLOR_PRIMARY);
            doc.setLineWidth(1);
            doc.rect(x, y, w, h, 'FD'); // Fill and Draw

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(COLOR_LIGHT);
            doc.text(label, x + w / 2, y + 20, { align: 'center' });

            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLOR_PRIMARY);
            doc.text(String(value), x + w / 2, y + 45, { align: 'center' });
        };

        drawStatBox(margin, yPos, statWidth, statHeight, 'Total Head Movement', exportData.totalHeadMovement);
        drawStatBox(margin + statWidth + 10, yPos, statWidth, statHeight, 'Total Seeks', exportData.seeksCount);
        drawStatBox(margin + (statWidth + 10) * 2, yPos, statWidth, statHeight, 'Average Seek Time', exportData.averageSeekTime);

        yPos += statHeight + 40;

        // --- 4. VISUALS ---
        yPos = drawSectionHeader('Visuals', yPos);
        
        try {
            const diskCanvas = document.getElementById('diskCanvas');
            const graphCanvas = document.getElementById('graphCanvas');
            const diskImg = await html2canvas(diskCanvas, { scale: 2 });
            const graphImg = await html2canvas(graphCanvas, { scale: 2 });
            const diskImgData = diskImg.toDataURL('image/png');
            const graphImgData = graphImg.toDataURL('image/png');
            const diskRatio = diskImg.height / diskImg.width;
            const graphRatio = graphImg.height / graphImg.width;
            const imgHeightDisk = contentWidth * diskRatio;
            const imgHeightGraph = contentWidth * graphRatio;

            // Check for page break before adding images
            if (yPos + imgHeightDisk + imgHeightGraph + 80 > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLOR_DARK);
            doc.text('Disk Trace:', margin, yPos);
            yPos += 20;
            doc.addImage(diskImgData, 'PNG', margin, yPos, contentWidth, imgHeightDisk);
            yPos += imgHeightDisk + 20;

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLOR_DARK);
            doc.text('Position vs. Time Graph:', margin, yPos);
            yPos += 20;
            doc.addImage(graphImgData, 'PNG', margin, yPos, contentWidth, imgHeightGraph);
            yPos += imgHeightGraph + 20;

        } catch (e) {
            console.error('Error adding canvas images:', e);
            doc.setTextColor(255, 0, 0);
            doc.text('Error rendering canvas images.', margin, yPos);
            yPos += 20;
        }

        // --- 5. EXECUTION TRACE (NEW PAGE) ---
        doc.addPage();
        yPos = margin;
        yPos = drawSectionHeader('Execution Trace', yPos);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');

        for (const step of exportData.allSteps) {
            // Check for page break
            if (yPos > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPos = margin;
                yPos = drawSectionHeader('Execution Trace (continued)', yPos); // Add new header
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
            }

            // Draw a light box for each step row
            const rowHeight = 20;
            doc.setFillColor((step.step % 2 === 0) ? COLOR_BG : COLOR_WHITE);
            doc.rect(margin, yPos, contentWidth, rowHeight, 'F'); // Fill

            let xPos = margin + 5;
            const yText = yPos + 14; // Vertically centered text

            // Step Number
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLOR_PRIMARY);
            doc.text(`Step ${step.step}:`, xPos, yText);
            xPos += 60;

            // Other info
            doc.setFont(undefined, 'normal');
            doc.setTextColor(COLOR_DARK);
            
            doc.text(`Head: ${step.headPosition}`, xPos, yText);
            xPos += 70;
            
            doc.text(`Seek: ${step.seekDistance}`, xPos, yPos + 14);
            xPos += 50;

            doc.text(`Total Move: ${step.totalHeadMovement}`, xPos, yText);
            xPos += 80;

            // Serviced Queue (truncated)
            doc.setTextColor(COLOR_LIGHT);
            const servicedText = `Serviced: [${step.servicedQueue.join(', ') || '-'}]`;
            const truncatedText = doc.splitTextToSize(servicedText, contentWidth - xPos - 5);
            doc.text(truncatedText[0], xPos, yText); // Only show first line

            yPos += rowHeight;
        }

        // --- SAVE THE PDF ---
        doc.save(`disk-scheduling-${exportData.algorithm}.pdf`);
    }

    /**
     * Updates all real-time UI elements (stats, queues, etc.)
     * @private
     */
    updateAllUI() {
        this.updateStatistics();
        this.updateServicedQueue(); // Live update of serviced queue
        this.updateStepInfo();
        this.updateActionText(); // Clear/update any info text
        this.renderer.render();
    }

    /**
     * Updates the "Live Statistics" panel.
     * @private
     */
    updateStatistics() {
        // Use cached UI elements
        this.ui.currentHeadPosition.textContent = this.state.currentHeadPosition;
        this.ui.totalHeadMovement.textContent = this.state.totalHeadMovement;
        this.ui.seeksCount.textContent = this.state.seeksCount;
        this.ui.averageSeekTime.textContent = this.state.averageSeekTime.toFixed(2);
        this.ui.nextTargetDisplay.textContent = this.state.nextTarget !== null ? this.state.nextTarget : '-';
    }


    /**
     * Populates the "Initial Request Queue" display.
     * This is typically called once at the start.
     * @private
     */
    updateInitialQueue() {
        if (!this.ui.initialQueue) return;

        if (this.state.requestQueue.length === 0) {
            this.ui.initialQueue.innerHTML = '<span class="queue-empty">No simulation run</span>';
        } else {
            this.ui.initialQueue.innerHTML = this.state.requestQueue
                .map(req => `<span class="queue-item">${req}</span>`)
                .join('');
        }
    }

    /**
     * Updates the "Executed Queue (Serviced)" display live.
     * @private
     */
    updateServicedQueue() {
        if (!this.ui.servicedQueue) return;

        // Get the serviced queue from the *current* step
        if (this.state.servicedRequests.length === 0) {
            this.ui.servicedQueue.innerHTML = '<span class="queue-empty">None serviced</span>';
        } else {
            this.ui.servicedQueue.innerHTML = this.state.servicedRequests
                .map(req => `<span class="queue-item">${req}</span>`)
                .join('');
        }
    }


    /**
     * Updates the "Step: X / Y" display.
     * @private
     */
    updateStepInfo() {
        if (this.ui.currentStepDisplay) {
            this.ui.currentStepDisplay.textContent = `Step: ${this.state.getStepInfo()}`;
        }
    }

    /**
     * Updates the action text (e.g., for step descriptions or errors).
     * @private
     */
    updateActionText() {
        if (this.ui.currentActionText) {
             const currentStep = this.state.getCurrentStep();
             if (currentStep) {
                this.ui.currentActionText.textContent = currentStep.currentAction;
                this.ui.currentActionText.style.color = 'var(--color-text-primary)';
                this.ui.currentActionText.style.fontWeight = 'var(--font-weight-medium)';
             }
        }
    }

    /**
     * Updates the algorithm description text in the header.
     * @private
     */
    updateAlgorithmDescription() {
        if (!this.ui.algorithmDescription) return;

        const AlgorithmClass = this.algorithms.get(this.state.algorithm);
        
        let description = "Algorithm Visualizer";
        if (AlgorithmClass && AlgorithmClass.description) {
            description = AlgorithmClass.description;
        } else if (AlgorithmClass) {
            description = this.state.algorithm.toUpperCase() + " Algorithm";
        }
        
        this.ui.algorithmDescription.textContent = description;
    }

    /**
     * Displays an error message to the user.
     * @param {string} message - The error message to display.
     * @private
     */
    showError(message) {
        console.error(message);
        if (this.ui.currentActionText) {
            this.ui.currentActionText.textContent = message;
            this.ui.currentActionText.style.color = 'red';
            this.ui.currentActionText.style.fontWeight = 'bold';
            this.ui.currentActionText.parentElement.style.display = 'block'; // Make sure it's visible
        } else {
            alert(message); // Fallback if the text element is missing
        }
    }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Controller;
}