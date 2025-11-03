# OS Disk Scheduling Simulator

##  Project Description

This project is an interactive, web-based visualizer for common disk scheduling algorithms used in operating systems. It provides a clear, animated representation of how a disk's read/write head moves to service a queue of track requests.

The primary goal of this tool is to help students and professionals understand the behavior, performance, and trade-offs of different scheduling algorithms in a hands-on, visual way. Users can input their own parameters, select an algorithm, and watch the simulation unfold step-by-step, complete with real-time statistics and a position-vs-time graph.

## Features

This simulator includes a rich set of features designed for a comprehensive educational experience:

* **Algorithm Visualization:** Implements 6 key disk scheduling algorithms.
* **Color-Coded Interface:** Uses distinct colors for the disk head, pending requests (blue), and serviced requests (green) for at-a-glance clarity.
* **Interactive Animation Controls:** Full control over the simulation with:
    * **Play/Pause:** Start and stop the automated animation.
    * **Step Forward / Step Backward:** Move one step at a time to analyze the algorithm's decisions.
    * **Reset Animation:** Jumps the animation back to Step 0.
    * **Speed Slider:** Adjusts the animation speed from slow to fast.
* **Real-Time Statistics:** A live dashboard updates at every step to show:
    * Total Head Movement
    * Current Head Position
    * Seeks Count
    * Average Seek Time
    * Next Target Track
* **Dual Visualizations:**
    1.  **Disk Trace:** A top-down view of the disk bar showing the head's movement and request dots.
    2.  **Position vs. Time Graph:** A graph plotting the head's position (X-axis) against time in steps (Y-axis).
* **Customizable Inputs:** Users can set the initial head position, the maximum track number, and a custom comma-separated request queue.
* **Interactive Tooltip:** Hovering over any request dot on the disk bar shows its track number and status (Pending/Serviced).
* **PDF Export:** A "Export PDF" button generates a complete, multi-page report of the simulation, including parameters, final results, canvas screenshots, and a step-by-step execution trace.

## Algorithms Implemented

The simulator successfully visualizes the following algorithms:

1.  **FCFS** (First Come First Serve)
2.  **SSTF** (Shortest Seek Time First)
3.  **SCAN** (Elevator Algorithm)
4.  **C-SCAN** (Circular SCAN)
5.  **LOOK**
6.  **C-LOOK** (Circular LOOK)

## How to Run

No special setup or build process is required.

1.  Clone or download this repository to your local machine.
2.  Navigate to the project's root folder.
3.  Open the **`index.html`** file in any modern web browser (e.g., Chrome, Firefox, Edge).

The application will load, and you can begin using the simulator immediately.

## Technology Stack

* **HTML5:** For the core structure and UI elements.
* **CSS3:** For all styling, layout (Flexbox/Grid), and animations.
* **JavaScript (ES6+):**
    * For all application logic, state management, and algorithm implementation.
    * Uses a modular Model-View-Controller (MVC) architecture.
    * Leverages the **Canvas API** for all visualizations.
    * Uses **`requestAnimationFrame`** for smooth, high-performance animation.
* **External Libraries:**
    * **jsPDF** & **html2canvas:** Used for the "Export to PDF" functionality.