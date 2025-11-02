/* =====================================================
   JS/CONTROLLER.JS - APPLICATION CONTROLLER
   ===================================================== */

class Controller {
    constructor(stateManager, canvasRenderer) {
        this.state = stateManager;
        this.renderer = canvasRenderer;
        this.algorithms = new Map();
        this.animationInterval = null;
        this.isAnimating = false;
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
        this.setupEventListeners();
        this.loadInitialState();
    }

    /**
     * Setup all event listeners
     * @private
     */
    setupEventListeners() {
        // Control buttons
        document.getElementById('runBtn').addEventListener('click', () => this.toggleRunPause());
        document.getElementById('stepForwardBtn').addEventListener('click', () => this.handleStepForward());
        document.getElementById('stepBackwardBtn').addEventListener('click', () => this.handleStepBackward());
        document.getElementById('resetBtn').addEventListener('click', () => this.handleReset());
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());

        // Parameter inputs
        document.getElementById('algorithmSelect').addEventListener('change', () => this.handleAlgorithmChange());
        document.getElementById('speedSlider').addEventListener('input', (e) => this.handleSpeedChange(e));

        // Window resize
        window.addEventListener('resize', () => this.renderer.handleResize());
    }

    /**
     * Load initial state and render
     * @private
     */
    loadInitialState() {
        this.generateSimulation();
    }

    /**
     * Generate simulation with current parameters
     */
    generateSimulation() {
        try {
            // Get parameters from DOM
            const params = this.getParametersFromDOM();

            // Validate parameters
            this.state.initializeWithParams(params);
            const validation = this.state.validateParameters();

            if (!validation.valid) {
                alert('Error: ' + validation.errors.join('\n'));
                return;
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
            this.updateAllUI();
        } catch (error) {
            console.error('Error generating simulation:', error);
            alert('Error: ' + error.message);
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
     */
    toggleRunPause() {
        if (this.state.isComplete()) {
            this.handleReset();
            return;
        }

        const isRunning = this.state.toggleRunning();
        const btn = document.getElementById('runBtn');

        if (isRunning) {
            btn.textContent = '⏸ Pause';
            btn.classList.add('active');
            this.startAnimation();
        } else {
            btn.textContent = '▶ Run';
            btn.classList.remove('active');
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

        this.animationInterval = setInterval(() => {
            if (!this.state.nextStep()) {
                this.stopAnimation();
                document.getElementById('runBtn').textContent = '▶ Run';
                document.getElementById('runBtn').classList.remove('active');
                this.state.pause();
            }

            this.renderer.updateTraceHistory();
            this.updateAllUI();
        }, this.state.getAnimationDelay());
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
    }

    /**
     * Handle step forward button
     */
    handleStepForward() {
        this.stopAnimation();
        this.state.pause();
        document.getElementById('runBtn').textContent = '▶ Run';
        document.getElementById('runBtn').classList.remove('active');

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
        this.state.pause();
        document.getElementById('runBtn').textContent = '▶ Run';
        document.getElementById('runBtn').classList.remove('active');

        if (this.state.previousStep()) {
            this.updateAllUI();
        }
    }

    /**
     * Handle reset button
     */
    handleReset() {
        this.stopAnimation();
        this.state.resetSimulation();
        this.renderer.resetTrace();
        this.renderer.updateTraceHistory();

        document.getElementById('runBtn').textContent = '▶ Run';
        document.getElementById('runBtn').classList.remove('active');

        this.updateAllUI();
    }

    /**
     * Handle algorithm change
     */
    handleAlgorithmChange() {
        this.generateSimulation();
    }

    /**
     * Handle speed slider change
     */
    handleSpeedChange(event) {
        const speed = parseInt(event.target.value);
        this.state.setAnimationSpeed(speed);
    }

    /**
     * Handle export to PDF
     */
    handleExport() {
        try {
            const exportData = this.state.getExportData();
            this.generatePDF(exportData);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error: ' + error.message);
        }
    }

    /**
     * Generate PDF report
     * @private
     */
    generatePDF(exportData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text('Disk Scheduling Report', 20, 20);

        // Add timestamp
        doc.setFontSize(10);
        doc.text(`Generated: ${exportData.timestamp}`, 20, 30);

        // Add parameters section
        doc.setFontSize(14);
        doc.text('Parameters', 20, 45);
        doc.setFontSize(11);
        let yPos = 55;
        doc.text(`Algorithm: ${exportData.algorithm.toUpperCase()}`, 20, yPos);
        yPos += 8;
        doc.text(`Initial Head Position: ${exportData.initialHeadPosition}`, 20, yPos);
        yPos += 8;
        doc.text(`Max Track Number: ${exportData.maxTrackNumber}`, 20, yPos);
        yPos += 8;
        doc.text(`Request Queue: ${exportData.requestQueue.join(', ')}`, 20, yPos);
        yPos += 8;
        doc.text(`Direction: ${exportData.direction}`, 20, yPos);

        // Add statistics section
        yPos += 15;
        doc.setFontSize(14);
        doc.text('Results', 20, yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.text(`Total Head Movement: ${exportData.totalHeadMovement}`, 20, yPos);
        yPos += 8;
        doc.text(`Average Seek Time: ${exportData.averageSeekTime}`, 20, yPos);
        yPos += 8;
        doc.text(`Total Seeks: ${exportData.seeksCount}`, 20, yPos);

        // Add canvases as images
        yPos += 15;
        doc.setFontSize(12);
        doc.text('Visualization', 20, yPos);

        yPos += 10;
        try {
            const diskImage = this.renderer.diskCanvas.toDataURL('image/png');
            doc.addImage(diskImage, 'PNG', 20, yPos, 170, 40);
            yPos += 50;
        } catch (e) {
            console.error('Error adding disk canvas:', e);
        }

        doc.text('Position vs. Time Graph', 20, yPos);
        yPos += 8;
        try {
            const graphImage = this.renderer.graphCanvas.toDataURL('image/png');
            doc.addImage(graphImage, 'PNG', 20, yPos, 170, 80);
            yPos += 90;
        } catch (e) {
            console.error('Error adding graph canvas:', e);
        }

        // Add execution trace on new page
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Execution Trace', 20, 20);

        yPos = 30;
        doc.setFontSize(10);

        // Add steps
        for (let i = 0; i < Math.min(exportData.allSteps.length, 100); i++) {
            const step = exportData.allSteps[i];
            const text = `Step ${step.step}: Head at ${step.headPosition}, Movement: ${step.totalHeadMovement}, Serviced: ${step.servicedQueue.length}`;

            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }

            doc.text(text, 20, yPos);
            yPos += 6;
        }

        // Save PDF
        doc.save(`disk-scheduling-${exportData.algorithm}.pdf`);
    }

    /**
     * Update all UI elements
     * @private
     */
    updateAllUI() {
        this.updateStatistics();
        this.updateQueues();
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
    }

    /**
     * Update queue displays
     * @private
     */
    updateQueues() {
        // Pending queue
        const pendingContainer = document.getElementById('pendingQueue');
        if (this.state.pendingRequests.length === 0) {
            pendingContainer.innerHTML = '<span class="queue-empty">All serviced!</span>';
        } else {
            pendingContainer.innerHTML = this.state.pendingRequests
                .map(req => `<span class="queue-item">${req}</span>`)
                .join('');
        }

        // Serviced queue
        const servicedContainer = document.getElementById('servicedQueue');
        if (this.state.servicedRequests.length === 0) {
            servicedContainer.innerHTML = '<span class="queue-empty">None yet</span>';
        } else {
            servicedContainer.innerHTML = this.state.servicedRequests
                .map(req => `<span class="queue-item serviced">${req}</span>`)
                .join('');
        }

        // Next target
        const nextTargetDisplay = document.getElementById('nextTargetDisplay');
        nextTargetDisplay.textContent = this.state.nextTarget !== null ? this.state.nextTarget : '-';
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
        const currentStep = this.state.getCurrentStep();
        document.getElementById('currentActionText').textContent = currentStep.currentAction;
    }

    /**
     * Update algorithm description
     */
    updateAlgorithmDescription() {
        const AlgorithmClass = this.algorithms.get(this.state.algorithm);
        if (AlgorithmClass) {
            const instance = new AlgorithmClass(0, 100, [1, 2, 3]);
            document.getElementById('algorithmDescription').textContent = instance.getDescription();
        }
    }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Controller;
}