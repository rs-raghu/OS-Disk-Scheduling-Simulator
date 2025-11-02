/* =====================================================
   JS/MAIN.JS - APPLICATION ENTRY POINT
   ===================================================== */

/**
 * Initialize and start the application
 * Called when DOM is fully loaded
 */
function initializeApp() {
    try {
        console.log('🚀 Initializing OS Disk Scheduling Simulator...');

        // 1. Create State Manager
        const stateManager = new StateManager();
        console.log('✓ State Manager created');

        // 2. Create Canvas Renderer
        const canvasRenderer = new CanvasRenderer('diskCanvas', 'graphCanvas', stateManager);
        console.log('✓ Canvas Renderer created');

        // 3. Create Controller
        const controller = new Controller(stateManager, canvasRenderer);
        console.log('✓ Controller created');

        // 4. Register all algorithms
        controller.registerAlgorithm('fcfs', FCFS);
        controller.registerAlgorithm('sstf', SSTF);
        controller.registerAlgorithm('scan', SCAN);
        controller.registerAlgorithm('cscan', CSCAN);
        controller.registerAlgorithm('look', LOOK);
        controller.registerAlgorithm('clook', CLOOK);
        console.log('✓ All algorithms registered');

        // 5. Initialize controller
        controller.init();
        console.log('✓ Controller initialized');

        // 6. Handle initial canvas sizing
        canvasRenderer.handleResize();
        console.log('✓ Canvas resized');

        // 7. Generate initial simulation
        controller.generateSimulation();
        console.log('✓ Initial simulation generated');

        // 8. Update UI
        controller.updateAllUI();
        console.log('✓ UI updated');

        console.log('✅ Application ready!');

    } catch (error) {
        console.error('❌ Error initializing application:', error);
        alert('Error initializing application: ' + error.message);
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