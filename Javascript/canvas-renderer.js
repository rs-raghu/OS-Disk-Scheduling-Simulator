/* =====================================================
 * JS/CANVAS-RENDERER.JS - VISUALIZATION ENGINE
 * =====================================================
 * MODIFIED: This renderer NO LONGER draws the top disk
 * animation. It only draws the Position vs. Time graph
 * with detailed labels for points and seek distances.
 * ===================================================== */

class CanvasRenderer {
    /**
     * Initializes the CanvasRenderer.
     * @param {string} graphCanvasId - The ID of the graph <canvas> element.
     * @param {StateManager} stateManager - An instance of the StateManager.
     */
    // --- MODIFICATION: Constructor arguments fixed ---
    constructor(graphCanvasId, stateManager) {
        // --- END MODIFICATION ---
        
        // MODIFICATION: Only use graphCanvas. diskCanvas is ignored.
        this.graphCanvas = document.getElementById(graphCanvasId);
        if (!this.graphCanvas) {
            throw new Error(`Canvas with ID ${graphCanvasId} not found.`);
        }
        this.graphCtx = this.graphCanvas.getContext('2d');
        this.state = stateManager;

        // Canvas settings
        this.graphPadding = 60; // Increased padding for labels
        this.colors = {
            background: '#ffffff',
            border: '#000000', // Match theme
            pending: '#007bff', // Blue
            head: '#e74c3c', // Red
            text: '#000000', // Match theme
            gridLine: '#ecf0f1',
            lineLabelBg: 'rgba(255, 255, 255, 0.8)', // BG for seek distance
            lineLabelText: '#e74c3c' // Red for seek distance
        };
        
        // MODIFICATION: Removed all disk-related properties
    }

    /**
     * Clear all canvases.
     * @private
     */
    clearCanvases() {
        // Clear graph canvas
        this.graphCtx.fillStyle = this.colors.background;
        this.graphCtx.fillRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
    }

    /**
     * Main render function. Called by the controller for each step.
     * MODIFICATION: Only renders the graph now.
     */
    render() {
        // Ensure canvas is sized correctly before drawing
        this.handleResize(); 
        
        this.clearCanvases();
        this.renderPositionTimeGraph(); // Renamed
    }

    // --- All disk visualization functions have been REMOVED ---
    // (renderDiskVisualization, drawDiskBar, drawGridLines, drawRequestDots,
    // drawTraceLine, drawHeadPointer, drawAxisLabels, drawLegend, initMouseTracking)


    /**
     * Renders the complete Position vs. Time graph.
     * @private
     */
    renderPositionTimeGraph() {
        const ctx = this.graphCtx;
        
        // Use the full canvas size, adjusted for padding
        const width = this.graphCanvas.width - 2 * this.graphPadding;
        const height = this.graphCanvas.height - 2 * this.graphPadding;
        const x = this.graphPadding;
        const y = this.graphPadding;

        // Ensure dimensions are valid
        if (width <= 0 || height <= 0) return;

        // Draw background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);

        // Draw grid
        this.drawPositionTimeGrid(ctx, x, y, width, height);

        // Draw axes
        this.drawPositionTimeAxes(ctx, x, y, width, height);

        // Draw data line (zigzag pattern going down)
        // This function now also draws the labels
        this.drawPositionTimeDataLine(ctx, x, y, width, height);

        // Draw axis labels
        this.drawPositionTimeLabels(ctx, x, y, width, height);
    }

