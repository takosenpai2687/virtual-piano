// Continued from "./constants.js"
// Global Vars
// ! DEBUG TEXT
var DEBUG_TEXT = "← CLICK TO AUTOPLAY";
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var cvWidth, cvHeight;
// Change on Resize
var WHITE_KEY_WIDTH, BLACK_KEY_WIDTH;
var isMouseDown = false;
var mousePressedKey = null;
var sounds = [];
var bubbles = [];
var currentMidiKeys = [];
var lastTime, startTime;
var pausedTotal = 0;
var audioLoaded = false;
var sustain = true;
var midifileCopy = [];
// Rendering info for piano keys
var keyboardRects = [
    {
        // ! This preview element will be removed
        index: Number,
        isBlack: Boolean,
        wkIndex: Number | NaN,
        bkIndex: Number | NaN,
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        fillStyle: String,
        strokeStyle: String,
        lineWidth: Number,
        text: String,
    },
];
var VIDEO_URL = "res/videos/Unravel.mp4";
var video;
var paused = true;
var playButton;
var elaspedPlayTime;

/**
 * Main init
 */
async function init() {
    initVariables();
    preprocessMidifle();
    onResize();
    initKeyboard();
    await initSounds();
    initBubbles();
    await initVideo();
    bindEvents();
    update(); // Render Loop
}

function reset() {
    midifile = midifileCopy;
    init();
}

function initVariables() {
    while (ctx == null || canvas == null) {
        canvas = document.getElementById("canvas");
        ctx = canvas.getContext("2d");
    }
    isMouseDown = false;
    mousePressedKey = null;
    bubbles = [];
    currentMidiKeys = [];
    (lastTime = undefined), (startTime = undefined);
    pausedTotal = 0;
    keyboardRects = [];
    // Init playbutton
    playButton = document.querySelector("div.play-btn");
    playButton.innerHTML = paused
        ? `<i class="fas fa-play"></i>`
        : `<i class="fas fa-pause"></i>`;
    elaspedPlayTime = 0;
}

/**
 * Render Loop
 */
function update() {
    requestAnimationFrame(update);
    clearBackground();
    // Update volumes
    sounds.forEach((s) => {
        let v = s.volume;
        v -= sustain ? 0.15 * VOLUME_DECAY_SPEED : VOLUME_DECAY_SPEED;
        if (v < 0) {
            v = 0;
        }
        s.volume = v;
    });
    // Draw Bubbles
    drawBubbles();
    if (!paused && bubbles.length == 0) {
        onClickPlayBtn();
    }
    if (!paused) {
        let dt;
        if (!lastTime) {
            startTime = Date.now();
            lastTime = startTime;
            dt = 0;
        } else {
            dt = Date.now() - lastTime;
            if (dt > 250) {
                pausedTotal += dt;
                dt = 5;
            }
            elaspedPlayTime += dt;
            if (
                video &&
                Math.abs(video.currentTime * 1000 - elaspedPlayTime) > 200
            ) {
                video.currentTime = elaspedPlayTime / 1000.0;
            }
            lastTime = Date.now();
        }
        updateBubbles(dt);
        // ! GOD MODE
        if (GOD_MODE && midifile.length > 0) {
            godPlaysMusic(Date.now() - startTime - pausedTotal);
        }
    }
    // Draw White Keys
    keyboardRects.forEach((r) => {
        if (!r.isBlack) drawKey(r);
    });
    // Draw Black Keys
    keyboardRects.forEach((r) => {
        if (r.isBlack) drawKey(r);
    });
    // ! Draw DEBUG TEXT
    if (DEBUG) {
        drawDebugMessage();
    }
}

/**
 * Reacts to Window Resize Event
 */
