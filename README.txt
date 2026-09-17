Noise Timer — animated landing page update

Open index.html to preview the new welcome screen. Select Start Noise Timer
 to enter the original timer, then Enable Microphone and Start Class.

For microphone and installable/offline app features, serve the entire folder
from HTTPS hosting (or localhost for development). Keep all files and the
icons folder together. No build step or external dependencies are required.

Changes: responsive welcome page, privacy explanation, keyboard-accessible
Start Noise Timer button, and refreshed offline cache. The existing app.js,
manifest, and app icons are unchanged. Opening the welcome page or selecting
Start Noise Timer does not activate the microphone.

Verification: desktop and mobile welcome layouts and transition checked in a
browser. Original timer logic verified byte-for-byte against the supplied ZIP.
Live microphone operation and installation were not retested in this update.

Animation update: the Start button pulses, a green circle sweeps across the
screen, and timer panels slide into view. Reduced-motion preferences skip the
animation. Verified launch completion, focus transfer, and overlay cleanup in
the browser. Timer functionality remains unchanged.

Version 4: branded sound-wave launch with expanding rings, sage-green timer
background and controls, and a more prominent red loud-state card and timer.
Verified launch completion and visually inspected normal and simulated loud
states. Microphone and time-counting code remain unchanged.

Version 5: prominent microphone invitation with privacy notice; contracts to
a compact enabled status after successful access. Denial leaves a retry prompt.
Success and denial flows tested using simulated microphone access; live
hardware permissions were not tested. Reduced-motion settings are respected.

Version 10: based on version 7 layout. Each opening starts with a 10% noise
limit and 0-second grace period. Settings remain adjustable during use.
