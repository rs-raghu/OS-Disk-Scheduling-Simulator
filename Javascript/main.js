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
        document.getElementById('runSimulationBtn').addEventListener('click', () => {
            controller.handleRunSimulation();
        });

        // Listener for the "Reset Algorithm" button
        document.getElementById('resetAlgorithmBtn').addEventListener('click', () => {
            controller.handleFullReset();
        });

        // --- MODIFICATION: Add listeners for all inputs ---
        
        // Get all input elements
        const algorithmSelect = document.getElementById('algorithmSelect');
        const initialHeadPosition = document.getElementById('initialHeadPosition');
        const maxTrackNumber = document.getElementById('maxTrackNumber');
        const requestQueue = document.getElementById('requestQueue');
        const directionGroup = document.getElementById('directionGroup');
        const directionInputs = document.querySelectorAll('input[name="direction"]');
        
        const scanAlgos = ['scan', 'cscan', 'look', 'clook'];

        // This function will be called by ALL input listeners
        const handleInputChange = () => {
            // 1. Toggle the direction group visibility
            if (scanAlgos.includes(algorithmSelect.value)) {
                directionGroup.style.display = 'flex';
            } else {
                directionGroup.style.display = 'none';
            }
            
            // 2. Re-generate the simulation to update the state
            // This will also update the "Initial Request Queue" box
            controller.generateSimulation();
        };

        // Attach the *single* handler to all inputs
        algorithmSelect.addEventListener('change', handleInputChange);
        initialHeadPosition.addEventListener('input', handleInputChange);
        maxTrackNumber.addEventListener('input', handleInputChange);
        requestQueue.addEventListener('input', handleInputChange);
        directionInputs.forEach(input => input.addEventListener('change', handleInputChange));

        // Call it once on load to set initial state
        handleInputChange();
        // --- END OF MODIFICATION ---


        // 8. Handle initial canvas sizing
        canvasRenderer.handleResize();
        console.log('✓ Canvas resized');


        // --- MODIFICATION: REMOVED Redundant UI Update ---
        // The call to handleInputChange() above already generates
        // the simulation and updates the UI. This line is not needed.
        // controller.updateAllUI();
        // --- END MODIFICATION ---

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

