/* =====================================================
 * JS/CONTROLLER.JS - APPLICATION CONTROLLER
 * =====================================================
 * This file acts as the "glue" between the user interface
 * (view) and the application's data (model). It handles
 * all user interactions from the simulation panel, manages
 * the animation loop, and calls the appropriate functions
 * in the state manager and renderer.
 * ===================================================== */

class Controller {
    /**
     * Initializes the Controller.
     * @param {StateManager} stateManager - An instance of the StateManager.
     * @param {CanvasRenderer} canvasRenderer - An instance of the CanvasRenderer.
     * @param {function} showSimulationView - Function to show the simulation panel.
     * @param {function} showConfigView - Function to show the configuration panel.
     */
    constructor(stateManager, canvasRenderer, showSimulationView, showConfigView) {
        this.state = stateManager;
        this.renderer = canvasRenderer;
        this.algorithms = new Map();
        this.animationInterval = null;
        
        // UI View-Switching Functions (passed from main.js)
        this.showSimulationView = showSimulationView;
        this.showConfigView = showConfigView;

        // Button Element Cache for performance
        this.ui = {};
    }

    /**
     * Stores an algorithm class in the algorithms Map.
     * @param {string} name - The shorthand name of the algorithm (e.g., "fcfs").
     * @param {class} AlgorithmClass - The class constructor for the algorithm.
     */
    registerAlgorithm(name, AlgorithmClass) {
        this.algorithms.set(name, AlgorithmClass);
    }

