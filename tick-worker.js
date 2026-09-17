// Keep sampling independently of the main page's animation frames.
setInterval(() => postMessage('tick'), 50);
