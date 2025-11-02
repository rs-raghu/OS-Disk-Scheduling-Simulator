/* =====================================================
   COMPLETE OS DISK SCHEDULING SIMULATOR - ALL IN ONE FILE
   ===================================================== */

// ==================== STATE MANAGER ====================
class StateManager {
    constructor() {
        this.algorithm = 'fcfs';
        this.initialHeadPosition = 53;
        this.maxTrackNumber = 199;
        this.requestQueue = [];
        this.direction = 'low';
        
        this.allSteps = [];
        this.currentStepIndex = 0;
        this.isRunning = false;
        this.animationSpeed = 5;
        
        this.totalHeadMovement = 0;
        this.seeksCount = 0;
        this.averageSeekTime = 0;
        this.currentHeadPosition = 0;
        this.pendingRequests = [];
        this.servicedRequests = [];
        this.nextTarget = null;
        
        this.isInitialized = false;
    }

    initializeWithParams(params) {
        this.algorithm = params.algorithm || 'fcfs';
        this.initialHeadPosition = parseInt(params.initialHeadPosition) || 53;
        this.maxTrackNumber = parseInt(params.maxTrackNumber) || 199;
        this.requestQueue = this.parseRequestQueue(params.requestQueue) || [];
        this.direction = params.direction || 'low';
        
        this.resetSimulation();
        this.isInitialized = true;
    }

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

    generateSequence(algorithmClass) {
        this.resetSimulation();
        
        try {
            const algorithm = new algorithmClass(
                this.initialHeadPosition,
                this.maxTrackNumber,
                [...this.requestQueue],
                this.direction
            );

            const sequence = algorithm.execute();
            this.allSteps = this.convertSequenceToSteps(sequence);

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

    convertSequenceToSteps(sequence) {
        const steps = [];
        let totalMovement = 0;
        let servicedQueue = [];
        let pendingQueue = [...this.requestQueue];

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

        for (let i = 1; i < sequence.length; i++) {
            const previousPos = sequence[i - 1];
            const currentPos = sequence[i];
            const seekDistance = Math.abs(currentPos - previousPos);
            totalMovement += seekDistance;

            if (pendingQueue.includes(currentPos)) {
                servicedQueue.push(currentPos);
                pendingQueue = pendingQueue.filter(req => req !== currentPos);
            }

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

    generateActionText(fromPos, toPos, seekDistance, pendingQueue) {
        const serviced = this.requestQueue.includes(toPos) ? ' ✓ Serviced!' : '';
        const pending = pendingQueue.length > 0 ? `${pendingQueue.length} pending` : 'All serviced!';
        return `Moving from ${fromPos} → ${toPos} (Seek: ${seekDistance})${serviced} | ${pending}`;
    }

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

    getCurrentStep() {
        if (this.allSteps.length === 0) {
            return this.createInitialStep();
        }
        return this.allSteps[Math.min(this.currentStepIndex, this.allSteps.length - 1)];
    }

    nextStep() {
        if (this.currentStepIndex < this.allSteps.length - 1) {
            this.currentStepIndex++;
            this.updateStatistics();
            return true;
        }
        return false;
    }

    previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.updateStatistics();
            return true;
        }
        return false;
    }

    jumpToStep(stepIndex) {
        const index = Math.max(0, Math.min(stepIndex, this.allSteps.length - 1));
        this.currentStepIndex = index;
        this.updateStatistics();
    }

    updateStatistics() {
        const currentStep = this.getCurrentStep();
        this.currentHeadPosition = currentStep.headPosition;
        this.totalHeadMovement = currentStep.totalHeadMovement;
        this.pendingRequests = [...currentStep.pendingQueue];
        this.servicedRequests = [...currentStep.servicedQueue];
        this.nextTarget = currentStep.nextTarget;
        
        if (currentStep.step > 0) {
            this.seeksCount = currentStep.step;
            this.averageSeekTime = this.totalHeadMovement / this.seeksCount;
        } else {
            this.seeksCount = 0;
            this.averageSeekTime = 0;
        }
    }

    isComplete() {
        return this.currentStepIndex === this.allSteps.length - 1 && this.pendingRequests.length === 0;
    }

    isAtStart() {
        return this.currentStepIndex === 0;
    }

    getProgress() {
        if (this.allSteps.length === 0) return 0;
        return Math.round((this.currentStepIndex / (this.allSteps.length - 1)) * 100);
    }

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

    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(1, Math.min(10, speed));
    }

    getAnimationDelay() {
        return (1000 / this.animationSpeed);
    }

    toggleRunning() {
        this.isRunning = !this.isRunning;
        return this.isRunning;
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isComplete()) {
            this.isRunning = true;
        }
    }

