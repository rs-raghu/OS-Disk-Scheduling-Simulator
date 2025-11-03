/* =====================================================
 * JS/CONTROLLER.JS - APPLICATION CONTROLLER
 * ===================================================== */

class Controller {
    constructor(stateManager, canvasRenderer, showSimulationView, showConfigView) {
        this.state = stateManager;
        this.renderer = canvasRenderer;
        this.algorithms = new Map();
        this.animationInterval = null;
        
        // --- NEW: UI View-Switching Functions ---
        // These are passed in from main.js
        this.showSimulationView = showSimulationView;
        this.showConfigView = showConfigView;

        // --- NEW: Button Element Cache ---
        // We cache these elements for performance
        this.ui = {};
    }

    /**
     * Register an algorithm
     * @param {string} name - Algorithm name
     * @param {Function} AlgorithmClass - Algorithm class
     */
    registerAlgorithm(name, AlgorithmClass) {
        this.algorithms.set(name, AlgorithmClass);
    }

    /**
     * Initialize the application
     */
    init() {
        // --- NEW: Cache all UI elements ---
        this.ui.playPauseBtn = document.getElementById('playPauseBtn');
        this.ui.stepForwardBtn = document.getElementById('stepForwardBtn');
        this.ui.stepBackwardBtn = document.getElementById('stepBackwardBtn');
        this.ui.resetBtn = document.getElementById('resetBtn');
        this.ui.exportBtn = document.getElementById('exportBtn');
        this.ui.algorithmSelect = document.getElementById('algorithmSelect');
        this.ui.speedSlider = document.getElementById('speedSlider');

        // Setup event listeners for the SIMULATION PANEL
        this.setupEventListeners();
    }

    /**
     * Setup all event listeners
     * @private
     */
    setupEventListeners() {
        // --- UPDATED: Listen to the NEW buttons ---
        this.ui.playPauseBtn.addEventListener('click', () => this.toggleRunPause());
        this.ui.stepForwardBtn.addEventListener('click', () => this.handleStepForward());
        this.ui.stepBackwardBtn.addEventListener('click', () => this.handleStepBackward());
        
        // This button now just resets the animation to step 0
        this.ui.resetBtn.addEventListener('click', () => this.handleResetAnimation());
        
        this.ui.exportBtn.addEventListener('click', () => this.handleExport());

        // Parameter inputs (algorithm select is in main.js)
        this.ui.speedSlider.addEventListener('input', (e) => this.handleSpeedChange(e));

        // Window resize
        window.addEventListener('resize', () => this.renderer.handleResize());
    }

    /**
     * --- NEW: Called by main.js when "Run Simulation" is clicked ---
     */
    handleRunSimulation() {
        console.log('Handle Run Simulation');
        // --- MODIFICATION: Call generateSimulation with silent=false ---
        const success = this.generateSimulation(false); // This will now show errors
        if (success) {
            // Only switch views if generation was successful
            this.showSimulationView();
            // Start the animation immediately
            this.toggleRunPause(true); // Force play
        }
    }

    /**
     * --- NEW: Called by main.js when "Reset Algorithm" is clicked ---
     */
    handleFullReset() {
        console.log('Handle Full Reset');
        this.stopAnimation();
        
        this.state.initializeWithParams(this.getParametersFromDOM());
        
        this.updateAllUI(); 
        this.renderer.resetTrace(); 
        this.renderer.render(); 
        
        // --- MODIFICATION: Manually clear the persistent queues ---
        const initialContainer = document.getElementById('initialQueue');
        const servicedContainer = document.getElementById('servicedQueue');
        if (initialContainer) {
            initialContainer.innerHTML = '<span class="queue-empty">No simulation run</span>';
        }
        if (servicedContainer) {
            servicedContainer.innerHTML = '<span class="queue-empty">No services yet</span>';
        }
        // --- END MODIFICATION ---

        this.showConfigView(); // Switch back to config panel
    }


