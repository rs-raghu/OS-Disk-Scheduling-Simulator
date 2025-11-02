/* =====================================================
 * JS/CANVAS-RENDERER.JS - VISUALIZATION ENGINE
 * ===================================================== */

class CanvasRenderer {
    constructor(diskCanvasId, graphCanvasId, stateManager) {
        this.diskCanvas = document.getElementById(diskCanvasId);
        this.graphCanvas = document.getElementById(graphCanvasId);
        this.diskCtx = this.diskCanvas.getContext('2d');
        this.graphCtx = this.graphCanvas.getContext('2d');
        this.state = stateManager;

        // --- Get HTML element for head tracker ---
        this.headTrackerElement = document.getElementById('headPositionTracker');

        // Canvas settings
        this.diskPadding = 60;
        this.diskHeight = 120;
        this.graphPadding = 50;
        this.colors = {
            background: '#ffffff',
            disk: '#f0f0f0',
            border: '#333333',
            pending: '#3498db',
            serviced: '#2ecc71',
            head: '#e74c3c',
            trace: '#2ecc71',
            text: '#2c3e50',
            gridLine: '#ecf0f1'
        };

        // Trace history for line drawing
        this.traceHistory = [];
    }

    /**
     * Clear all canvases
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
     * Render everything
     */
    render() {
        this.clearCanvases();
        this.renderDiskVisualization();
        this.renderPositionGraph();

        // --- Update the HTML Head Position Tracker ---
        this.updateHeadTrackerPosition();
    }

    /**
     * --- NEW FUNCTION ---
     * Update the position of the HTML-based head tracker
     * to match the canvas-drawn head.
     */
    updateHeadTrackerPosition() {
        if (!this.headTrackerElement) return;

        // Get all necessary values for calculation
        const headPos = this.state.currentHeadPosition;
        const maxTrack = this.state.maxTrackNumber;
        const padding = this.diskPadding;
        const canvasWidth = this.diskCanvas.width;
        
        // Calculate the width of the drawable disk area
        const drawableWidth = canvasWidth - 2 * padding;

        // Calculate the head's relative position (0.0 to 1.0)
        const headPercent = maxTrack > 0 ? (headPos / maxTrack) : 0;

        // Calculate the pixel offset within the drawable area
        const pixelOffset = headPercent * drawableWidth;

        // The final 'left' position is the canvas padding + the pixel offset
        const finalPixelPosition = padding + pixelOffset;

        // Set the 'left' style.
        this.headTrackerElement.style.left = `${finalPixelPosition}px`;
    }


    /**
     * Render disk scheduling visualization
     * @private
     */
    renderDiskVisualization() {
        const ctx = this.diskCtx;
        // Calculate drawable width
        const width = this.diskCanvas.width - 2 * this.diskPadding;
        const height = this.diskHeight;
        const x = this.diskPadding;
        const y = 30; // Top padding for the head pointer

        // Draw disk bar
        this.drawDiskBar(ctx, x, y, width, height);

        // Draw grid lines
        this.drawGridLines(ctx, x, y, width, height);

        // Draw request dots
        this.drawRequestDots(ctx, x, y, width, height);

        // --- MODIFICATION: Trace line drawing removed ---
        // this.drawTraceLine(ctx, x, y, width, height);
        // --- END MODIFICATION ---

        // Draw head pointer
        this.drawHeadPointer(ctx, x, y, width, height);

        // Draw axis labels
        this.drawAxisLabels(ctx, x, y, width, height);

        // --- MODIFICATION: Legend drawing removed ---
        // this.drawLegend(ctx);
        // --- END MODIFICATION ---
    }

    /**
     * Draw the disk representation
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
     * Draw grid lines on disk
     * @private
     */
    drawGridLines(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;

        const intervals = 10;
        for (let i = 0; i <= intervals; i++) {
            const xPos = x + (width / intervals) * i;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }
    }