    getStepInfo() {
        return `${this.currentStepIndex} / ${this.allSteps.length}`;
    }

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

// ==================== CANVAS RENDERER ====================
class CanvasRenderer {
    constructor(diskCanvasId, graphCanvasId, stateManager) {
        this.diskCanvas = document.getElementById(diskCanvasId);
        this.graphCanvas = document.getElementById(graphCanvasId);
        this.diskCtx = this.diskCanvas.getContext('2d');
        this.graphCtx = this.graphCanvas.getContext('2d');
        this.state = stateManager;

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

        this.traceHistory = [];
    }

    clearCanvases() {
        this.diskCtx.fillStyle = this.colors.background;
        this.diskCtx.fillRect(0, 0, this.diskCanvas.width, this.diskCanvas.height);

        this.graphCtx.fillStyle = this.colors.background;
        this.graphCtx.fillRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
    }

    render() {
        this.clearCanvases();
        this.renderDiskVisualization();
        this.renderPositionGraph();
    }

    renderDiskVisualization() {
        const ctx = this.diskCtx;
        const width = this.diskCanvas.width - 2 * this.diskPadding;
        const height = this.diskHeight;
        const x = this.diskPadding;
        const y = 30;

        this.drawDiskBar(ctx, x, y, width, height);
        this.drawGridLines(ctx, x, y, width, height);
        this.drawRequestDots(ctx, x, y, width, height);
        this.drawTraceLine(ctx, x, y, width, height);
        this.drawHeadPointer(ctx, x, y, width, height);
        this.drawAxisLabels(ctx, x, y, width, height);
        this.drawLegend(ctx);
    }