    /**
     * Generate simulation with current parameters
     * @param {boolean} [silent=false] - If true, will not show validation errors
     */
    generateSimulation(silent = false) { // --- MODIFICATION: Added silent flag ---
        try {
            this.stopAnimation(); // Stop any running animation

            // Get parameters from DOM
            const params = this.getParametersFromDOM();

            // Validate parameters
            this.state.initializeWithParams(params);
            const validation = this.state.validateParameters();

            if (!validation.valid) {
                // --- MODIFICATION: Only show error if not in silent mode ---
                if (!silent) {
                    this.showError('Error: ' + validation.errors.join('\n'));
                }
                return false; // Indicate failure
            }

            // Get algorithm class
            const AlgorithmClass = this.algorithms.get(this.state.algorithm);
            if (!AlgorithmClass) {
                throw new Error(`Algorithm ${this.state.algorithm} not found`);
            }

            // Generate sequence
            this.state.generateSequence(AlgorithmClass);
            this.renderer.resetTrace();
            this.renderer.updateTraceHistory();

            // Update UI
            this.updateAllUI(); // This will now update the serviced queue to its Step 0 state (empty)
            this.updateAlgorithmDescription();
            
            // --- MODIFICATION: Populate the initial queue ---
            this.updateInitialQueue();
            // --- END MODIFICATION ---

            return true; // Indicate success

        } catch (error) {
            // --- THIS IS THE FIX ---
            // Only log and show errors if we are NOT in silent mode
            if (!silent) {
                console.error('Error generating simulation:', error); // Moved here
                this.showError('Error: ' + error.message);
            }
            // --- END OF FIX ---
            return false; // Indicate failure
        }
    }

    /**
     * Get parameters from DOM elements
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
     * Toggle run/pause animation
     * @param {boolean} [forcePlay] - Optional flag to force play
     */
    toggleRunPause(forcePlay = null) {
        if (this.state.isComplete()) {
            this.handleResetAnimation();
            // After resetting, we want to start playing again
            forcePlay = true; 
        }

        // Determine new state
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
     * Start animation loop
     * @private
     */
    startAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }

        const delay = this.state.getAnimationDelay();

