/* =====================================================
   JS/CANVAS-RENDERER.JS - VISUALIZATION ENGINE
   ===================================================== */

class CanvasRenderer {
    constructor(diskCanvasId, graphCanvasId, stateManager) {
        this.diskCanvas = document.getElementById(diskCanvasId);
        this.graphCanvas = document.getElementById(graphCanvasId);
        this.diskCtx = this.diskCanvas.getContext('2d');
        this.graphCtx = this.graphCanvas.getContext('2d');
        this.state = stateManager;

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
    }

    /**
     * Render disk scheduling visualization
     * @private
     */
    renderDiskVisualization() {
        const ctx = this.diskCtx;
        const width = this.diskCanvas.width - 2 * this.diskPadding;
        const height = this.diskHeight;
        const x = this.diskPadding;
        const y = 30;

        // Draw disk bar
        this.drawDiskBar(ctx, x, y, width, height);

        // Draw grid lines
        this.drawGridLines(ctx, x, y, width, height);

        // Draw request dots
        this.drawRequestDots(ctx, x, y, width, height);

        // Draw trace line
        this.drawTraceLine(ctx, x, y, width, height);

        // Draw head pointer
        this.drawHeadPointer(ctx, x, y, width, height);

        // Draw axis labels
        this.drawAxisLabels(ctx, x, y, width, height);

        // Draw legend
        this.drawLegend(ctx);
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

        // Draw pending requests
        this.state.pendingRequests.forEach(pos => {
            const cx = x + (pos / this.state.maxTrackNumber) * width;
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
            const cx = x + (pos / this.state.maxTrackNumber) * width;
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
     * Draw trace line showing head movement
     * @private
     */
    drawTraceLine(ctx, x, y, width, height) {
        if (this.traceHistory.length < 2) return;

        ctx.strokeStyle = this.colors.trace;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();

        const cy = y + height / 2;

        // Start from first position
        let xPos = x + (this.traceHistory[0] / this.state.maxTrackNumber) * width;
        ctx.moveTo(xPos, cy);

        // Draw line through all positions
        for (let i = 1; i < this.traceHistory.length; i++) {
            xPos = x + (this.traceHistory[i] / this.state.maxTrackNumber) * width;
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
        const cx = x + (this.state.currentHeadPosition / this.state.maxTrackNumber) * width;

        // Draw head triangle
        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.moveTo(cx, y - 15);
        ctx.lineTo(cx - 8, y - 30);
        ctx.lineTo(cx + 8, y - 30);
        ctx.closePath();
        ctx.fill();

        // Draw connection line
        ctx.strokeStyle = this.colors.head;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, y - 15);
        ctx.lineTo(cx, y + height + 15);
        ctx.stroke();

        // Draw head circle
        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw position label
        ctx.fillStyle = this.colors.head;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.state.currentHeadPosition, cx, y - 35);
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
     * Draw legend
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
     * Render position vs. time graph
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
        this.drawGraphGrid(ctx, x, y, width, height);

        // Draw axes
        this.drawGraphAxes(ctx, x, y, width, height);

        // Draw data line
        this.drawGraphDataLine(ctx, x, y, width, height);

        // Draw axis labels
        this.drawGraphAxisLabels(ctx, x, y, width, height);
    }

    /**
     * Draw graph grid
     * @private
     */
    drawGraphGrid(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;

        // Vertical grid lines
        const timeIntervals = Math.min(this.state.allSteps.length, 10);
        for (let i = 0; i <= timeIntervals; i++) {
            const xPos = x + (width / timeIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }

        // Horizontal grid lines
        const positionIntervals = 5;
        for (let i = 0; i <= positionIntervals; i++) {
            const yPos = y + (height / positionIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(x, yPos);
            ctx.lineTo(x + width, yPos);
            ctx.stroke();
        }
    }

    /**
     * Draw graph axes
     * @private
     */
    drawGraphAxes(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    }

    /**
     * Draw graph data line
     * @private
     */
    drawGraphDataLine(ctx, x, y, width, height) {
        if (this.state.allSteps.length === 0) return;

        ctx.strokeStyle = this.colors.pending;
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Plot each step
        for (let i = 0; i <= this.state.currentStepIndex && i < this.state.allSteps.length; i++) {
            const step = this.state.allSteps[i];
            const xPos = x + (i / Math.max(1, this.state.allSteps.length - 1)) * width;
            const yPos = y + height - (step.headPosition / this.state.maxTrackNumber) * height;

            if (i === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }

        ctx.stroke();

        // Draw current point
        const currentStep = this.state.getCurrentStep();
        const currentX = x + (this.state.currentStepIndex / Math.max(1, this.state.allSteps.length - 1)) * width;
        const currentY = y + height - (currentStep.headPosition / this.state.maxTrackNumber) * height;

        ctx.fillStyle = this.colors.pending;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw graph axis labels
     * @private
     */
    drawGraphAxisLabels(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';

        // X-axis label
        ctx.textAlign = 'center';
        ctx.fillText('Time (Steps)', x + width / 2, y + height + 30);

        // Y-axis label
        ctx.save();
        ctx.translate(x - 30, y + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Position', 0, 0);
        ctx.restore();

        // Y-axis values
        ctx.textAlign = 'right';
        ctx.font = '10px Arial';
        for (let i = 0; i <= 5; i++) {
            const yPos = y + (height / 5) * i;
            const posValue = this.state.maxTrackNumber - (i / 5) * this.state.maxTrackNumber;
            ctx.fillText(Math.round(posValue), x - 8, yPos + 3);
        }

        // X-axis values
        ctx.textAlign = 'center';
        const timeIntervals = Math.min(this.state.allSteps.length, 10);
        for (let i = 0; i <= timeIntervals; i++) {
            const xPos = x + (width / timeIntervals) * i;
            const stepValue = Math.round((i / timeIntervals) * (this.state.allSteps.length - 1));
            ctx.fillText(stepValue, xPos, y + height + 15);
        }
    }

    /**
     * Update trace history
     */
    updateTraceHistory() {
        const currentStep = this.state.getCurrentStep();
        if (this.traceHistory.length === 0 || this.traceHistory[this.traceHistory.length - 1] !== currentStep.headPosition) {
            this.traceHistory.push(currentStep.headPosition);
        }
    }

    /**
     * Reset trace history
     */
    resetTrace() {
        this.traceHistory = [this.state.initialHeadPosition];
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        const diskContainer = this.diskCanvas.parentElement;
        this.diskCanvas.width = diskContainer.offsetWidth - 40;
        
        const graphContainer = this.graphCanvas.parentElement;
        this.graphCanvas.width = graphContainer.offsetWidth - 40;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasRenderer;
}