    drawDiskBar(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.disk;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

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

    drawRequestDots(ctx, x, y, width, height) {
        const cy = y + height / 2;
        const dotRadius = 6;

        this.state.pendingRequests.forEach(pos => {
            const cx = x + (pos / this.state.maxTrackNumber) * width;
            ctx.fillStyle = this.colors.pending;
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = this.colors.border;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        this.state.servicedRequests.forEach(pos => {
            const cx = x + (pos / this.state.maxTrackNumber) * width;
            ctx.fillStyle = this.colors.serviced;
            ctx.beginPath();
            ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = this.colors.background;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 2, cy);
            ctx.lineTo(cx - 1, cy + 2);
            ctx.lineTo(cx + 3, cy - 2);
            ctx.stroke();
        });
    }

    drawTraceLine(ctx, x, y, width, height) {
        if (!this.traceHistory || this.traceHistory.length < 2) return;

        ctx.strokeStyle = this.colors.trace;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        const cy = y + height / 2;

        let xPos = x + (this.traceHistory[0] / this.state.maxTrackNumber) * width;
        ctx.moveTo(xPos, cy);

        for (let i = 1; i < this.traceHistory.length; i++) {
            xPos = x + (this.traceHistory[i] / this.state.maxTrackNumber) * width;
            ctx.lineTo(xPos, cy - 15);
            ctx.lineTo(xPos, cy + 15);
            ctx.lineTo(xPos, cy);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawHeadPointer(ctx, x, y, width, height) {
        const cy = y + height / 2;
        const cx = x + (this.state.currentHeadPosition / this.state.maxTrackNumber) * width;

        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.moveTo(cx, y - 15);
        ctx.lineTo(cx - 8, y - 30);
        ctx.lineTo(cx + 8, y - 30);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.colors.head;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, y - 15);
        ctx.lineTo(cx, y + height + 15);
        ctx.stroke();

        ctx.fillStyle = this.colors.head;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.head;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.state.currentHeadPosition, cx, y - 35);
    }

    drawAxisLabels(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        ctx.fillText('0', x, y + height + 25);
        ctx.textAlign = 'center';
        ctx.fillText(this.state.maxTrackNumber, x + width, y + height + 25);

        ctx.save();
        ctx.translate(this.diskPadding / 2, y + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Disk Head Position', 0, 0);
        ctx.restore();
    }

    drawLegend(ctx) {
        const legendY = this.diskCanvas.height - 20;
        const legendX = this.diskPadding;
        const itemSpacing = 150;

        ctx.font = '11px Arial';
        ctx.fillStyle = this.colors.text;

        ctx.fillStyle = this.colors.pending;
        ctx.beginPath();
        ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText('Pending', legendX + 12, legendY + 3);

        ctx.fillStyle = this.colors.serviced;
        ctx.beginPath();
        ctx.arc(legendX + itemSpacing, legendY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Serviced', legendX + itemSpacing + 12, legendY + 3);

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

    renderPositionGraph() {
        const ctx = this.graphCtx;
        const width = this.graphCanvas.width - 2 * this.graphPadding;
        const height = this.graphCanvas.height - 2 * this.graphPadding;
        const x = this.graphPadding;
        const y = this.graphPadding;

        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);

        this.drawGraphGrid(ctx, x, y, width, height);
        this.drawGraphAxes(ctx, x, y, width, height);
        this.drawGraphDataLine(ctx, x, y, width, height);
        this.drawGraphAxisLabels(ctx, x, y, width, height);
    }

    drawGraphGrid(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.gridLine;
        ctx.lineWidth = 1;

        const timeIntervals = Math.min(this.state.allSteps.length, 10);
        for (let i = 0; i <= timeIntervals; i++) {
            const xPos = x + (width / timeIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }

        const positionIntervals = 5;
        for (let i = 0; i <= positionIntervals; i++) {
            const yPos = y + (height / positionIntervals) * i;
            ctx.beginPath();
            ctx.moveTo(x, yPos);
            ctx.lineTo(x + width, yPos);
            ctx.stroke();
        }
    }

    drawGraphAxes(ctx, x, y, width, height) {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    }

    drawGraphDataLine(ctx, x, y, width, height) {
        if (this.state.allSteps.length === 0) return;

        ctx.strokeStyle = this.colors.pending;
        ctx.lineWidth = 2;
        ctx.beginPath();

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

        const currentStep = this.state.getCurrentStep();
        const currentX = x + (this.state.currentStepIndex / Math.max(1, this.state.allSteps.length - 1)) * width;
        const currentY = y + height - (currentStep.headPosition / this.state.maxTrackNumber) * height;

        ctx.fillStyle = this.colors.pending;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGraphAxisLabels(ctx, x, y, width, height) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '12px Arial';

        ctx.textAlign = 'center';
        ctx.fillText('Time (Steps)', x + width / 2, y + height + 30);

        ctx.save();
        ctx.translate(x - 30, y + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Position', 0, 0);
        ctx.restore();

        ctx.textAlign = 'right';
        ctx.font = '10px Arial';
        for (let i = 0; i <= 5; i++) {
            const yPos = y + (height / 5) * i;
            const posValue = this.state.maxTrackNumber - (i / 5) * this.state.maxTrackNumber;
            ctx.fillText(Math.round(posValue), x - 8, yPos + 3);
        }

        ctx.textAlign = 'center';
        const timeIntervals = Math.min(this.state.allSteps.length, 10);
        for (let i = 0; i <= timeIntervals; i++) {
            const xPos = x + (width / timeIntervals) * i;
            const stepValue = Math.round((i / timeIntervals) * (this.state.allSteps.length - 1));
            ctx.fillText(stepValue, xPos, y + height + 15);
        }
    }

    updateTraceHistory() {
        const currentStep = this.state.getCurrentStep();
        if (!this.traceHistory || this.traceHistory.length === 0 || this.traceHistory[this.traceHistory.length - 1] !== currentStep.headPosition) {
            if (!this.traceHistory) this.traceHistory = [];
            this.traceHistory.push(currentStep.headPosition);
        }
    }

    resetTrace() {
        this.traceHistory = [this.state.initialHeadPosition];
    }

    handleResize() {
        const diskContainer = this.diskCanvas.parentElement;
        this.diskCanvas.width = Math.max(diskContainer.offsetWidth - 40, 600);
        
        const graphContainer = this.graphCanvas.parentElement;
        this.graphCanvas.width = Math.max(graphContainer.offsetWidth - 40, 600);
    }
}

// ==================== ALGORITHM BASE ====================
class AlgorithmBase {
    constructor(initialPosition, maxTrack, requests, direction = 'low') {
        this.initialPosition = initialPosition;
        this.maxTrack = maxTrack;
        this.requests = [...requests];
        this.direction = direction;
        this.validateInput();
    }

    validateInput() {
        if (this.requests.length === 0) {
            throw new Error('Request queue cannot be empty');
        }

        if (this.initialPosition < 0 || this.initialPosition > this.maxTrack) {
            throw new Error(`Initial position must be between 0 and ${this.maxTrack}`);
        }

        for (const req of this.requests) {
            if (req < 0 || req > this.maxTrack) {
                throw new Error(`Request position ${req} is out of range [0, ${this.maxTrack}]`);
            }
        }
    }

    execute() {
        throw new Error('execute() must be implemented by subclass');
    }

    calculateTotalMovement(sequence) {
        let total = 0;
        for (let i = 1; i < sequence.length; i++) {
            total += Math.abs(sequence[i] - sequence[i - 1]);
        }
        return total;
    }

    getSortedRequests() {
        return [...this.requests].sort((a, b) => a - b);
    }

    getRequestsLessThan(currentPos, sorted = true) {
        let result = this.requests.filter(req => req < currentPos);
        if (sorted) {
            result.sort((a, b) => b - a);
        }
        return result;
    }

    getRequestsGreaterOrEqual(currentPos, sorted = true) {
        let result = this.requests.filter(req => req >= currentPos);
        if (sorted) {
            result.sort((a, b) => a - b);
        }
        return result;
    }

    getRequestsGreaterThan(currentPos, sorted = true) {
        let result = this.requests.filter(req => req > currentPos);
        if (sorted) {
            result.sort((a, b) => a - b);
        }
        return result;
    }

    getRequestsLessOrEqual(currentPos, sorted = true) {
        let result = this.requests.filter(req => req <= currentPos);
        if (sorted) {
            result.sort((a, b) => b - a);
        }
        return result;
    }

    findClosestRequest(currentPos, available = null) {
        const requestsToCheck = available || this.requests;
        if (requestsToCheck.length === 0) return null;

        return requestsToCheck.reduce((closest, current) => {
            const currentDist = Math.abs(current - currentPos);
            const closestDist = Math.abs(closest - currentPos);
            return currentDist < closestDist ? current : closest;
        });
    }

    getDescription() {
        throw new Error('getDescription() must be implemented by subclass');
    }

    initializeSequence() {
        return [this.initialPosition];
    }

    cloneRequests() {
        return [...this.requests];
    }
}

// ==================== ALGORITHMS ====================
class FCFS extends AlgorithmBase {
    execute() {
        const sequence = this.initializeSequence();
        sequence.push(...this.requests);
        return sequence;
    }

    getDescription() {
        return 'FCFS: First Come First Serve. Serves requests in order.';
    }
}

class SSTF extends AlgorithmBase {
    execute() {
        const sequence = this.initializeSequence();
        const remaining = this.cloneRequests();
        let currentPos = this.initialPosition;

        while (remaining.length > 0) {
            const closest = this.findClosestRequest(currentPos, remaining);
            sequence.push(closest);
            currentPos = closest;
            remaining.splice(remaining.indexOf(closest), 1);
        }

        return sequence;
    }

    getDescription() {
        return 'SSTF: Shortest Seek Time First. Services closest request.';
    }
}

class SCAN extends AlgorithmBase {
    execute() {
        const sequence = this.initializeSequence();
        let movingUp = (this.direction === 'high');

        const leftRequests = this.getRequestsLessThan(this.initialPosition, true);
        const rightRequests = this.getRequestsGreaterOrEqual(this.initialPosition, true);
        const rightFiltered = rightRequests.filter(r => r !== this.initialPosition);

        if (movingUp) {
            sequence.push(...rightFiltered);
            sequence.push(...leftRequests);
        } else {
            sequence.push(...leftRequests);
            sequence.push(...rightFiltered);
        }

        return sequence;
    }

    getDescription() {
        return 'SCAN: Elevator algorithm. Services in one direction then reverses.';
    }
}

class CSCAN extends AlgorithmBase {
    execute() {
        const sequence = this.initializeSequence();

        const leftRequests = this.getRequestsLessThan(this.initialPosition, true);
        const rightRequests = this.getRequestsGreaterOrEqual(this.initialPosition, true);
        const rightFiltered = rightRequests.filter(r => r !== this.initialPosition);

        sequence.push(...rightFiltered);

        if (leftRequests.length > 0) {
            sequence.push(0);
            sequence.push(...leftRequests);
        }

        return sequence;
    }

    getDescription() {
        return 'C-SCAN: Circular SCAN. Goes right, wraps to left.';
    }
}

class LOOK extends AlgorithmBase {
    execute() {
        const sequence = this.initializeSequence();
        let movingUp = (this.direction === 'high');

        const leftRequests = this.getRequestsLessThan(this.initialPosition, true);
        const rightRequests = this.getRequestsGreaterThan(this.initialPosition, true);

        if (movingUp) {
            if (rightRequests.length > 0) {
                sequence.push(...rightRequests);
            }
            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
        } else {
            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
            if (rightRequests.length > 0) {
                sequence.push(...rightRequests);
            }
        }

        return sequence;
    }

    getDescription() {
        return 'LOOK: Like SCAN but reverses at last request, not disk end.';
    }
}

class CLOOK extends AlgorithmBase {
    execute() {
        const sequence = this.initializeSequence();

        const leftRequests = this.getRequestsLessThan(this.initialPosition, true);
        const rightRequests = this.getRequestsGreaterThan(this.initialPosition, true);

        const currentIsRequest = this.requests.includes(this.initialPosition);
        if (currentIsRequest && rightRequests.length === 0 && leftRequests.length > 0) {
            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
        } else {
            if (rightRequests.length > 0) {
                sequence.push(...rightRequests);
            }

            if (leftRequests.length > 0) {
                sequence.push(...leftRequests);
            }
        }

        return sequence;
    }

    getDescription() {
        return 'C-LOOK: Circular LOOK. Most efficient scanning algorithm.';
    }
}

// ==================== CONTROLLER ====================
class Controller {
    constructor(stateManager, canvasRenderer) {
        this.state = stateManager;
        this.renderer = canvasRenderer;
        this.algorithms = new Map();
        this.animationInterval = null;
        this.isAnimating = false;
    }

    registerAlgorithm(name, AlgorithmClass) {
        this.algorithms.set(name, AlgorithmClass);
    }

    init() {
        this.setupEventListeners();
        this.loadInitialState();
    }

    setupEventListeners() {
        document.getElementById('runBtn').addEventListener('click', () => this.toggleRunPause());
        document.getElementById('stepForwardBtn').addEventListener('click', () => this.handleStepForward());
        document.getElementById('stepBackwardBtn').addEventListener('click', () => this.handleStepBackward());
        document.getElementById('resetBtn').addEventListener('click', () => this.handleReset());
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());

        document.getElementById('algorithmSelect').addEventListener('change', () => this.handleAlgorithmChange());
        document.getElementById('speedSlider').addEventListener('input', (e) => this.handleSpeedChange(e));

        window.addEventListener('resize', () => this.renderer.handleResize());
    }

    loadInitialState() {
        this.generateSimulation();
    }

    generateSimulation() {
        try {
            const params = this.getParametersFromDOM();

            this.state.initializeWithParams(params);
            const validation = this.state.validateParameters();

            if (!validation.valid) {
                alert('Error: ' + validation.errors.join('\n'));
                return;
            }

            const AlgorithmClass = this.algorithms.get(this.state.algorithm);
            if (!AlgorithmClass) {
                throw new Error(`Algorithm ${this.state.algorithm} not found`);
            }

            this.state.generateSequence(AlgorithmClass);
            this.renderer.resetTrace();
            this.renderer.updateTraceHistory();

            this.updateAllUI();
        } catch (error) {
            console.error('Error generating simulation:', error);
            alert('Error: ' + error.message);
        }
    }

    getParametersFromDOM() {
        return {
            algorithm: document.getElementById('algorithmSelect').value,
            initialHeadPosition: document.getElementById('initialHeadPosition').value,
            maxTrackNumber: document.getElementById('maxTrackNumber').value,
            requestQueue: document.getElementById('requestQueue').value,
            direction: document.querySelector('input[name="direction"]:checked').value
        };
    }

    toggleRunPause() {
        if (this.state.isComplete()) {
            this.handleReset();
            return;
        }

        const isRunning = this.state.toggleRunning();
        const btn = document.getElementById('runBtn');

        if (isRunning) {
            btn.innerHTML = '<span class="btn-icon">⏸</span><span class="btn-text">Pause</span>';
            btn.classList.add('active');
            this.startAnimation();
        } else {
            btn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Run</span>';
            btn.classList.remove('active');
            this.stopAnimation();
        }
    }

    startAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }

        this.animationInterval = setInterval(() => {
            if (!this.state.nextStep()) {
                this.stopAnimation();
                document.getElementById('runBtn').innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Run</span>';
                document.getElementById('runBtn').classList.remove('active');
                this.state.pause();
            }

            this.renderer.updateTraceHistory();
            this.updateAllUI();
        }, this.state.getAnimationDelay());
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    handleStepForward() {
        this.stopAnimation();
        this.state.pause();
        document.getElementById('runBtn').innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Run</span>';
        document.getElementById('runBtn').classList.remove('active');

        if (this.state.nextStep()) {
            this.renderer.updateTraceHistory();
            this.updateAllUI();
        }
    }

    handleStepBackward() {
        this.stopAnimation();
        this.state.pause();
        document.getElementById('runBtn').innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Run</span>';
        document.getElementById('runBtn').classList.remove('active');

        if (this.state.previousStep()) {
            this.updateAllUI();
        }
    }

    handleReset() {
        this.stopAnimation();
        this.state.resetSimulation();
        this.renderer.resetTrace();
        this.renderer.updateTraceHistory();

        document.getElementById('runBtn').innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Run</span>';
        document.getElementById('runBtn').classList.remove('active');

        this.updateAllUI();
    }

    handleAlgorithmChange() {
        this.generateSimulation();
    }

    handleSpeedChange(event) {
        const speed = parseInt(event.target.value);
        this.state.setAnimationSpeed(speed);
    }

    handleExport() {
        try {
            const exportData = this.state.getExportData();
            this.generatePDF(exportData);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error: ' + error.message);
        }
    }

    generatePDF(exportData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Disk Scheduling Report', 20, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${exportData.timestamp}`, 20, 30);

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

        doc.addPage();
        doc.setFontSize(14);
        doc.text('Execution Trace', 20, 20);

        yPos = 30;
        doc.setFontSize(10);

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

        doc.save(`disk-scheduling-${exportData.algorithm}.pdf`);
    }

    updateAllUI() {
        this.updateStatistics();
        this.updateQueues();
        this.updateStepInfo();
        this.updateActionText();
        this.renderer.render();
    }

    updateStatistics() {
        document.getElementById('currentHeadPosition').textContent = this.state.currentHeadPosition;
        document.getElementById('totalHeadMovement').textContent = this.state.totalHeadMovement;
        document.getElementById('seeksCount').textContent = this.state.seeksCount;
        document.getElementById('averageSeekTime').textContent = this.state.averageSeekTime.toFixed(2);
    }

    updateQueues() {
        const pendingContainer = document.getElementById('pendingQueue');
        if (this.state.pendingRequests.length === 0) {
            pendingContainer.innerHTML = '<span class="queue-empty">All serviced!</span>';
        } else {
            pendingContainer.innerHTML = this.state.pendingRequests
                .map(req => `<span class="queue-item">${req}</span>`)
                .join('');
        }

        const servicedContainer = document.getElementById('servicedQueue');
        if (this.state.servicedRequests.length === 0) {
            servicedContainer.innerHTML = '<span class="queue-empty">None yet</span>';
        } else {
            servicedContainer.innerHTML = this.state.servicedRequests
                .map(req => `<span class="queue-item serviced">${req}</span>`)
                .join('');
        }

        const nextTargetDisplay = document.getElementById('nextTargetDisplay');
        nextTargetDisplay.textContent = this.state.nextTarget !== null ? this.state.nextTarget : '-';
    }

    updateStepInfo() {
        document.getElementById('currentStepDisplay').textContent = `Step: ${this.state.getStepInfo()}`;
    }

    updateActionText() {
        const currentStep = this.state.getCurrentStep();
        document.getElementById('currentActionText').textContent = currentStep.currentAction;
    }
}

// ==================== INITIALIZATION ====================
let stateManager = null;
let canvasRenderer = null;
let controller = null;

function initializeApp() {
    try {
        console.log('🚀 Initializing OS Disk Scheduling Simulator...');

        stateManager = new StateManager();
        console.log('✓ State Manager created');

        canvasRenderer = new CanvasRenderer('diskCanvas', 'graphCanvas', stateManager);
        console.log('✓ Canvas Renderer created');

        controller = new Controller(stateManager, canvasRenderer);
        console.log('✓ Controller created');

        controller.registerAlgorithm('fcfs', FCFS);
        controller.registerAlgorithm('sstf', SSTF);
        controller.registerAlgorithm('scan', SCAN);
        controller.registerAlgorithm('cscan', CSCAN);
        controller.registerAlgorithm('look', LOOK);
        controller.registerAlgorithm('clook', CLOOK);
        console.log('✓ All algorithms registered');

        controller.init();
        console.log('✓ Controller initialized');

        setTimeout(() => {
            canvasRenderer.handleResize();
            console.log('✓ Canvas resized');

            controller.generateSimulation();
            console.log('✓ Initial simulation generated');

            controller.updateAllUI();
            console.log('✓ UI updated');

            console.log('✅ Application ready!');
        }, 100);

    } catch (error) {
        console.error('❌ Error initializing application:', error);
        console.error('Stack trace:', error.stack);
        alert('Error initializing application:\n' + error.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

window.addEventListener('error', (event) => {
    console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled rejection:', event.reason);
});