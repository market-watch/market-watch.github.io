<script>
        // Disable right-click
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            alert("Right-click is disabled.");
        });

        // Disable F12 and Ctrl key combinations
        document.addEventListener('keydown', function(event) {
            // Check for F12 key (Developer Tools)
            if (event.key === 'F12') {
                event.preventDefault();
                alert("F12 is disabled.");
            }

            // Check for Ctrl key combinations (Ctrl+S, Ctrl+U, etc.)
            if (event.ctrlKey && (event.key === 'u' || event.key === 's' || event.key === 'p' || event.key === 'c' || event.key === 'Shift')) {
                event.preventDefault();
                alert("Ctrl key combinations are disabled.");
            }
        });
    </script>