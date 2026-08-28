function randomMs(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

function setupLeaveRejoin(bot, botState, scheduleReconnect) {
    // Timers
    let leaveTimer = null
    let jumpTimer = null
    let jumpOffTimer = null
    let reconnectTimer = null

    // State
    let stopped = false
    let isLeavingIntentionally = false
    let reconnectAttempts = 0
    let lastLogAt = 0

    function logThrottled(msg, minGapMs = 2000) {
        const now = Date.now()
        if (now - lastLogAt >= minGapMs) {
            lastLogAt = now
            console.log(msg)
        }
    }

    function cleanup() {
        stopped = true
        if (leaveTimer) clearTimeout(leaveTimer)
        if (jumpTimer) clearTimeout(jumpTimer)
        if (jumpOffTimer) clearTimeout(jumpOffTimer)
        if (reconnectTimer) clearTimeout(reconnectTimer)
        leaveTimer = jumpTimer = jumpOffTimer = reconnectTimer = null
    }

    function scheduleNextJump() {
        if (stopped || !bot.entity) return

        bot.setControlState('jump', true)
        jumpOffTimer = setTimeout(() => {
            bot.setControlState('jump', false)
        }, 300)

        // random jump 20s -> 5m
        const nextJump = randomMs(20000, 5 * 60 * 1000)
        jumpTimer = setTimeout(scheduleNextJump, nextJump)
    }

    function scheduleNextRejoin(reason = 'leave-cycle') {
        if (stopped) return

        // FAST RECONNECT: 2s -> 10s (User requested faster)
        let delay = randomMs(2000, 10000)

        // Slight backoff for repeated failures, but keep it snappy
        reconnectAttempts++
        if (reconnectAttempts > 3) {
            delay += 5000 // Add 5s if it's failing a lot
        }

        // Cap at 15s max
        delay = Math.min(delay, 15000)

        logThrottled(`[AFK] Will rejoin in ${Math.round(delay / 1000)}s (reason: ${reason}, attempt: ${reconnectAttempts})`)

        reconnectTimer = setTimeout(() => {
            if (stopped) return
            isLeavingIntentionally = false
            // Let index.js handle reconnection naturally
            scheduleReconnect()
        }, delay)
    }

    bot.once('spawn', () => {
        // reset attempt counter on successful connect
        reconnectAttempts = 0

        // clear any old timers
        cleanup()
        stopped = false
        isLeavingIntentionally = false

        // Stay connected: 1-5 minutes before a scheduled leave/rejoin cycle
        const stayTime = randomMs(60000, 300000)

        logThrottled(`[AFK] Will leave in ${Math.round(stayTime / 1000)} seconds`)

        scheduleNextJump()

        leaveTimer = setTimeout(() => {
            if (stopped) return
            logThrottled('[AFK] Leaving server (scheduled cycle)')
            
            // Mark that we're leaving intentionally so reconnect knows to rejoin
            isLeavingIntentionally = true
            
            cleanup()
            try {
                bot.quit()
            } catch (e) {
                // ignore if already closed
            }
        }, stayTime)
    })

    // When the connection ends, check if it was intentional
    // If so, schedule a rejoin. Otherwise let index.js handle auto-recovery.
    bot.on('end', () => {
        if (isLeavingIntentionally) {
            // This was our scheduled leave - schedule rejoin
            scheduleNextRejoin('leave-cycle')
            isLeavingIntentionally = false
        }
        cleanup()
    })

    bot.on('kicked', () => {
        cleanup()
    })

    bot.on('error', () => {
        cleanup()
    })
}

module.exports = setupLeaveRejoin
