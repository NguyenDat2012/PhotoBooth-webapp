/* ================== PARAM FROM URL ================== */
const urlParams = new URLSearchParams(window.location.search);
const datatype = urlParams.get('data_type');
const encodedUrl = urlParams.get('image_url');

document.body.classList.add(datatype);

/* ================== CANVAS & CONTEXT ================== */
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const overlayFrame = document.getElementById('overlayFrame');
const cameraWrapper = document.getElementById('camera-wrapper');

/* ================== GLOBAL CONFIG (GIỐNG camera.js) ================== */
let CANVAS_WIDTH, CANVAS_HEIGHT;
let camera_width, camera_height;
let gap = 0, gapX = 0, gapY = 0;
const totalFrames = 4;

if (datatype === 'portrait') {
    CANVAS_WIDTH = 295;
    CANVAS_HEIGHT = 900;
    camera_width = 245;
    camera_height = 182;
    gap = 180;

    cameraWrapper.style.width = CANVAS_WIDTH + 'px';
    cameraWrapper.style.height = CANVAS_HEIGHT + 'px';
} else {
    CANVAS_WIDTH = 880;
    CANVAS_HEIGHT = 800;
    camera_width = 400;
    camera_height = 279;
    gapX = 420;
    gapY = 280;

    cameraWrapper.style.width = CANVAS_WIDTH + 'px';
    cameraWrapper.style.height = 750 + 'px';
}

/* ================== CANVAS INIT ================== */
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

/* ================== CROP SIZE ================== */
const cropW = camera_width;
const cropH = camera_height;

/* ================== DATA ================== */
let uploadedPhotos = [];
let selectedIdx = -1;
let dragging = false;
let startX = 0, startY = 0;

/* ================== LOAD FRAME ================== */
function loadFrameFromUrl() {
    if (!encodedUrl) return;
    overlayFrame.crossOrigin = "anonymous";
    overlayFrame.style.width = CANVAS_WIDTH + 'px';
    overlayFrame.style.height = CANVAS_HEIGHT + 'px';
    overlayFrame.src = decodeURIComponent(encodedUrl);
    overlayFrame.onload = renderCanvasAll;
}
loadFrameFromUrl();

/* ================== CORE DRAW ================== */
function renderCanvasAll() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. draw photos
    uploadedPhotos.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(p.cropX, p.cropY, cropW, cropH);
        ctx.clip();

        ctx.drawImage(
            p.img,
            p.x,
            p.y,
            p.img.width * p.scale,
            p.img.height * p.scale
        );
        ctx.restore();
    });

    // 2. draw frame
    if (overlayFrame.complete) {
        ctx.drawImage(overlayFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 3. draw stickers
    if (typeof stickersInCanvas !== 'undefined') {
        stickersInCanvas.forEach(s => {
            ctx.drawImage(s.img, s.x, s.y, s.w, s.h);
        });
    }
}

/* ================== POSITION LOGIC (GIỐNG camera.js) ================== */
function getFramePosition(index) {
    if (datatype === 'portrait') {
        return {
            x: (CANVAS_WIDTH - cropW) / 2,
            y: 40 + index * gap
        };
    }

    // square
    if (index === 0) return { x: 25, y: 40 };
    if (index === 1) return { x: 25 + gapX, y: 40 };
    if (index === 2) return { x: 25 + gapX, y: 40 + gapY };
    if (index === 3) return { x: 25, y: 40 + gapY };
}

/* ================== UPLOAD ================== */
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');

uploadButton.onclick = () => {
    if (uploadedPhotos.length < totalFrames) fileInput.click();
};

fileInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const idx = uploadedPhotos.length;
            const pos = getFramePosition(idx);

            const scale = Math.max(
                cropW / img.width,
                cropH / img.height
            );

            uploadedPhotos.push({
                img,
                scale,
                x: pos.x,
                y: pos.y,
                cropX: pos.x,
                cropY: pos.y
            });

            renderCanvasAll();
            if(uploadedPhotos.length == totalFrames){
                uploadButton.style.display = 'none';
                const completeButton = document.getElementById('completeButton');
                completeButton.style.display = 'block';
                completeButton.onclick = finalizeToEdit;
            }
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
};

/* ================== DRAG + ZOOM ================== */
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', startDrag);

function startDrag(e) {
    const pos = getPos(e);
    uploadedPhotos.forEach((p, i) => {
        if (
            pos.x >= p.cropX &&
            pos.x <= p.cropX + cropW &&
            pos.y >= p.cropY &&
            pos.y <= p.cropY + cropH
        ) {
            selectedIdx = i;
            dragging = true;
            startX = pos.x;
            startY = pos.y;
        }
    });
}

window.addEventListener('mousemove', moveDrag);
window.addEventListener('touchmove', moveDrag);

function moveDrag(e) {
    if (!dragging || selectedIdx === -1) return;
    const pos = getPos(e);
    const p = uploadedPhotos[selectedIdx];

    p.x += pos.x - startX;
    p.y += pos.y - startY;

    startX = pos.x;
    startY = pos.y;
    renderCanvasAll();
}

window.addEventListener('mouseup', stopDrag);
window.addEventListener('touchend', stopDrag);

function stopDrag() {
    dragging = false;
    selectedIdx = -1;
}
function zoomHandler(e) {
    e.preventDefault();
    const pos = getPos(e);

    uploadedPhotos.forEach(p => {
        if (
            pos.x >= p.cropX &&
            pos.x <= p.cropX + cropW &&
            pos.y >= p.cropY &&
            pos.y <= p.cropY + cropH
        ) {
            p.scale += e.deltaY > 0 ? -0.05 : 0.05;
            p.scale = Math.max(0.05, p.scale);
        }
    });

    renderCanvasAll();
}
canvas.addEventListener('wheel', zoomHandler,{ passive: false });


/* ================== EDIT ================== */
function finalizeToEdit() {
    document.getElementById('camera-section').style.display = 'none';
    document.getElementById('edit-section').style.display = 'flex';
    document.getElementById('editcanvas').appendChild(canvas);
    canvas.removeEventListener('mousedown', startDrag);
    canvas.removeEventListener('touchstart', startDrag);

    window.removeEventListener('mousemove', moveDrag);
    window.removeEventListener('touchmove', moveDrag);

    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchend', stopDrag);

    canvas.removeEventListener('wheel', zoomHandler);

    if (typeof startEditingSystem === 'function') {
        startEditingSystem();
    }
}

/* ================== UTIL ================== */
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (cx - rect.left) * (CANVAS_WIDTH / rect.width),
        y: (cy - rect.top) * (CANVAS_HEIGHT / rect.height)
    };
}

/* ================== RESET ================== */
document.getElementById('ResetBtn').onclick = () => {
    if (typeof stickersInCanvas !== 'undefined') {
        stickersInCanvas.length = 0;
    }
    renderCanvasAll();
};
