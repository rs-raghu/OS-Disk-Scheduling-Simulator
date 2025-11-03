/* =====================================================
 * JS/MAIN.JS - APPLICATION ENTRY POINT
 * =====================================================
 * This file is responsible for initializing the entire
 * application. It waits for the DOM to be loaded,
 * then creates and connects all the major modules
 * (StateManager, CanvasRenderer, Controller) and
 * attaches the primary event listeners.
 * ===================================================== */

/**
 * Main application initialization function.
 * This function orchestrates the setup of the entire simulator.
 * It's called once the DOM is fully loaded.
 */
function initializeApp() {
    try {
        console.log('Initializing OS Disk Scheduling Simulator...');

        // 1. Get references to the two main UI panels
        const configPanel = document.getElementById('config-panel');
        const simulationPanel = document.getElementById('simulation-panel');

        // --- UI View-Switching Functions ---
        // These functions are passed to the controller so it can
        // manage the application's view state (config vs. simulation).

        /**
         * Hides the configuration panel and shows the simulation panel.
         */
        function showSimulationView() {
            configPanel.style.display = 'none';
            simulationPanel.style.display = 'block';
        }

        /**
         * Hides the simulation panel and shows the configuration panel.
         * Used by the "Reset Algorithm" button.
         */
        function showConfigView() {
            simulationPanel.style.display = 'none';
            configPanel.style.display = 'block';
        }

        // 2. Create State Manager
        // This object holds all application data (inputs, algorithm steps, etc.)
        // It is created first as it's a dependency for other modules.
        const stateManager = new StateManager();
        console.log('✓ State Manager created');

        // 3. Create Canvas Renderer
        // This object is responsible for all drawing on both canvases.
        // It takes the stateManager as a dependency to know *what* to draw.
        const canvasRenderer = new CanvasRenderer('diskCanvas', 'graphCanvas', stateManager);
        console.log('✓ Canvas Renderer created');

        // 4. Create Controller
        // This is the "brain" of the app. It connects the state, the renderer,
        // and the UI, handling all user interactions.
        const controller = new Controller(stateManager, canvasRenderer, showSimulationView, showConfigView);
        console.log('✓ Controller created');

        // 5. Register all available algorithms with the Controller.
        // This "plugin" model makes it easy to add new algorithms.
        controller.registerAlgorithm('fcfs', FCFS);
        controller.registerAlgorithm('sstf', SSTF);
        controller.registerAlgorithm('scan', SCAN);
        controller.registerAlgorithm('cscan', CSCAN);
        controller.registerAlgorithm('look', LOOK);
        controller.registerAlgorithm('clook', CLOOK);
        console.log('✓ All algorithms registered');

        // 6. Initialize the controller.
        // This internally sets up all *simulation-panel* listeners
        // (play, pause, step, etc.)
        controller.init();
        console.log('✓ Controller initialized');

        // 7. Setup Main UI Event Listeners (for config-panel)

        // Listener for the FIRST "Run Simulation" button
        document.getElementById('runSimulationBtn').addEventListener('click', () => {
            controller.handleRunSimulation();
        });

        // Listener for the "Reset Algorithm" button
        document.getElementById('resetAlgorithmBtn').addEventListener('click', () => {
            controller.handleFullReset();
        });

        // --- Live Input Handling ---
        
        // Get all input elements from the config panel
        const algorithmSelect = document.getElementById('algorithmSelect');
        const initialHeadPosition = document.getElementById('initialHeadPosition');
        const maxTrackNumber = document.getElementById('maxTrackNumber');
        const requestQueue = document.getElementById('requestQueue');
        const directionGroup = document.getElementById('directionGroup');
        const directionInputs = document.querySelectorAll('input[name="direction"]');
        
        const scanAlgos = ['scan', 'cscan', 'look', 'clook'];

        /**
         * Handles any change to the configuration inputs.
         * This function is a single handler for all config inputs.
         */
        const handleInputChange = () => {
            // 1. Toggle the "Direction" radio buttons
            // Show only if a SCAN or LOOK algorithm is selected
            if (scanAlgos.includes(algorithmSelect.value)) {
                directionGroup.style.display = 'flex';
            } else {
                directionGroup.style.display = 'none';
            }
            
            // 2. Re-generate the simulation data in "silent mode".
            // This updates the state and the "Initial Request Queue" display
            // in real-time as the user types, without running the animation.
            controller.generateSimulation(true); // true = silent mode
        };

        // Attach the single handler to all config inputs
        algorithmSelect.addEventListener('change', handleInputChange);
        initialHeadPosition.addEventListener('input', handleInputChange);
        maxTrackNumber.addEventListener('input', handleInputChange);
        requestQueue.addEventListener('input', handleInputChange);
        directionInputs.forEach(input => input.addEventListener('change', handleInputChange));

        // Call it once on load to set the initial UI state
        // (e.g., hide direction group, populate initial queue box)
        handleInputChange();

        // 8. Handle initial canvas sizing
        // This ensures the canvases are responsive on load.
        canvasRenderer.handleResize();
        console.log('✓ Canvas resized');

        console.log('Application ready!');

    } catch (error) {
        console.error('CRITICAL Error initializing application:', error);
        // Display a user-facing error if initialization fails
        alert('Error initializing application: ' + error.message + '\nPlease refresh the page.');
    }
}

/**
 * Wait for DOM to be fully loaded before initializing the app.
 * This prevents errors from trying to access elements that don't exist yet.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

/**
 * Global error handler for uncaught exceptions.
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

/**
 * Global handler for unhandled promise rejections.
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});