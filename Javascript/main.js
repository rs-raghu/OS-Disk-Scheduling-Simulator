/* =====================================================
 * JS/MAIN.JS - APPLICATION ENTRY POINT
 * ===================================================== */

/**
 * Initialize and start the application
 * Called when DOM is fully loaded
 */
function initializeApp() {
    try {
        console.log('🚀 Initializing OS Disk Scheduling Simulator...');

        // 1. Get UI Panel Elements
        const configPanel = document.getElementById('config-panel');
        const simulationPanel = document.getElementById('simulation-panel');

        // --- UI View-Switching Functions ---
        function showSimulationView() {
            configPanel.style.display = 'none';
            simulationPanel.style.display = 'block';
        }

        function showConfigView() {
            simulationPanel.style.display = 'none';
            configPanel.style.display = 'block';
        }

        // 2. Create State Manager
        const stateManager = new StateManager();
        console.log('✓ State Manager created');

        // 3. Create Canvas Renderer
        const canvasRenderer = new CanvasRenderer('diskCanvas', 'graphCanvas', stateManager);
        console.log('✓ Canvas Renderer created');

        // 4. Create Controller
        // Pass the view-switching functions to the controller
        const controller = new Controller(stateManager, canvasRenderer, showSimulationView, showConfigView);
        console.log('✓ Controller created');

        // 5. Register all algorithms
        controller.registerAlgorithm('fcfs', FCFS);
        controller.registerAlgorithm('sstf', SSTF);
        controller.registerAlgorithm('scan', SCAN);
        controller.registerAlgorithm('cscan', CSCAN);
        controller.registerAlgorithm('look', LOOK);
        controller.registerAlgorithm('clook', CLOOK);
        console.log('✓ All algorithms registered');

        // 6. Initialize controller (this sets up its internal listeners)
        controller.init();
        console.log('✓ Controller initialized');

        // 7. --- Setup Main UI Event Listeners (Moved from index.html) ---

        // Listener for the FIRST "Run Simulation" button
        document.getElementById('runBtn').addEventListener('click', () => {
            controller.handleRunSimulation();
        });

        // Listener for the "Reset Algorithm" button
        document.getElementById('resetAlgorithmBtn').addEventListener('click', () => {
            controller.handleFullReset();
        });

        // Listener for the Direction Group (SCAN/LOOK)
        const algorithmSelect = document.getElementById('algorithmSelect');
        const directionGroup = document.getElementById('directionGroup');
        const scanAlgos = ['scan', 'cscan', 'look', 'clook'];

        const toggleDirectionGroup = () => {
            if (scanAlgos.includes(algorithmSelect.value)) {
                directionGroup.style.display = 'flex';
            } else {
                directionGroup.style.display = 'none';
            }
        };
        algorithmSelect.addEventListener('change', () => {
            toggleDirectionGroup();
            // Also regenerate simulation on algorithm change
            controller.handleAlgorithmChange();
        });
        // Call it once on load
        toggleDirectionGroup();


        // 8. Handle initial canvas sizing
        canvasRenderer.handleResize();
        console.log('✓ Canvas resized');

        // 9. Generate initial simulation (but don't switch view)
        controller.generateSimulation();
        console.log('✓ Initial simulation generated');

        // 10. Update UI
        controller.updateAllUI();
        console.log('✓ UI updated');

        console.log('✅ Application ready!');

    } catch (error) {
        console.error('❌ Error initializing application:', error);
        // Use a less intrusive error display
        const errorEl = document.getElementById('currentActionText');
        if (errorEl) {
            errorEl.textContent = 'Error initializing application: ' + error.message;
            errorEl.style.color = 'red';
        }
    }
}

/**
 * Wait for DOM to be fully loaded before initializing
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
