/* =====================================================
 * JS/CANVAS-RENDERER.JS - VISUALIZATION ENGINE
 * -----------------------------------------------------
 * This class is responsible for all drawing operations
 * on both the disk and graph canvases. It reads data
 * from the StateManager and renders the visual
 * representation of the current simulation step.
 *
 * It is designed to be "stateless" in the sense that
 * it just draws the state given to it. The controller
s * `requestAnimationFrame` loop provides the timing for
 * smooth step-based transitions.
 * ===================================================== */

class CanvasRenderer {
    /**
     * Creates a new CanvasRenderer.
     * @param {string} diskCanvasId - The ID of the disk <canvas> element.
     * @param {string} graphCanvasId - The ID of the graph <canvas> element.
     * @param {StateManager} stateManager - The application's state manager.
     */
    constructor(diskCanvasId, graphCanvasId, stateManager) {
        this.diskCanvas = document.getElementById(diskCanvasId);
        this.graphCanvas = document.getElementById(graphCanvasId);
        this.diskCtx = this.diskCanvas.getContext('2d');
        this.graphCtx = this.graphCanvas.getContext('2d');
        this.state = stateManager;

        this.tooltipElement = document.getElementById('disk-tooltip');

        // --- Canvas Drawing Settings ---
        this.diskPadding = 60;  // Pixels on left/right of disk bar
        this.diskHeight = 120; // Height of the disk bar
        this.graphPadding = 50; // Padding for the graph axes
        this.dotRadius = 6;     // Radius of request dots
        
        /**
         * Color palette for all canvas elements.
         * Meets the "Color-coded visual elements" requirement.
         * @type {object}
         */
        this.colors = {
            background: '#ffffff', // Canvas background
            disk: '#f0f0f0',       // Disk bar background
            border: '#333333',     // Borders and main axes
            pending: '#3498db',    // Blue for pending requests
            serviced: '#2ecc71',   // Green for serviced requests
            head: '#e74c3c',       // Red for the disk head
            trace: 'rgba(46, 204, 113, 0.6)', // Faded green for trace
            text: '#2c3e50',       // Dark text for labels
            gridLine: '#ecf0f1'    // Light grey for gridlines
        };

        /**
         * Stores the head positions up to the current step.
         * Used to draw the trace line on the disk and graph.
         * @type {Array<number>}
         */
        this.traceHistory = [];
        
        /**
         * Stores the calculated bounding box of the disk bar
         * for accurate mouse-over/tooltip calculations.
         * @type {object}
         */
        this.diskRect = { x: 0, y: 0, width: 0, height: 0 };
        
        // Initialize mouse tracking for the tooltip
        this.initMouseTracking();
    }
    
    /**
     * Clears both canvases to the background color.
     * @private
     */
    clearCanvases() {
        // Clear disk canvas
        this.diskCtx.fillStyle = this.colors.background;
        this.diskCtx.fillRect(0, 0, this.diskCanvas.width, this.diskCanvas.height);

        // Clear graph canvas
        this.graphCtx.fillStyle = this.colors.background;
        this.graphCtx.fillRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
    }

    /**
     * Main render function. Called by the controller for each step.
     */
    render() {
        this.clearCanvases();
        this.renderDiskVisualization();
        this.renderPositionTimeGraph(); // Renamed from renderPositionGraph
    }

    /**
     * Renders the complete disk visualization (bar, head, dots, etc.).
     * @private
     */
    renderDiskVisualization() {
        const ctx = this.diskCtx;
        const width = this.diskCanvas.width - 2 * this.diskPadding;
        const height = this.diskHeight;
        const x = this.diskPadding;
        const y = 14; // Top padding for the head pointer
        
        // Store disk rect for mouse tracking
        this.diskRect = { x, y, width, height };

        // 1. Draw the base elements
        this.drawDiskBar(ctx, x, y, width, height);
        this.drawGridLines(ctx, x, y, width, height);

        // 2. Draw the data
        this.drawRequestDots(ctx, x, y, width, height);
        this.drawTraceLine(ctx, x, y, width, height); // Re-enabled
        this.drawHeadPointer(ctx, x, y, width, height);

        // 3. Draw labels and legend
        this.drawAxisLabels(ctx, x, y, width, height);
        this.drawLegend(ctx); // Re-enabled
    }