function onResize() {
    // Reset Canvas Dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cvWidth = canvas.width;
    cvHeight = canvas.height;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    // Reset Keyboard variables
    WHITE_KEY_WIDTH = window.innerWidth / N_WHITE_KEYS;
    BLACK_KEY_WIDTH = WHITE_KEY_WIDTH * 0.58;
    WHITE_KEY_HEIGHT = cvHeight * 0.27;
    BLACK_KEY_HEIGHT = WHITE_KEY_HEIGHT * 0.618;
    WHITE_KEY_TEXT_MARGIN_TOP = WHITE_KEY_HEIGHT * 0.28;
    BLACK_KEY_TEXT_MARGIN_TOP = BLACK_KEY_HEIGHT * 0.32;
    // Reset keyboard dimensions
    initKeyboard();
}

/**
 * Clear Background with BG_COLOR
 */
function clearBackground() {
    ctx.clearRect(0, 0, cvWidth, cvHeight);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, cvWidth, cvHeight);
}

/**
 * Initialise the Keyboard rendering info
 */
function initKeyboard() {
    keyboardRects = [];
    // Add White Keys
    for (let i = 0; i < N_WHITE_KEYS; i++) {
        keyboardRects.push({
            isBlack: false,
            wkIndex: i,
            bkIndex: NaN,
            x: i * WHITE_KEY_WIDTH,
            y: cvHeight - WHITE_KEY_HEIGHT,
            width: WHITE_KEY_WIDTH,
            height: WHITE_KEY_HEIGHT,
            fillStyle: WHITE,
            strokeStyle: BLACK,
            lineWidth: 1.5,
            text: null,
        });
    }
    // Add Black Keys
    for (let i = 0; i < 5; i++) {
        let offsetX = (i * 7 + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2; // PosX of C# top-left corner
        let bKeysTmp = [];
        for (let j = 0; j < 5; j++) {
            bKeysTmp.push({
                isBlack: true,
                wkIndex: NaN,
                bkIndex: i * 5 + j,
                x: NaN,
                y: cvHeight - WHITE_KEY_HEIGHT,
                width: BLACK_KEY_WIDTH,
                height: BLACK_KEY_HEIGHT,
                fillStyle: BLACK,
                strokeStyle: BLACK,
                lineWidth: 1.0,
                text: null,
            });
        }
        bKeysTmp[0].x = offsetX; // C#
        bKeysTmp[1].x = offsetX + WHITE_KEY_WIDTH; // D#
        bKeysTmp[2].x = offsetX + 3 * WHITE_KEY_WIDTH; // F#
        bKeysTmp[3].x = offsetX + 4 * WHITE_KEY_WIDTH; // G#
        bKeysTmp[4].x = offsetX + 5 * WHITE_KEY_WIDTH; // A#
        keyboardRects = [...keyboardRects, ...bKeysTmp]; // Add black keys to da keys
    }
    // Sort by x-coord i.e. note
    keyboardRects.sort((a, b) => {
        return a.x - b.x;
    });
    keyboardRects.forEach((r, i) => {
        r.index = i;
    });
    // Init text
    for (let i = 0; i < keyboardRects.length; i++) {
        let note = midiKeyToNote[i + 36];
        keyboardRects[i].text = noteToKeyboard[note.slice(0, 2)].toUpperCase();
    }
    // Init currentMidiKeys
    currentMidiKeys = [];
}

function removeShadow() {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

/**
 * Draw a single piano key
 * @param {keyboardRect} r
 */
function drawKey(r) {
    // Check if is keydown
    let isKeyDown = false;
    currentMidiKeys.forEach((mk) => {
        if (mk == r.index + 36) {
            isKeyDown = true;
        }
    });
    // Draw key
    if (isKeyDown) {
        // SHADOW
        ctx.fillStyle = KEYDOWN_COLOR;
        ctx.shadowColor = KEYDOWN_SHADOW_COLOR;
        ctx.shadowBlur = SHADOW_BLUR * 6;
        ctx.strokeStyle = KEYDOWN_COLOR;
        ctx.shadowOffsetY = -80;
    } else {
        ctx.fillStyle = r.fillStyle;
        ctx.strokeStyle = r.strokeStyle;
    }
    ctx.lineWidth = r.lineWidth;
    // Draw shadow for blackkey
    if (r.isBlack && !isKeyDown) {
        ctx.shadowBlur = 3;
        ctx.shadowColor = "#888";
        ctx.shadowOffsetX = -5;
        ctx.shadowOffsetY = 5;
    } else if (!isKeyDown) {
        ctx.shadowBlur = 3;
        ctx.shadowColor = "#888";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    if (r.isBlack) {
        drawRoundRect(ctx, r.x, r.y, r.width, r.height, 5, true, true);
    } else {
        ctx.fillRect(r.x, r.y, r.width, r.height);
        ctx.strokeRect(r.x, r.y, r.width, r.height);
    }

    removeShadow();
    // Render text
    ctx.font = KB_FONT;
    const xOffset = ctx.measureText(r.text).width / 2;
    if (r.isBlack) {
        ctx.fillStyle = WHITE;
        let x = r.x + BLACK_KEY_WIDTH / 2 - xOffset;
        let y = r.y + BLACK_KEY_TEXT_MARGIN_TOP;
        ctx.fillText(r.text, x, y);
        y += KB_FONT_SIZE * 1.3;
        ctx.fillText("↑", x, y);
    } else {
        ctx.fillStyle = isKeyDown ? WHITE : BLACK;
        const x = r.x + WHITE_KEY_WIDTH / 2 - xOffset;
        const y = r.y + WHITE_KEY_TEXT_MARGIN_TOP;
        ctx.fillText(r.text, x, y);
    }
}

function drawDebugMessage() {
    ctx.fillStyle = WHITE;
    ctx.font = "80px helvetica";
    ctx.fillText(
        DEBUG_TEXT,
        cvWidth / 2 - ctx.measureText(DEBUG_TEXT).width / 2,
        cvHeight / 2
    );
}

function resolveKeyByEvent(e) {
    // Mouse Event
    if (e.x !== undefined && e.y != undefined) {
        // find white key index
        let { x, y } = e;
        wkIndex = Math.floor(x / WHITE_KEY_WIDTH);
        let keysToCheck = [];
        if (wkIndex == 0) {
            keysToCheck = [0, 1];
        } else if (wkIndex == 35) {
            keysToCheck = [60];
        } else {
            const realIndex = keyboardRects.findIndex(
                (e) => e.wkIndex == wkIndex
            );
            keysToCheck = [realIndex, realIndex - 1, realIndex + 1];
        }
        let res = undefined;
        keysToCheck.forEach((k) => {
            let within = isWithinRect({ x, y }, keyboardRects[k]);
            if (within) {
                res = k;
            }
        });
        return res + 36;
    }
    // Keyboard Event
    if (e.x == undefined && e.y == undefined && e.key != undefined) {
        if (Object.values(noteToKeyboard).indexOf(e.key.toLowerCase()) < 0)
            return undefined;
        let isShift = e.shiftKey;
        let rawNote = Object.keys(noteToKeyboard).find(
            (key) => noteToKeyboard[key] == e.key.toLowerCase()
        );
        let note = isShift ? `${rawNote}#` : rawNote;
        let res = Number(
            Object.keys(midiKeyToNote).find((key) => midiKeyToNote[key] == note)
        );
        return res;
    }
    return undefined;
}

function isWithinRect(pos, rect) {
    return (
        pos.x >= rect.x &&
        pos.x < rect.x + rect.width &&
        pos.y >= rect.y &&
        pos.y < rect.y + rect.height
    );
}

function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === "undefined") {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    if (typeof radius === "number") {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius.br,
        y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
    removeShadow();
}

function onMouseDown(e) {
    let midiKey = resolveKeyByEvent(e);
    if (!midiKey) return;
    isMouseDown = true;
    // Currently holding keyboard keys && mousedown on one of the pressed keys
    if (currentMidiKeys.length > 0 && currentMidiKeys.indexOf(midiKey) > -1) {
        playSound(midiKey, 127);
        mousePressedKey = midiKey;
        return;
    }
    currentMidiKeys.push(midiKey);
    mousePressedKey = midiKey;
    playSound(midiKey, 127);
}

function onMouseMove(e) {
    if (!isMouseDown) return;
    let midiKey = resolveKeyByEvent(e);
    if (!midiKey) return;
    // 1. Update mousePressedKey iff HAS mousepressedKey AND  midikey valid
    if (mousePressedKey != null && midiKey && midiKey != mousePressedKey) {
        currentMidiKeys = currentMidiKeys.filter((e) => e != mousePressedKey);
        mousePressedKey = midiKey;
        currentMidiKeys.push(midiKey);
        currentMidiKeys.forEach((mk) => playSound(mk, 127));
    }
}

function onMouseUp(e) {
    let midiKey = resolveKeyByEvent(e);
    if (mousePressedKey != null) {
        currentMidiKeys = currentMidiKeys.filter((e) => e != mousePressedKey);
        mousePressedKey = null;
    }
}

function onKeyDown(e) {
    if (e && e.key == " ") {
        onPlayButtonMouseOver();
    }
    let midiKey = resolveKeyByEvent(e);
    if (!midiKey) return;
    if (currentMidiKeys.indexOf(midiKey) == -1) {
        currentMidiKeys.push(midiKey);
        if (e.vel) {
            playSound(midiKey, e.vel);
        } else {
            playSound(midiKey, 127);
        }
    }
}

function onKeyUp(e) {
    if (!e.key) return;
    // Press space bar to play/pause
    if (e.key == " ") {
        onClickPlayBtn();
        onPlayButtonMouseOut();
        return;
    }
    let midiKeyReleased = resolveKeyByEvent({ key: e.key.toLowerCase() });
    if (!midiKeyReleased) return;
    // Release White Key => Reset Volume
    if (currentMidiKeys.indexOf(midiKeyReleased) > -1) {
        sounds[midiKeyReleased - 36].volume = 1.0;
    }
    // Release Black Key => Reset Volume
    if (
        midiKeyReleased < 60 &&
        currentMidiKeys.indexOf(midiKeyReleased + 1) > -1
    ) {
        sounds[midiKeyReleased + 1 - 36].volume = 1.0;
    }
    currentMidiKeys = currentMidiKeys.filter((cmk) => {
        if (cmk - 36 < 60) {
            return cmk != midiKeyReleased && cmk - 1 != midiKeyReleased;
        }
        return cmk != midiKeyReleased;
    });
}

function preprocessMidifle() {
    let maxVel = 0,
        minVel = 127;
    midifile.forEach((p, i) => {
        if (p.Vel < minVel) {
            minVel = p.Vel;
        }
        if (p.Vel > maxVel) {
            maxVel = p.Vel;
        }
    });
    for (let i = 0; i < midifile.length; i++) {
        let v = midifile[i].Vel;
        let ratio = (v - minVel) / (maxVel - minVel);
        midifile[i].Vel = MIN_VEL + ratio * (MAX_VEL - MIN_VEL);
    }
    midifileCopy = structuredClone(midifile);
}

function initSounds() {
    if (audioLoaded) return;
    const noteNames = Object.values(midiKeyToNote);
    for (let m = 36; m <= 96; m++) {
        let audio = new Audio(
            `res/sounds/${noteNames[m - 36].replace("#", "S")}.mp3`
        );
        audio.autoplay = false;
        audio.crossOrigin = "anonymous";
        audio.load();
        sounds.push(audio);
    }
}

function playSound(midiKey, vel) {
    sounds[midiKey - 36].currentTime = 0;
    try {
        sounds[midiKey - 36].volume = vel / 127.0;
        sounds[midiKey - 36].play();
    } catch (err) {
        console.log(err);
    }
}

function initVideo() {
    // document.querySelector("video").src = VIDEO_URL;
    video = document.querySelector("video");
    video.onpause = () => (video.style.display = "none");
    video.onplay = () => (video.style.display = "block");
    if (!video) return;
    if (!paused) {
        video.play();
    } else {
        video.pause();
    }
    video.muted = true;
}

function initBubbles() {
    midifile = midifile.filter((mdf) => mdf.Key >= 36 && mdf.Key <= 96);
    bubbles = [];
    midifile.forEach((midi, i) => {
        const { TimeMs: timeMs, Key: midiKey, DurationMs: durationMs } = midi;
        let keyboardRect = keyboardRects[midiKey - 36];
        let width = WHITE_KEY_WIDTH - BLACK_KEY_WIDTH;
        let height = durationMs;
        let x = keyboardRect.x + keyboardRect.width / 2 - width / 2;
        let y = -(timeMs + durationMs);
        bubbles.push({
            x,
            y,
            width,
            height,
            color: COLOR_WHEEL[midiKey % COLOR_WHEEL.length],
            keyboardRectIndex: midiKey - 36,
        });
    });
    bubbles = bubbles.sort((a, b) => b.y - a.y);
    midifile = midifile.sort((a, b) => a.TimeMs - b.TimeMs);
}

function drawBubbles() {
    bubbles.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = SHADOW_BLUR;
        drawRoundRect(
            ctx,
            b.x,
            b.y,
            b.width,
            b.height,
            b.width / 2,
            true,
            false
        );
    });
}

function updateBubbles(dt) {
    bubbles.forEach((b) => {
        b.width = WHITE_KEY_WIDTH - BLACK_KEY_WIDTH;
        let keyboardRect = keyboardRects[b.keyboardRectIndex];
        b.x = keyboardRect.x + keyboardRect.width / 2 - b.width / 2;
        b.y += dt;
    });
    bubbles = bubbles.filter((b) => b.y < cvHeight - WHITE_KEY_HEIGHT);
}

function godPlaysMusic(timeElapsedMs) {
    if (timeElapsedMs - midifile[0].TimeMs > cvHeight - WHITE_KEY_HEIGHT) {
        // Press key
        let midiKey = midifile[0].Key;
        let durationMs = midifile[0].DurationMs;
        let note = midiKeyToNote[midiKey];
        let vel = midifile[0].Vel || 127;
        if (!note) {
            // Remove item from midifile
            midifile.shift();
            return;
        }
        let eKey = noteToKeyboard[note.slice(0, 2)];
        let isShift = note[2] == "#" || note.length == 3;
        autoPressKey({ key: eKey, shiftKey: isShift, vel });
        // Remove item from midifile
        midifile.shift();

        // Settimeout to release key
        setTimeout(() => {
            autoReleaseKey({ key: eKey });
        }, durationMs - 10);
    }
}

function autoPressKey(e) {
    onKeyDown(e);
    if (e.shiftKey) {
        onKeyUp({ eKey: "Shift" });
    }
}

function autoReleaseKey(e) {
    onKeyUp(e);
}

function onClickPlayBtn(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (paused) {
        // Reset
        if (midifile.length == 0) {
            reset();
        }
        // Unpause and play
        DEBUG_TEXT = "";
        paused = false;
        video && video.play();
        playButton.className = "play-btn playing";
        playButton.innerHTML = `<i class="fas fa-pause"></i>`;
    } else {
        // Pause and stop video
        DEBUG_TEXT = "← CLICK TO AUTOPLAY";
        paused = true;
        video && video.pause();
        playButton.className = "play-btn paused";
        playButton.innerHTML = `<i class="fas fa-play"></i>`;
    }
}

function throttle(callback, delay) {
    let prev = 0;
    return (...args) => {
        let now = Date.now();
        if (now - prev > delay) {
            prev = now;
            return callback(...args);
        }
    };
}

function onPlayButtonMouseOver() {
    playButton.className = "play-btn hover";
}

function onPlayButtonMouseOut() {
    playButton.className = "play-btn";
}

// Bind events
function bindEvents() {
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    window.onkeydown = onKeyDown;
    window.onkeyup = onKeyUp;
    window.ontouchstart = onMouseDown;
    window.ontouchmove = onMouseMove;
    window.ontouchend = onMouseUp;
    playButton.onclick = throttle(onClickPlayBtn, 200);
    playButton.onmouseover = onPlayButtonMouseOver;
    playButton.onmouseout = onPlayButtonMouseOut;
}

window.onload = init;
window.onresize = onResize;
window.oncontextmenu = (e) => {
    e.preventDefault();
};