    /**
     * Draws the grid for the Position vs. Time graph.
     * @private
     */
    drawPositionTimeGrid(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;
        
        // --- MODIFICATION: Draw 10 vertical grid lines ---
        const positionIntervals = 10; 
        for (let i = 0; i <= positionIntervals; i++) {
            const xPos = x + (width / positionIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }

        // --- MODIFICATION: Draw 10 horizontal grid lines ---
        const timeIntervals = 10;
        for (let i = 0; i <= timeIntervals; i++) {
            const yPos = y + (height / timeIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(x, yPos);
            ctx.lineTo(x + width, yPos);
            ctx.stroke();
        }
    }

    /**
     * Draws the X and Y axes for the Position vs. Time graph.
     * @private
     */
    drawPositionTimeAxes(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 3; // Match theme

        // Y-axis (Time)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();

        // X-axis (Position) - AT THE TOP (Time = 0)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();
    }

    /**
     * --- NEW FUNCTION ---
     * Draws a labeled point on the graph.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {string|number} label - The text label to draw.
     * @param {boolean} isHead - If this is the current head position.
     */
    drawGraphPoint(ctx, x, y, label, isHead = false) {
        // Draw dot
        ctx.fillStyle = isHead ? this.colors.head : this.colors.pending;
        ctx.beginPath();
        ctx.arc(x, y, isHead ? 8 : 6, 0, Math.PI * 2); // Make head dot larger
        ctx.fill();

        // Draw outline
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2; // Match theme
        ctx.stroke();

        // Draw label text
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, x, y - 12); // 12px above the dot
    }

    /**
     * --- NEW FUNCTION ---
     * Draws the seek distance label in the middle of a line segment.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {number} x - The midpoint x-coordinate.
     * @param {number} y - The midpoint y-coordinate.
     * @param {string|number} label - The seek distance.
     */
    drawGraphLineLabel(ctx, x, y, label) {
        if (label === 0) return; // Don't label 0-seek moves

        const labelText = `(${label})`;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add a small white background for readability
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = this.colors.lineLabelBg;
        ctx.fillRect(x - textWidth / 2 - 2, y - 8, textWidth + 4, 16);
        
        // Draw text
        ctx.fillStyle = this.colors.lineLabelText; // Use red for the seek distance
        ctx.fillText(labelText, x, y);
    }

    /**
     * MODIFICATION: Rewritten to draw all labels and distances.
     * Draws the data line on the Position vs. Time graph.
     * @private
     */
    drawPositionTimeDataLine(ctx, x, y, width, height) {
        if (this.state.allSteps.length === 0) return;
        
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // --- 1. Draw the trace line ---
        ctx.strokeStyle = this.colors.pending;
        ctx.lineWidth = 2;
        ctx.beginPath();

        let firstStep = this.state.allSteps[0];
        let firstX = x + (firstStep.headPosition / maxTrack) * width;
        let firstY = y; // Time = 0
        ctx.moveTo(firstX, firstY);

        for (let i = 1; i <= this.state.currentStepIndex && i < this.state.allSteps.length; i++) {
            const step = this.state.allSteps[i];
            const xPos = x + (step.headPosition / maxTrack) * width;
            const yPos = y + (i / totalSteps) * height;
            ctx.lineTo(xPos, yPos);
        }
        ctx.stroke();

        // --- 2. Draw dots and labels (so they are on top) ---
        
        // Draw first point (Step 0)
        const isHead = this.state.currentStepIndex === 0;
        this.drawGraphPoint(ctx, firstX, firstY, firstStep.headPosition, isHead);

        // Draw all subsequent points and line labels
        for (let i = 1; i <= this.state.currentStepIndex && i < this.state.allSteps.length; i++) {
            const prevStep = this.state.allSteps[i - 1];
            const step = this.state.allSteps[i];

            const prevX = x + (prevStep.headPosition / maxTrack) * width;
            const prevY = y + ((i - 1) / totalSteps) * height;
            const xPos = x + (step.headPosition / maxTrack) * width;
            const yPos = y + (i / totalSteps) * height;

            // Draw the point (dot + label)
            const isCurrentHead = this.state.currentStepIndex === i;
            this.drawGraphPoint(ctx, xPos, yPos, step.headPosition, isCurrentHead);

            // Draw the line label (seek distance)
            const midX = (prevX + xPos) / 2;
            const midY = (prevY + yPos) / 2;
            this.drawGraphLineLabel(ctx, midX, midY, step.seekDistance);
        }
    }

    /**
     * Draws the labels for the Position vs. Time graph.
     * @private
     */
    drawPositionTimeLabels(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 12px Arial'; // Match theme
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // X-axis label (position - horizontal)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Disk Position', x + width / 2, y + height + this.graphPadding - 10); // Move closer to axis

        // Y-axis label (time - vertical)
        ctx.save();
        ctx.translate(x - this.graphPadding + 20, y + height / 2); // Move closer to axis
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Time (Steps)', 0, 0);
        ctx.restore();

        // --- MODIFICATION: X-axis labels at 10 intervals ---
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = 'bold 10px Arial'; // Match theme
        
        const positionIntervals = 10;
        for (let i = 0; i <= positionIntervals; i++) {
            const xPos = x + (width / positionIntervals) * i;
            const posValue = Math.round((i / positionIntervals) * maxTrack);
            ctx.fillText(posValue, xPos, y - 8); // Position above top axis
        }
        // --- END MODIFICATION ---

        // --- MODIFICATION: Y-axis labels at 10 intervals ---
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        const timeIntervals = 10;
        for (let i = 0; i <= timeIntervals; i++) {
            const yPos = y + (height / timeIntervals) * i; // top-to-bottom
            // Don't draw 0 again if totalSteps is 0
            const stepValue = (totalSteps === 0) ? 0 : Math.round((i / timeIntervals) * totalSteps);
            if (i === 0 && totalSteps === 0) {
                 ctx.fillText('0', x - 8, yPos);
            } else if (i > 0) {
                 ctx.fillText(stepValue, x - 8, yPos);
            }
        }
        // --- END MODIFICATION ---
    }

    /**
     * MODIFICATION: This function is no longer needed
     * but the controller still calls it.
     */
    updateTraceHistory() {
        // No-op. The graph reads directly from state.allSteps.
    }

    /**
     * MODIFICATION: This function is no longer needed
     * but the controller still calls it.
     */
    resetTrace() {
        // No-op.
    }

    /**
     * Handle canvas resize.
     * MODIFICATION: Only resizes graph canvas and now resizes HEIGHT too.
     */
    handleResize() {
        const graphContainer = this.graphCanvas.parentElement;
         if (graphContainer) {
            // Set canvas width and height from container's actual pixel size
            // This makes the canvas fill the 'flex-grow: 1' container
            this.graphCanvas.width = graphContainer.clientWidth;
            this.graphCanvas.height = graphContainer.clientHeight;
        }
        
        // We don't call render() here anymore to prevent an infinite loop,
        // as render() is now responsible for calling handleResize().
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasRenderer;
}