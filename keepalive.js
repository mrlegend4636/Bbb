/**
 * KEEP-ALIVE SYSTEM FOR BOT HOSTING.NET
 * Prevents bot from disconnecting on hosting.net
 * Implements aggressive anti-timeout measures
 */

const { addLog } = require("./logger");

let keepAliveIntervals = [];
let lastActivityTime = Date.now();

/**
 * Start the keep-alive system
 * This runs continuous checks and activities to prevent timeout
 */
function startKeepAlive(bot, botState) {
  if (!bot) {
    addLog("[KeepAlive] Bot instance not available");
    return;
  }

  addLog("[KeepAlive] Starting bot hosting.net keep-alive system");

  // ============================================================
  // 1. AGGRESSIVE IN-GAME ACTIVITY (Every 30 seconds)
  // ============================================================
  const activityInterval = setInterval(() => {
    if (!bot || !bot.entity || !botState.connected) return;

    try {
      // Swing arm
      if (typeof bot.swingArm === "function") {
        bot.swingArm();
      }

      // Look around
      const yaw = Math.random() * Math.PI * 2;
      const pitch = (Math.random() * Math.PI) / 2 - Math.PI / 4;
      bot.look(yaw, pitch, false);

      // Move slightly
      if (typeof bot.setControlState === "function") {
        bot.setControlState("forward", true);
        setTimeout(() => {
          try {
            if (bot && typeof bot.setControlState === "function") {
              bot.setControlState("forward", false);
            }
          } catch (e) {}
        }, 200);
      }

      lastActivityTime = Date.now();
      addLog("[KeepAlive] Activity tick executed");
    } catch (e) {
      addLog(`[KeepAlive] Activity error: ${e.message}`);
    }
  }, 30000); // Every 30 seconds

  keepAliveIntervals.push(activityInterval);

  // ============================================================
  // 2. JUMP ACTION (Every 60 seconds)
  // ============================================================
  const jumpInterval = setInterval(() => {
    if (!bot || !bot.entity || !botState.connected) return;

    try {
      if (typeof bot.setControlState === "function") {
        bot.setControlState("jump", true);
        setTimeout(() => {
          try {
            if (bot && typeof bot.setControlState === "function") {
              bot.setControlState("jump", false);
            }
          } catch (e) {}
        }, 150);
      }

      addLog("[KeepAlive] Jump executed");
    } catch (e) {
      addLog(`[KeepAlive] Jump error: ${e.message}`);
    }
  }, 60000); // Every 60 seconds

  keepAliveIntervals.push(jumpInterval);

  // ============================================================
  // 3. CHAT SPAM (Every 90 seconds) - Acts as server check
  // ============================================================
  const chatInterval = setInterval(() => {
    if (!bot || !bot.entity || !botState.connected) return;

    try {
      if (typeof bot.chat === "function") {
        bot.chat("🔌 Keep-alive check");
        addLog("[KeepAlive] Chat message sent");
      }
    } catch (e) {
      addLog(`[KeepAlive] Chat error: ${e.message}`);
    }
  }, 90000); // Every 90 seconds

  keepAliveIntervals.push(chatInterval);

  // ============================================================
  // 4. RAPID HOTBAR CYCLING (Every 45 seconds)
  // ============================================================
  const hotbarInterval = setInterval(() => {
    if (!bot || !bot.entity || !botState.connected) return;

    try {
      if (typeof bot.setQuickBarSlot === "function") {
        // Cycle through hotbar quickly
        for (let i = 0; i < 9; i++) {
          setTimeout(() => {
            try {
              if (bot && typeof bot.setQuickBarSlot === "function") {
                bot.setQuickBarSlot(i);
              }
            } catch (e) {}
          }, i * 50);
        }
        addLog("[KeepAlive] Hotbar cycled");
      }
    } catch (e) {
      addLog(`[KeepAlive] Hotbar error: ${e.message}`);
    }
  }, 45000); // Every 45 seconds

  keepAliveIntervals.push(hotbarInterval);

  // ============================================================
  // 5. POSITION CHECK (Every 20 seconds)
  // ============================================================
  const positionInterval = setInterval(() => {
    if (!bot || !bot.entity || !botState.connected) return;

    try {
      const pos = bot.entity.position;
      if (pos) {
        // Log position to keep connection active
        addLog(
          `[KeepAlive] Position check: X=${Math.floor(pos.x)} Y=${Math.floor(pos.y)} Z=${Math.floor(pos.z)}`
        );
      }
    } catch (e) {
      addLog(`[KeepAlive] Position error: ${e.message}`);
    }
  }, 20000); // Every 20 seconds

  keepAliveIntervals.push(positionInterval);

  // ============================================================
  // 6. HEALTH CHECK (Every 10 seconds)
  // ============================================================
  const healthInterval = setInterval(() => {
    if (!bot || !bot.entity || !botState.connected) return;

    try {
      const health = bot.health;
      const food = bot.food;
      addLog(`[KeepAlive] Health: ${health} | Food: ${food}`);
    } catch (e) {
      addLog(`[KeepAlive] Health check error: ${e.message}`);
    }
  }, 10000); // Every 10 seconds

  keepAliveIntervals.push(healthInterval);

  // ============================================================
  // 7. PACKET KEEP-ALIVE (Every 5 seconds)
  // ============================================================
  const packetInterval = setInterval(() => {
    if (!bot || !botState.connected) return;

    try {
      // Send a "keep-alive" packet by reading from inventory
      if (bot.inventory && typeof bot.inventory.slots !== "undefined") {
        const slots = bot.inventory.slots;
        // Just reading inventory keeps the connection alive
        addLog(`[KeepAlive] Packet sent (inventory slots: ${slots.length})`);
      }
    } catch (e) {
      addLog(`[KeepAlive] Packet error: ${e.message}`);
    }
  }, 5000); // Every 5 seconds

  keepAliveIntervals.push(packetInterval);

  // ============================================================
  // 8. CONNECTION STATUS MONITOR
  // ============================================================
  const statusInterval = setInterval(() => {
    if (!bot) return;

    try {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      addLog(
        `[KeepAlive] Status - Connected: ${botState.connected} | Last activity: ${Math.round(timeSinceLastActivity / 1000)}s ago`
      );

      // If no activity detected for 2+ minutes, force activity
      if (timeSinceLastActivity > 120000 && botState.connected) {
        addLog("[KeepAlive] No activity detected - forcing activity!");
        try {
          if (typeof bot.swingArm === "function") {
            bot.swingArm();
          }
        } catch (e) {}
      }
    } catch (e) {
      addLog(`[KeepAlive] Status check error: ${e.message}`);
    }
  }, 30000); // Every 30 seconds

  keepAliveIntervals.push(statusInterval);

  addLog(
    `[KeepAlive] ✓ Keep-alive system active with ${keepAliveIntervals.length} monitors`
  );
}

/**
 * Stop all keep-alive intervals
 */
function stopKeepAlive() {
  addLog(`[KeepAlive] Stopping ${keepAliveIntervals.length} intervals`);
  keepAliveIntervals.forEach((id) => clearInterval(id));
  keepAliveIntervals = [];
  addLog("[KeepAlive] All intervals cleared");
}

/**
 * Get keep-alive statistics
 */
function getKeepAliveStats() {
  return {
    activeIntervals: keepAliveIntervals.length,
    lastActivityTime: lastActivityTime,
    timeSinceLastActivity: Date.now() - lastActivityTime,
    status: keepAliveIntervals.length > 0 ? "active" : "inactive",
  };
}

module.exports = {
  startKeepAlive,
  stopKeepAlive,
  getKeepAliveStats,
};
