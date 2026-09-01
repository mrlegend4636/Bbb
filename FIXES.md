# Bot Disconnect & High CPU Usage Fixes

## Problem Summary
- Bot disconnects after ~30 minutes or periodically
- CPU usage spikes to 25%+ during operation
- Connection timeouts not properly managed

## Root Causes Identified

### 1. Uncleared Connection Timeout
**File**: `index.js` (Line 1230-1242)
- Connection timeout is set to 150 seconds but not properly cancelled on successful spawn
- This can cause the bot to be forcibly ended even when connected

### 2. Leaked Event Listeners
**File**: `index.js` (Line 1194-1202)
- When a new bot instance is created, the previous bot's listeners aren't completely removed
- Duplicate listeners accumulate, processing every event multiple times
- This causes CPU spikes and memory leaks

### 3. Stuck Reconnection Flag
**File**: `index.js` (Line 1188-1191, Line 2009-2019)
- The `isReconnecting` flag can get stuck if a reconnection is triggered during an ongoing reconnection
- Causes the bot to hang in a disconnected state

### 4. Interval Clearing Issues
**File**: `index.js` (Line 1154-1158)
- Movement and anti-AFK intervals may not all be cleared on some disconnect paths
- CPU continues running these intervals even after disconnect

## Solutions

### Apply These Changes to `index.js`:

#### Fix 1: Clear Connection Timeout on Successful Spawn (After Line 1250)
```javascript
bot.once("spawn", () => {
  if (spawnHandled) return;
  spawnHandled = true;

  // FIX: CLEAR CONNECTION TIMEOUT IMMEDIATELY ON SPAWN
  if (connectionTimeoutId) {
    clearTimeout(connectionTimeoutId);
    connectionTimeoutId = null;
  }
  
  clearBotTimeouts();  // Existing code
  // ... rest of spawn handler
```

#### Fix 2: Force-Reset Reconnecting State if Stuck (Around Line 2009)
```javascript
// FIX: Add a timeout to force-reset isReconnecting if stuck
function createBotWithTimeout() {
  if (isReconnecting) {
    addLog("[Bot] Already reconnecting, skipping...");
    return;
  }

  // NEW: Safety timeout to force-reset stuck reconnection state
  const reconnectTimeout = setTimeout(() => {
    if (isReconnecting) {
      addLog("[SAFETY] Force-resetting stuck isReconnecting flag...");
      isReconnecting = false;
    }
  }, 120000); // 2 minutes safety reset
```

#### Fix 3: Ensure Complete Listener Cleanup (Around Line 1194)
```javascript
if (bot) {
  clearAllIntervals();
  try {
    bot.removeAllListeners(); // Remove all listeners FIRST
    bot.end();                 // THEN end the connection
    
    // Add explicit listener cleanup for known events
    ['spawn', 'end', 'kicked', 'error', 'chat', 'messagestr', 'physicsTick', 'health'].forEach(event => {
      try { bot.removeAllListeners(event); } catch(_) {}
    });
  } catch (e) {
    addLog("[Cleanup] Error ending previous bot:", e.message);
  }
  bot = null;
}
```

#### Fix 4: Add Interval Cleanup on Disconnect (Around Line 1340)
```javascript
bot.on("end", (reason) => {
  addLog(`[Bot] Disconnected: ${reason || "Unknown reason"}`);
  botState.connected = false;
  
  // FIX: EXPLICITLY CLEAR ALL INTERVALS ON DISCONNECT
  clearAllIntervals();
  clearBotTimeouts();  // Clear both reconnect and connection timeouts
  
  spawnHandled = false;
  // ... rest of handler
```

## Testing

After applying fixes:
1. Start the bot and observe connection
2. Monitor CPU usage over 1-2 hours
3. Check logs for any "stuck" messages
4. Verify bot reconnects smoothly when server restarts

## Expected Results
- CPU usage remains <5% during normal operation
- Clean connections without hanging
- Proper reconnection if connection drops
- No memory leaks over 24+ hour uptimes