        this.animationInterval = setInterval(() => {
            if (!this.state.nextStep()) {
                // --- Animation finished ---
                this.stopAnimation();
                this.state.pause();
                this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Replay</span>';
                this.ui.playPauseBtn.classList.remove('active');
            } else {
                 // Normal step
                this.renderer.updateTraceHistory();
                 this.updateAllUI(); // This will update pending queue and stats
            }
        }, delay);
    }

    /**
     * Stop animation loop
     * @private
     */
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.state.pause(); // Ensure state knows it's paused
    }

    /**
     * Handle step forward button
     */
    handleStepForward() {
        this.stopAnimation();
        this.ui.playPauseBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        if (this.state.nextStep()) {
            this.renderer.updateTraceHistory();
            this.updateAllUI();
        }
    }

    /**
     * Handle step backward button
     */
    handleStepBackward() {
        this.stopAnimation();
        this.ui.playPauseBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        if (this.state.previousStep()) {
            this.renderer.updateTraceHistory(); 
            this.updateAllUI();
        }
    }

    /**
     * Handle reset button (Resets animation to step 0)
     */
    handleResetAnimation() {
        this.stopAnimation();
        this.state.jumpToStep(0); // Go to step 0, don't regenerate
        this.renderer.resetTrace();
        this.renderer.updateTraceHistory();

        this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        // --- MODIFICATION: Call full UI update ---
        // This will now correctly update the "Executed Queue" to be empty (Step 0)
        this.updateAllUI();
        // --- END MODIFICATION ---
    }

    /**
     * Handle algorithm change
     */
    handleAlgorithmChange() {
        this.generateSimulation(true); // Run silently on algo change
    }

    /**
     * Handle speed slider change
     */
    handleSpeedChange(event) {
        const speed = parseInt(event.target.value);
        this.state.setAnimationSpeed(speed);
        if (this.state.isRunning) {
            this.startAnimation();
        }
    }

    /**
     * Handle export to PDF
     */
    async handleExport() {
        const wasRunning = this.state.isRunning;
        if (wasRunning) {
            this.toggleRunPause(false); // Force pause
        }

        await new Promise(resolve => setTimeout(resolve, 50));

        // --- MODIFICATION: Jump to final step for a complete screenshot ---
        const currentStep = this.state.currentStepIndex; // Save current step
        this.state.jumpToStep(this.state.allSteps.length - 1);
        this.renderer.updateTraceHistory();
        this.updateAllUI(); // This updates the serviced queue to its final state
        // --- END MODIFICATION ---

        try {
            const exportData = this.state.getExportData();
            await this.generatePDF(exportData);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showError('Error: ' + error.message);
        }

        // --- MODIFICATION: Jump back to the step you were on ---
        this.state.jumpToStep(currentStep);
        this.renderer.updateTraceHistory();
        this.updateAllUI(); // This updates the serviced queue back to its previous state
        // --- END MODIFICATION ---

        if (wasRunning) {
           this.toggleRunPause(true); // Force play
        }
    }


    /**
     * Generate PDF report
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
     * Update all UI elements
     * @private
     */
    updateAllUI() {
        this.updateStatistics();
        
        // --- MODIFICATION: Added live update for Serviced Queue ---
        this.updateServicedQueue();
        // --- END MODIFICATION ---

        this.updateStepInfo();
        this.updateActionText();
        this.renderer.render();
    }

    /**
     * Update statistics display
     * @private
     */
    updateStatistics() {
        document.getElementById('currentHeadPosition').textContent = this.state.currentHeadPosition;
        document.getElementById('totalHeadMovement').textContent = this.state.totalHeadMovement;
        document.getElementById('seeksCount').textContent = this.state.seeksCount;
        document.getElementById('averageSeekTime').textContent = this.state.averageSeekTime.toFixed(2);
        document.getElementById('nextTargetDisplay').textContent = this.state.nextTarget !== null ? this.state.nextTarget : '-';
    }


    /**
     * --- NEW FUNCTION: To populate the initial queue list ---
     */
    updateInitialQueue() {
        const initialContainer = document.getElementById('initialQueue');
        if (!initialContainer) return;

        if (this.state.requestQueue.length === 0) {
            initialContainer.innerHTML = '<span class="queue-empty">No simulation run</span>';
        } else {
            initialContainer.innerHTML = this.state.requestQueue
                .map(req => `<span class="queue-item">${req}</span>`)
                .join('');
        }
    }

    /**
     * --- MODIFICATION: This function now updates the queue LIVE ---
     */
    updateServicedQueue() {
        const servicedContainer = document.getElementById('servicedQueue');
        if (!servicedContainer) return;

        // Get the serviced queue from the *current* step
        if (this.state.servicedRequests.length === 0) {
            servicedContainer.innerHTML = '<span class="queue-empty">None serviced</span>';
        } else {
            servicedContainer.innerHTML = this.state.servicedRequests
                .map(req => `<span class="queue-item">${req}</span>`)
                .join('');
        }
    }


    /**
     * Update step information
     * @private
     */
    updateStepInfo() {
        document.getElementById('currentStepDisplay').textContent = `Step: ${this.state.getStepInfo()}`;
    }

    /**
     * Update action text
     * @private
     */
    updateActionText() {
        const actionTextEl = document.getElementById('currentActionText');
        if (actionTextEl) {
             const currentStep = this.state.getCurrentStep();
            if (currentStep) {
                actionTextEl.textContent = currentStep.currentAction;
                actionTextEl.style.color = 'var(--color-text-primary)';
                actionTextEl.style.fontWeight = 'var(--font-weight-medium)';
            }
        }
    }

    /**
     * Update algorithm description
     */
    updateAlgorithmDescription() {
        const descEl = document.getElementById('algorithmDescription');
        if (!descEl) return;

        const AlgorithmClass = this.algorithms.get(this.state.algorithm);
        
        // --- MODIFICATION: Get description from static property ---
        let description = "Algorithm Visualizer";
        if (AlgorithmClass && AlgorithmClass.description) {
            description = AlgorithmClass.description;
        } else if (AlgorithmClass) {
            description = this.state.algorithm.toUpperCase() + " Algorithm";
        }
        // --- END MODIFICATION ---
        
        descEl.textContent = description;
    }

    /**
     * --- NEW: Show a non-blocking error ---
     */
    showError(message) {
        console.error(message);
        const errorEl = document.getElementById('currentActionText');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.color = 'red';
            errorEl.style.fontWeight = 'bold';
            errorEl.parentElement.style.display = 'block'; // Make sure it's visible
        } else {
            alert(message); // Fallback
        }
    }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Controller;
}