    /**
     * Draw pending and serviced request dots
     * @private
     */
    drawRequestDots(ctx, x, y, width, height) {
        const cy = y + height / 2;
        const dotRadius = 6;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // Draw pending requests
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

        // Draw serviced requests
        this.state.servicedRequests.forEach(pos => {
            const cx = x + (pos / maxTrack) * width;
            ctx.fillStyle = this.colors.serviced;
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw checkmark
            ctx.strokeStyle = this.colors.background;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 2, cy);
            ctx.lineTo(cx - 1, cy + 2);
            ctx.lineTo(cx + 3, cy - 2);
            ctx.stroke();
        });
    }

    /**
     * Draw trace line showing head movement (This function is no longer called)
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


        // Start from first position
        let xPos = x + (this.traceHistory[0] / maxTrack) * width;
        ctx.moveTo(xPos, cy);

        // Draw line through all positions
        for (let i = 1; i < this.traceHistory.length; i++) {
            xPos = x + (this.traceHistory[i] / maxTrack) * width;
            ctx.lineTo(xPos, cy - 15);
            ctx.lineTo(xPos, cy + 15);
            ctx.lineTo(xPos, cy);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Draw head pointer
     * @private
     */
    drawHeadPointer(ctx, x, y, width, height) {
        const cy = y + height / 2;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;
        const cx = x + (this.state.currentHeadPosition / maxTrack) * width;

        // --- MODIFICATION: Draw head triangle removed ---
        // ctx.fillStyle = this.colors.head;
        // ctx.beginPath();
        // ctx.moveTo(cx, y - 15);
        // ctx.lineTo(cx - 8, y - 30);
        // ctx.lineTo(cx + 8, y - 30);
        // ctx.closePath();
        // ctx.fill();
        // --- END MODIFICATION ---

        // Draw connection line
        ctx.strokeStyle = this.colors.head;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // --- MODIFICATION: Line starts from the HTML box position ---
        ctx.moveTo(cx, y - 15); // Starts slightly above the disk bar
        // --- END MODIFICATION ---
        ctx.lineTo(cx, y + height + 15);
        ctx.stroke();

        // Draw head circle
        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();

        // --- MODIFICATION: Removed position label ---
        // The HTML box now handles this.
        // ctx.fillStyle = this.colors.head;
        // ctx.font = 'bold 14px Arial';
        // ctx.textAlign = 'center';
        // ctx.fillText(this.state.currentHeadPosition, cx, y - 35);
        // --- END MODIFICATION ---
    }

    /**
     * Draw axis labels
     * @private
     */
    drawAxisLabels(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        // X-axis labels
        ctx.textAlign = 'center';
        ctx.fillText('0', x, y + height + 25);
        ctx.textAlign = 'center';
        ctx.fillText(this.state.maxTrackNumber, x + width, y + height + 25);

        // Y-axis label
        ctx.save();
        ctx.translate(this.diskPadding / 2, y + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Disk Head Position', 0, 0);
        ctx.restore();
    }

    /**
     * Draw legend (This function is no longer called)
     * @private
     */
    drawLegend(ctx) {
        const legendY = this.diskCanvas.height - 20;
        const legendX = this.diskPadding;
        const itemSpacing = 150;

        ctx.font = '11px Arial';
        ctx.fillStyle = this.colors.text;

        // Pending requests
        ctx.fillStyle = this.colors.pending;
        ctx.beginPath();
        ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText('Pending', legendX + 12, legendY + 3);

        // Serviced requests
        ctx.fillStyle = this.colors.serviced;
        ctx.beginPath();
        ctx.arc(legendX + itemSpacing, legendY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Serviced', legendX + itemSpacing + 12, legendY + 3);

        // Head pointer
        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.moveTo(legendX + itemSpacing * 2, legendY - 6);
        ctx.lineTo(legendX + itemSpacing * 2 - 3, legendY - 9);
        ctx.lineTo(legendX + itemSpacing * 2 + 3, legendY - 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Head', legendX + itemSpacing * 2 + 12, legendY + 3);
    }

    /**
     * Render position vs. time graph (Time on Y-axis, Position on X-axis)
     * @private
     */
    renderPositionGraph() {
        const ctx = this.graphCtx;
        const width = this.graphCanvas.width - 2 * this.graphPadding;
        const height = this.graphCanvas.height - 2 * this.graphPadding;
        const x = this.graphPadding;
        const y = this.graphPadding;

        // Draw background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);

        // Draw grid
        this.drawGraphGridSwapped(ctx, x, y, width, height);

        // Draw axes
        this.drawGraphAxesSwapped(ctx, x, y, width, height);

        // Draw data line (zigzag pattern going down)
        this.drawGraphDataLineSwapped(ctx, x, y, width, height);

        // Draw axis labels
        this.drawGraphAxisLabelsSwapped(ctx, x, y, width, height);
    }

    /**
     * Draw graph grid (swapped axes)
     * @private
     */
    drawGraphGridSwapped(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // Vertical grid lines (for position intervals)
        const positionIntervals = 5;
        for (let i = 0; i <= positionIntervals; i++) {
            const xPos = x + (width / positionIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }

        // Horizontal grid lines (for time intervals)
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        const timeIntervals = Math.min(totalSteps, 15);
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
     * Draw graph axes (swapped)
     * @private
     */
    drawGraphAxesSwapped(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;

        // Y-axis (left side)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();

        // X-axis (bottom side)
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    }

    /**
     * Draw graph data line (swapped - zigzag pattern going DOWN)
     * @private
     */
    drawGraphDataLineSwapped(ctx, x, y, width, height) {
        if (this.state.allSteps.length === 0) return;

        ctx.strokeStyle = this.colors.pending;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;


        // Plot each step - Time on Y-axis (going DOWN), Position on X-axis
        for (let i = 0; i <= this.state.currentStepIndex && i < this.state.allSteps.length; i++) {
            const step = this.state.allSteps[i];
            // X position based on head position (0 to maxTrack)
            const xPos = x + (step.headPosition / maxTrack) * width;
            // Y position based on time step (going downward)
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

        ctx.fillStyle = this.colors.pending;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw circle outline
        ctx.strokeStyle = this.colors.head;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Draw graph axis labels (swapped)
     * @private
     */
    drawGraphAxisLabelsSwapped(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';
        const maxTrack = this.state.maxTrackNumber > 0 ? this.state.maxTrackNumber : 1;

        // X-axis label (position - horizontal)
        ctx.textAlign = 'center';
        ctx.fillText('Disk Position', x + width / 2, y + height + 40); // Increased padding

        // Y-axis label (time - vertical)
        ctx.save();
        ctx.translate(x - 40, y + height / 2); // Increased padding
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Time (Steps)', 0, 0);
        ctx.restore();

        // X-axis values (positions: 0, maxTrack)
        ctx.textAlign = 'center';
        ctx.font = '10px Arial';
        ctx.fillText('0', x, y + height + 20); // Increased padding
        ctx.textAlign = 'center';
        ctx.fillText(this.state.maxTrackNumber, x + width, y + height + 20); // Increased padding

        // X-axis intermediate values
        for (let i = 1; i <= 4; i++) {
            const xPos = x + (width / 5) * i;
            const posValue = Math.round((i / 5) * maxTrack);
            ctx.fillText(posValue, xPos, y + height + 20); // Increased padding
        }

        // Y-axis values (time: 0 to max steps)
        ctx.textAlign = 'right';
        const totalSteps = this.state.allSteps.length > 1 ? this.state.allSteps.length - 1 : 1;
        const timeIntervals = Math.min(totalSteps, 8);
        if (timeIntervals > 0) {
            for (let i = 0; i <= timeIntervals; i++) {
                const yPos = y + (height / timeIntervals) * i;
                const stepValue = Math.round((i / timeIntervals) * totalSteps);
                ctx.fillText(stepValue, x - 8, yPos + 3);
            }
        }
    }

    /**
     * Update trace history
     */
    updateTraceHistory() {
        // --- MODIFICATION: This logic is now correct ---
        // It rebuilds the trace from step 0 up to the current step.
        // This fixes the "Step Backward" glitch.
        this.traceHistory = [];
        for (let i = 0; i <= this.state.currentStepIndex; i++) {
            if (this.state.allSteps[i]) {
                this.traceHistory.push(this.state.allSteps[i].headPosition);
            }
        }
        // --- END MODIFICATION ---
    }

    /**
     * Reset trace history
     */
    resetTrace() {
        // Only show the initial head position
        this.traceHistory = [this.state.initialHeadPosition];
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        const diskContainer = this.diskCanvas.parentElement;
        if (diskContainer) {
            // Use clientWidth for a more robust width calculation
            this.diskCanvas.width = diskContainer.clientWidth;
        }
        
        const graphContainer = this.graphCanvas.parentElement;
         if (graphContainer) {
            this.graphCanvas.width = graphContainer.clientWidth;
        }
        
        // Re-render after resize
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasRenderer;
}

