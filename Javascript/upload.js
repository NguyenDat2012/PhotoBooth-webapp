const CANVAS_WIDTH = 295;
const CANVAS_HEIGHT = 900;
const GAP = 178;

// Lấy thông số từ URL
const urlParams = new URLSearchParams(window.location.search);
const datatype = urlParams.get('data_type');

// Thiết lập vùng hiển thị ảnh dựa trên loại khung
const cropW = datatype === 'portrait' ? 245 : 260;
const cropH = datatype === 'portrait' ? 180 : 179;

let canvas, ctx, fileInput, uploadButton, overlayFrame;
let uploadedPhotos = []; 
let selectedIdx = -1;
let isMoving = false;
let startX, startY;

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('photoCanvas');
    ctx = canvas.getContext('2d');
    fileInput = document.getElementById('fileInput');
    uploadButton = document.getElementById('uploadButton');
    overlayFrame = document.getElementById('overlayFrame');

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    loadFrameFromUrl();
    setupEventListeners();
});

function loadFrameFromUrl() {
    const encodedUrl = urlParams.get('image_url');
    if (encodedUrl && overlayFrame) {
        overlayFrame.crossOrigin = "anonymous"; 
        overlayFrame.src = decodeURIComponent(encodedUrl);
        overlayFrame.onload = () => drawAll();
    }
}

function setupEventListeners() {
    uploadButton.addEventListener('click', () => {
        if (uploadedPhotos.length < 4) fileInput.click();
    });

    fileInput.addEventListener('change', handleFileUpload);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const idx = uploadedPhotos.length;
            const scaleW = cropW / img.width;
            const scaleH = cropH / img.height;
            const initialScale = Math.max(scaleW, scaleH);

            uploadedPhotos.push({
                img: img,
                x: (CANVAS_WIDTH - cropW) / 2,
                y: 45 + (idx * GAP),
                scale: initialScale,
                cropX: (CANVAS_WIDTH - cropW) / 2,
                cropY: 45 + (idx * GAP)
            });
            drawAll();
            
            // Khi đủ 4 ảnh, tự động chuyển sang chế độ Sticker giống Camera
            if (uploadedPhotos.length === 4) {
                setTimeout(finalizeUpload, 500);
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.value = ""; 
}

function drawAll() {
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uploadedPhotos.forEach((p) => {
        ctx.save();
        // Cắt vùng hiển thị ảnh (Clip)
        ctx.beginPath();
        ctx.rect(p.cropX, p.cropY, cropW, cropH);
        ctx.clip();

        ctx.drawImage(p.img, p.x, p.y, p.img.width * p.scale, p.img.height * p.scale);
        ctx.restore();
    });

    // Vẽ khung lên trên cùng
    if (overlayFrame && overlayFrame.complete && overlayFrame.src) {
        ctx.drawImage(overlayFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

/**
 * HÀM QUAN TRỌNG: Giống hệt camera.js
 * Chụp lại toàn bộ canvas hiện tại để làm nền tĩnh cho DragandDrop.js
 */
function finalizeUpload() {
    // 1. Vẽ bản cuối cùng thật chuẩn
    drawAll();
    document.getElementById('camera-section').style.display = 'none';
    document.getElementById('edit-section').style.display = 'block';
    const editSection = document.getElementById('edit-section');
    editSection.appendChild(canvas);
    if (typeof startEditingSystem === 'function') {
        startEditingSystem();
    }
}

// Logic tương tác di chuyển/thu phóng
function handleWheel(e) {
    e.preventDefault();
    const pos = getPos(e);
    const idx = Math.floor((pos.y - 45) / GAP);
    if (uploadedPhotos[idx]) {
        const delta = e.deltaY > 0 ? -0.02 : 0.02;
        uploadedPhotos[idx].scale = Math.max(0.01, uploadedPhotos[idx].scale + delta);
        drawAll();
    }
}
function handleMouseDown(e) {
    const pos = getPos(e);
    const idx = Math.floor((pos.y - 45) / GAP);
    if (uploadedPhotos[idx]) {
        selectedIdx = idx;
        isMoving = true;
        startX = pos.x;
        startY = pos.y;
    }
}
function handleMouseMove(e) {
    if (!isMoving || selectedIdx === -1) return;
    const pos = getPos(e);
    uploadedPhotos[selectedIdx].x += (pos.x - startX);
    uploadedPhotos[selectedIdx].y += (pos.y - startY);
    startX = pos.x;
    startY = pos.y;
    drawAll();
}

function handleMouseUp() { isMoving = false; selectedIdx = -1; }

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}