    /**
     * Draws the main disk bar background and border.
     * @private
     */
    drawDiskBar(ctx, x, y, width, height) {
        // Disk background
        ctx.fillStyle = this.colors.disk;
        ctx.fillRect(x, y, width, height);

        // Disk border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    /**
     * Draws the light grey grid lines over the disk bar.
     * @private
     */
    drawGridLines(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;

        const intervals = 10; // 10 grid sections
        for (let i = 0; i <= intervals; i++) {
            const xPos = x + (width / intervals) * i;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }
    }

    /**
     * Draws the color-coded dots for pending and serviced requests.
     * @private
     */
    drawRequestDots(ctx, x, y, width, height) {
        const cy = y + height / 2; // Center-Y of the disk bar
        const dotRadius = this.dotRadius;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // --- Draw pending requests (blue) ---
        this.state.pendingRequests.forEach(pos => {
            const cx = x + (pos / maxTrack) * width;
            ctx.fillStyle = this.colors.pending;
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw border
            ctx.strokeStyle = this.colors.border;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // --- Draw serviced requests (green) ---
        this.state.servicedRequests.forEach(pos => {
            const cx = x + (pos / maxTrack) * width;
            ctx.fillStyle = this.colors.serviced;
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Draws the dashed trace line showing the head's path.
     * @private
     */
    drawTraceLine(ctx, x, y, width, height) {
        if (this.traceHistory.length < 2) return;

        ctx.strokeStyle = this.colors.trace;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();

        const cy = y + height / 2;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // Start from the first position in history
        let xPos = x + (this.traceHistory[0] / maxTrack) * width;
        ctx.moveTo(xPos, cy);

        // Draw a zigzag line through all subsequent positions
        for (let i = 1; i < this.traceHistory.length; i++) {
            xPos = x + (this.traceHistory[i] / maxTrack) * width;
            // Create a small "up-down" zig to make the path clearer
            ctx.lineTo(xPos, cy - (i % 2 === 0 ? 10 : -10));
            ctx.lineTo(xPos, cy);
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
    }

    /**
     * Draws the red disk head (line and circle).
     * @private
     */
    drawHeadPointer(ctx, x, y, width, height) {
        const cy = y + height / 2;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;
        const cx = x + (this.state.currentHeadPosition / maxTrack) * width;

        // Draw connection line
        ctx.strokeStyle = this.colors.head;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, y - 15); // Start above the bar
        ctx.lineTo(cx, y + height + 15); // End below the bar
        ctx.stroke();

        // Draw head circle on the bar
        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2); // Larger circle for the head
        ctx.fill();
    }

    /**
     * Draws the '0' and 'Max' labels for the disk bar.
     * @private
     */
    drawAxisLabels(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        // 0 Label
        ctx.fillText('0', x, y + height + 25);
        // Max Track Label
        ctx.fillText(this.state.maxTrackNumber, x + width, y + height + 25);

        // Y-axis (Disk Head Position)
        ctx.save();
        ctx.translate(this.diskPadding / 2 - 10, y + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Disk Position', 0, 0);
        ctx.restore();
    }

    /**
     * Draws the legend below the disk bar.
     * @private
     */
    drawLegend(ctx) {
        const legendY = this.diskCanvas.height - 20;
        const legendX = this.diskPadding;
        const itemSpacing = 120; // Spacing between items

        ctx.font = '12px Arial';
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';

        let currentX = legendX;

        // 1. Pending
        ctx.fillStyle = this.colors.pending;
        ctx.beginPath();
        ctx.arc(currentX, legendY, this.dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Pending', currentX + 12, legendY + 4);
        currentX += itemSpacing;

        // 2. Serviced
        ctx.fillStyle = this.colors.serviced;
        ctx.beginPath();
        ctx.arc(currentX, legendY, this.dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Serviced', currentX + 12, legendY + 4);
        currentX += itemSpacing;

        // 3. Head
        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.arc(currentX, legendY, this.dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Head', currentX + 12, legendY + 4);
    }


    /**
     * Renders the Position vs. Time graph.
     * X-axis = Position, Y-axis = Time (steps).
     * @private
     */
    renderPositionTimeGraph() {
        const ctx = this.graphCtx;
        const width = this.graphCanvas.width - 2 * this.graphPadding;
        const height = this.graphCanvas.height - 2 * this.graphPadding;
        const x = this.graphPadding;
        const y = this.graphPadding;

        // Draw grid, axes, and labels
        this.drawPositionTimeGrid(ctx, x, y, width, height);
        this.drawPositionTimeAxes(ctx, x, y, width, height);
        this.drawPositionTimeLabels(ctx, x, y, width, height);
        
        // Draw the data line
        this.drawPositionTimeDataLine(ctx, x, y, width, height);
    }

    /**
     * Draws the grid for the Position vs. Time graph.
     * @private
     */
    drawPositionTimeGrid(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;

        // Vertical grid lines (for position)
        const positionIntervals = 5;
        for (let i = 0; i <= positionIntervals; i++) {
            const xPos = x + (width / positionIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }

        // Horizontal grid lines (for time)
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        const timeIntervals = Math.min(totalSteps, 10);
        if (timeIntervals > 0) {
            for (let i = 0; i <= timeIntervals; i++) {
                const yPos = y + (height / timeIntervals) * i;
                ctx.beginPath();
                ctx.moveTo(x, yPos);
                ctx.lineTo(x + width, yPos);
                ctx.stroke();
            }
        }
    }

    /**
     * Draws the X and Y axes for the Position vs. Time graph.
     * @private
     */
    drawPositionTimeAxes(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;

        // Y-axis (Time)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();

        // X-axis (Position)
        ctx.beginPath();
        ctx.moveTo(x, y + height); // Positioned at the bottom
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    }

    /**
     * Draws the data line on the Position vs. Time graph.
     * @private
     */
    drawPositionTimeDataLine(ctx, x, y, width, height) {
        if (this.traceHistory.length === 0) return;

        ctx.strokeStyle = this.colors.pending;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // Plot each step
        for (let i = 0; i < this.traceHistory.length; i++) {
            const headPosition = this.traceHistory[i];
            
            // X-axis: Position
            const xPos = x + (headPosition / maxTrack) * width;
            
            // Y-axis: Time (step)
            const yPos = y + (i / totalSteps) * height;

            if (i === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }
        ctx.stroke();

        // Draw current point
        const currentStep = this.state.getCurrentStep();
        const currentX = x + (currentStep.headPosition / maxTrack) * width;
        const currentY = y + (this.state.currentStepIndex / totalSteps) * height; 

        ctx.fillStyle = this.colors.head; // Red
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.colors.background; // White outline
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Draws the labels for the Position vs. Time graph.
     * @private
     */
    drawPositionTimeLabels(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // X-axis label ("Disk Position")
        ctx.textAlign = 'center';
        ctx.fillText('Disk Position', x + width / 2, y + height + 40);

        // Y-axis label ("Time (Steps)")
        ctx.save();
        ctx.translate(x - 40, y + height / 2); 
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Time (Steps)', 0, 0);
        ctx.restore();

        // X-axis numeric labels
        ctx.textAlign = 'center';
        ctx.font = '10px Arial';
        ctx.fillText('0', x, y + height + 20);
        ctx.fillText(this.state.maxTrackNumber, x + width, y + height + 20);

        // Y-axis numeric labels
        ctx.textAlign = 'right';
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        ctx.fillText('0', x - 8, y + 3); // Time 0
        ctx.fillText(totalSteps, x - 8, y + height + 3); // Max Time
    }

    /**
     * Updates the trace history array based on the current step.
     */
    updateTraceHistory() {
        this.traceHistory = [];
        // Rebuild history up to the current step
        for (let i = 0; i <= this.state.currentStepIndex; i++) {
            if (this.state.allSteps[i]) {
                this.traceHistory.push(this.state.allSteps[i].headPosition);
            }
        }
    }

    /**
     * Resets the trace history to only the initial position.
     */
    resetTrace() {
        this.traceHistory = [this.state.initialHeadPosition];
    }

    /**
     * Handles window resize events by resizing canvases and re-rendering.
     */
    handleResize() {
        const diskContainer = this.diskCanvas.parentElement;
        if (diskContainer) {
            this.diskCanvas.width = diskContainer.clientWidth;
        }
        
        const graphContainer = this.graphCanvas.parentElement;
         if (graphContainer) {
            this.graphCanvas.width = graphContainer.clientWidth;
        }
        
        // Re-render after resize
        this.render();
    }
    
    /**
     * Initializes mouse tracking on the disk canvas for the tooltip.
     * @private
     */
    initMouseTracking() {
        if (!this.tooltipElement) return;

        this.diskCanvas.addEventListener('mousemove', (e) => {
            const rect = this.diskCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const { x, y, width, height } = this.diskRect;
            const cy = y + height / 2;
            const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

            let foundDot = null;
            let dotType = 'pending';

            // Check pending requests
            for (const pos of this.state.pendingRequests) {
                const cx = x + (pos / maxTrack) * width;
                const dist = Math.sqrt(Math.pow(mouseX - cx, 2) + Math.pow(mouseY - cy, 2));
                if (dist <= this.dotRadius + 2) { // Add a small buffer
                    foundDot = pos;
                    dotType = 'Pending';
                    break;
                }
            }

            // Check serviced requests if not found yet
            if (foundDot === null) {
                for (const pos of this.state.servicedRequests) {
                    const cx = x + (pos / maxTrack) * width;
                    const dist = Math.sqrt(Math.pow(mouseX - cx, 2) + Math.pow(mouseY - cy, 2));
                    if (dist <= this.dotRadius + 2) {
                        foundDot = pos;
                        dotType = 'Serviced';
                        break;
                    }
                }
            }
            
            if (foundDot !== null) {
                this.tooltipElement.innerHTML = `Track: <strong>${foundDot}</strong> (${dotType})`;
                this.tooltipElement.style.left = `${e.pageX + 10}px`; // Position near mouse
                this.tooltipElement.style.top = `${e.pageY - 28}px`; // Position near mouse
                this.tooltipElement.style.display = 'block';
            } else {
                this.tooltipElement.style.display = 'none';
            }
        });

        this.diskCanvas.addEventListener('mouseout', () => {
            this.tooltipElement.style.display = 'none';
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasRenderer; // Corrected typo
}