    /**
     * Caches UI elements and sets up all event listeners.
     */
    init() {
        // Cache all UI elements from the simulation panel
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
     * Attaches click/input listeners to all cached UI elements.
     * @private
     */
    setupEventListeners() {
        this.ui.playPauseBtn.addEventListener('click', () => this.toggleRunPause());
        this.ui.stepForwardBtn.addEventListener('click', () => this.handleStepForward());
        this.ui.stepBackwardBtn.addEventListener('click', () => this.handleStepBackward());
        this.ui.resetBtn.addEventListener('click', () => this.handleResetAnimation());
        this.ui.exportBtn.addEventListener('click', () => this.handleExport());
        this.ui.speedSlider.addEventListener('input', (e) => this.handleSpeedChange(e));
    }

    /**
     * Called by main.js when the "Run Simulation" button is clicked.
     * Validates input and switches to the simulation view.
     */
    handleRunSimulation() {
        const success = this.generateSimulation();
        if (success) {
            // Only switch views if generation was successful
            this.showSimulationView();
            // Start the animation immediately
            this.toggleRunPause(true); // Force play
        }
    }

    /**
     * Called by main.js when "Reset Algorithm" is clicked.
     * Stops animation, clears all data, and switches to config view.
     */
    handleFullReset() {
        this.stopAnimation();
        
        // Re-initialize state from the DOM
        this.state.initializeWithParams(this.getParametersFromDOM());
        
        this.updateAllUI(); 
        
        this.renderer.render(); 
        
        // Manually clear the persistent queues
        const initialContainer = document.getElementById('initialQueue');
        const servicedContainer = document.getElementById('servicedQueue');
        if (initialContainer) {
            initialContainer.innerHTML = '<span class="queue-empty">No simulation run</span>';
        }
        if (servicedContainer) {
            servicedContainer.innerHTML = '<span class="queue-empty">No services yet</span>';
        }
        
        this.showConfigView(); // Switch back to config panel
    }


    /**
     * Generates the full animation sequence based on DOM inputs.
     * @returns {boolean} True if simulation was generated, false if validation failed.
     */
    generateSimulation() {
        try {
            this.stopAnimation(); // Stop any running animation

            // 1. Get parameters from DOM
            const params = this.getParametersFromDOM();

            // 2. Validate parameters
            this.state.initializeWithParams(params);
            const validation = this.state.validateParameters();

            if (!validation.valid) {
                this.showError('Error: ' + validation.errors.join('\n'));
                return false; // Indicate failure
            }

            // 3. Get algorithm class
            const AlgorithmClass = this.algorithms.get(this.state.algorithm);
            if (!AlgorithmClass) {
                throw new Error(`Algorithm ${this.state.algorithm} not found`);
            }

            // 4. Generate sequence
            this.state.generateSequence(AlgorithmClass);
            
            // 5. Update UI
            this.updateAllUI(); 
            this.updateAlgorithmDescription();
            this.updateInitialQueue(); // Populate the initial queue box

            return true; // Indicate success

        } catch (error) {
            this.showError('Error: ' + error.message);
            return false; // Indicate failure
        }
    }

    /**
     * Reads all input values from the DOM.
     * @private
     * @returns {object} An object containing all configuration parameters.
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
     * Toggles the animation between play and pause states.
     * @param {boolean} [forcePlay] - Optional flag to force play (e.g., on "Run").
     */
    toggleRunPause(forcePlay = null) {
        // If simulation is done, "Play" button acts as "Replay"
        if (this.state.isComplete()) {
            this.handleResetAnimation();
            forcePlay = true; // Start playing immediately after reset
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
     * Starts the `setInterval` animation loop.
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
                 this.updateAllUI(); // Update stats, queues, and render canvas
            }
        }, delay);
    }

    /**
     * Clears the `setInterval` animation loop.
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
     * Handles the "Step Forward" button click.
     */
    handleStepForward() {
        this.stopAnimation();
        this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        if (this.state.nextStep()) {
            this.updateAllUI();
        }
    }

    /**
     * Handles the "Step Back" button click.
     */
    handleStepBackward() {
        this.stopAnimation();
        this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        if (this.state.previousStep()) {
            this.updateAllUI();
        }
    }

    /**
     * Handles the "Reset Anim" button click. Resets animation to Step 0.
     */
    handleResetAnimation() {
        this.stopAnimation();
        this.state.jumpToStep(0); // Go to step 0
        
        this.ui.playPauseBtn.innerHTML = '<span class="btn-text">Play</span>';
        this.ui.playPauseBtn.classList.remove('active');

        this.updateAllUI(); // Update UI to show Step 0 state
    }

    /**
     * Handles the "Algorithm" select change.
     */
    handleAlgorithmChange() {
        this.generateSimulation();
    }

    /**
     * Handles the "Animation Speed" slider change.
     * @param {Event} event - The input event from the slider.
     */
    handleSpeedChange(event) {
        const speed = parseInt(event.target.value);
        this.state.setAnimationSpeed(speed);
        
        // If currently animating, restart interval with new speed
        if (this.state.isRunning) {
            this.startAnimation();
        }
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
        
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait for UI to pause

        // Save current step to return to it later
        const currentStep = this.state.currentStepIndex; 
        
        // Jump to final step for a complete screenshot
        this.state.jumpToStep(this.state.allSteps.length - 1);
        this.updateAllUI(); 

        try {
            const exportData = this.state.getExportData();
            await this.generatePDF(exportData); // Generate the PDF
        } catch (error) {
            this.showError('Error: ' + error.message);
        }

        // Jump back to the step the user was on
        this.state.jumpToStep(currentStep);
        this.updateAllUI(); 

        // Resume animation if it was running
        if (wasRunning) {
           this.toggleRunPause(true); // Force play
        }
    }


    /**
     * Generates a styled PDF report of the simulation.
     * @private
     * @param {object} exportData - Data object from stateManager.getExportData().
     */
    async generatePDF(exportData) {
        const { jsPDF } = window.jspdf;
        
        // Use A4 portrait, units in 'pt' for better control
        const doc = new jsPDF('p', 'pt', 'a4');
        const margin = 40;
        let pageWidth = doc.internal.pageSize.getWidth();
        let contentWidth = pageWidth - margin * 2;
        let yPos = 0; // Start at 0 to draw the header

        const themeBlack = '#000000';
        const themeYellow = '#fbca1f';
        const themeGray = '#f8f9fa';

        // --- 1. Title Bar ---
        doc.setFillColor(themeYellow);
        doc.setDrawColor(themeBlack);
        doc.setLineWidth(3);
        doc.rect(0, 0, pageWidth, 75, 'FD'); // Fill and draw rectangle

        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(themeBlack);
        doc.text('Disk Scheduling Report', pageWidth / 2, 45, { align: 'center' });
        
        yPos = 100; // Start content below header

        // --- 2. Parameters & Results (Side-by-side) ---
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Parameters', margin, yPos);
        doc.text('Results', pageWidth / 2 + 10, yPos);
        
        doc.setLineWidth(1.5);
        doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8); // Underline
        yPos += 30;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');

        // Parameters Column
        const paramX = margin;
        const resultX = pageWidth / 2 + 10;
        
        doc.text(`Algorithm: ${exportData.algorithm.toUpperCase()}`, paramX, yPos);
        doc.text(`Initial Head: ${exportData.initialHeadPosition}`, paramX, yPos + 20);
        doc.text(`Max Track: ${exportData.maxTrackNumber}`, paramX, yPos + 40);
        if (exportData.direction) {
             doc.text(`Direction: ${exportData.direction}`, paramX, yPos + 60);
        }
        
        // Results Column
        doc.setFont(undefined, 'bold');
        doc.text('Total Head Movement:', resultX, yPos);
        doc.text(exportData.totalHeadMovement.toString(), resultX + 130, yPos);
        
        doc.setFont(undefined, 'normal');
        doc.text('Total Seeks:', resultX, yPos + 20);
        doc.text(exportData.seeksCount.toString(), resultX + 130, yPos + 20);
        
        doc.text('Average Seek Time:', resultX, yPos + 40);
        doc.text(exportData.averageSeekTime.toString(), resultX + 130, yPos + 40);

        yPos += 80;

        // --- 3. Request Queue ---
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Initial Request Queue', margin, yPos);
        doc.setLineWidth(1.5);
        doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8); // Underline
        yPos += 30;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80);
        const queueText = doc.splitTextToSize(exportData.requestQueue.join(', '), contentWidth);
        doc.text(queueText, margin, yPos);
        yPos += (queueText.length * 12) + 20;

        
        // --- 4. Visuals (Canvas Images) ---
        // --- START OF FIX ---
        doc.addPage('landscape'); // Add a new page in landscape mode
        const landscapePageWidth = doc.internal.pageSize.getWidth();
        const landscapePageHeight = doc.internal.pageSize.getHeight();
        
        try {
            const graphCanvas = document.getElementById('graphCanvas');
            // Capture the canvas
            const graphImg = await html2canvas(graphCanvas, { scale: 2 });
            const graphImgData = graphImg.toDataURL('image/png');
            
            // Calculate the image's original aspect ratio
            const graphRatio = graphImg.height / graphImg.width;

            // 1. Calculate dimensions to fit page width
            let imgWidth = landscapePageWidth;
            let imgHeight = imgWidth * graphRatio;

            // 2. Check if this height is taller than the page
            if (imgHeight > landscapePageHeight) {
                // If so, recalculate dimensions to fit page height
                imgHeight = landscapePageHeight;
                imgWidth = imgHeight / graphRatio;
            }

            // 3. Calculate offsets to center the image
            const xOffset = (landscapePageWidth - imgWidth) / 2;
            const yOffset = (landscapePageHeight - imgHeight) / 2;
            
            // Add the image, centered, and scaled to fill the page
            doc.addImage(graphImgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

        } catch (e) {
            doc.setTextColor(255, 0, 0);
            // Add error text in the middle of the blank page
            doc.text('Error rendering canvas images.', landscapePageWidth / 2, landscapePageHeight / 2, { align: 'center' });
        }
        // --- END OF FIX ---


        // --- 5. Execution Trace (New Page) ---
        doc.addPage('portrait'); // Add a new page *back* in portrait mode
        pageWidth = doc.internal.pageSize.getWidth(); // Get portrait width again
        contentWidth = pageWidth - margin * 2; // Get portrait content width
        yPos = margin;
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text('Execution Trace', margin, yPos);
        doc.setLineWidth(1.5);
        doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8); // Underline
        yPos += 30;

        // Prepare data for the table
        const tableHead = [['Step', 'Head Position', 'Seek Distance', 'Total Movement', 'Serviced']];
        const tableBody = exportData.allSteps.map(step => [
            step.step,
            step.headPosition,
            step.seekDistance,
            step.totalHeadMovement,
            // Show the request that was *just* serviced on this step
            step.servicedQueue.length > 0 ? step.servicedQueue[step.servicedQueue.length - 1] : '-'
        ]);
        
        // Fix for Step 0, which has no serviced item
        tableBody[0][4] = '-'; 

        // Use autoTable plugin to draw the table
        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: yPos,
            theme: 'grid', // 'striped', 'grid', or 'plain'
            headStyles: {
                fillColor: themeBlack,
                textColor: themeYellow,
                fontStyle: 'bold',
                lineWidth: 2,
                lineColor: themeBlack
            },
            styles: {
                font: 'Inter', // Match your app font
                fontSize: 10,
                cellPadding: 6,
                borderColor: themeBlack,
                lineWidth: 1
            },
            alternateRowStyles: {
                fillColor: themeGray
            }
        });

        // --- Save PDF ---
        doc.save(`disk-scheduling-${exportData.algorithm}.pdf`);
    }

    /**
     * Updates all UI components that change during animation.
     * @private
     */
    updateAllUI() {
        this.updateStatistics();
        this.updateServicedQueue(); // Live-updates the serviced queue
        this.updateStepInfo();
        this.renderer.render();
    }

    /**
     * Updates the "Live Statistics" card.
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
     * Populates the "Initial Request Queue" box one time.
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
     * Updates the "Executed Queue" box live during animation.
     */
    updateServicedQueue() {
        const servicedContainer = document.getElementById('servicedQueue');
        if (!servicedContainer) return;

        // Get the serviced queue from the *current* step
        if (this.state.servicedRequests.length === 0) {
            servicedContainer.innerHTML = '<span class="queue-empty">None serviced</span>';
        } else {
            servicedContainer.innerHTML = this.state.servicedRequests
                .map(req => `<span class.nama="queue-item">${req}</span>`)
                .join('');
        }
    }


    /**
     * Updates the "Step: X / Y" text.
     * @private
     */
    updateStepInfo() {
        document.getElementById('currentStepDisplay').textContent = `Step: ${this.state.getStepInfo()}`;
    }

    /**
     * Updates the algorithm description text in the sidebar.
     */
    updateAlgorithmDescription() {
        const descEl = document.getElementById('algorithmDescription');
        if (!descEl) return;

        const AlgorithmClass = this.algorithms.get(this.state.algorithm);
        
        let description = "Algorithm Visualizer";
        if (AlgorithmClass && AlgorithmClass.description) {
            description = AlgorithmClass.description;
        } else if (AlgorithmClass) {
            description = this.state.algorithm.toUpperCase() + " Algorithm";
        }
        
        descEl.textContent = description;
    }

    /**
     * Shows a non-blocking error message to the user.
     * @param {string} message - The error message to display.
     */
    showError(message) {
        const errorEl = document.getElementById('configError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block'; // Make it visible
        } else {
            alert(message); // Fallback
        }
    }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Controller;
}