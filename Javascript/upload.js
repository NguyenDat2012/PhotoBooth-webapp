
const CANVAS_WIDTH = 295;
const CANVAS_HEIGHT = 900;
const GAP = 178;
const START_TOP = 45;

const urlParams = new URLSearchParams(window.location.search);
const datatype = urlParams.get('data_type');
const cropW = datatype === 'portrait' ? 245 : 260;
const cropH = datatype === 'portrait' ? 180 : 179;

let canvas = document.getElementById('photoCanvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let fileInput = document.getElementById('fileInput');
let uploadButton = document.getElementById('uploadButton');
let overlayFrame = document.getElementById('overlayFrame');

let uploadedPhotos = []; 
// TUYỆT ĐỐI KHÔNG KHAI BÁO stickersInCanvas Ở ĐÂY NỮA
let isStickerMode = false;

let selectedPhotoIdxLocal = -1;
let isDraggingLocal = false;
let startX, startY;

document.addEventListener('DOMContentLoaded', () => {
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    loadFrameFromUrl();
    setupEventListeners();
});

// Hàm vẽ tổng hợp: Vẽ ảnh nền -> Khung -> Sticker (lấy từ biến chung)
function renderCanvasAll() {
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 1. Vẽ Ảnh nền
    uploadedPhotos.forEach((p) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(p.cropX, p.cropY, cropW, cropH);
        ctx.clip(); 
        ctx.drawImage(p.img, p.x, p.y, p.img.width * p.scale, p.img.height * p.scale);
        ctx.restore();
    });

    // 2. Vẽ Khung
    if (overlayFrame && overlayFrame.complete) {
        ctx.drawImage(overlayFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 3. Vẽ Sticker từ biến của DragandDrop.js
    // Kiểm tra xem biến đã tồn tại chưa để tránh lỗi undefined
    if (typeof stickersInCanvas !== 'undefined') {
        stickersInCanvas.forEach(s => {
            ctx.drawImage(s.img, s.x, s.y, s.w, s.h);
        });
    }
}

function setupEventListeners() {
    // Thu phóng ảnh (Zoom)
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const pos = getPos(e);
        const idx = Math.floor((pos.y - START_TOP) / GAP);
        if (uploadedPhotos[idx]) {
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            uploadedPhotos[idx].scale = Math.max(0.01, uploadedPhotos[idx].scale + delta);
            renderCanvasAll(); 
        }
    }, { passive: false });

    // Xử lý di chuyển ảnh nền
    canvas.onmousedown = canvas.ontouchstart = (e) => {
        const pos = getPos(e);
        
        // Chỉ cho phép di chuyển ảnh nếu KHÔNG chạm trúng sticker (Logic này nên phối hợp)
        // Ở đây ta ưu tiên logic di chuyển ảnh trước nếu chưa vào mode sticker
        const idx = Math.floor((pos.y - START_TOP) / GAP);
        if (uploadedPhotos[idx]) {
            selectedPhotoIdxLocal = idx;
            isDraggingLocal = true;
            startX = pos.x;
            startY = pos.y;
        }
    };

    window.onmousemove = window.ontouchmove = (e) => {
        if (!isDraggingLocal || selectedPhotoIdxLocal === -1) return;
        const pos = getPos(e);
        const p = uploadedPhotos[selectedPhotoIdxLocal];
        p.x += (pos.x - startX);
        p.y += (pos.y - startY);
        startX = pos.x;
        startY = pos.y;
        renderCanvasAll();
    };

    window.onmouseup = window.ontouchend = () => {
        isDraggingLocal = false;
        selectedPhotoIdxLocal = -1;
    };

    if (uploadButton) {
        uploadButton.onclick = () => { if (uploadedPhotos.length < 4) fileInput.click(); };
    }
    fileInput.onchange = handleFileUpload;

    // Nút Reset (Dùng chung biến stickersInCanvas)
    document.getElementById('ResetBtn').onclick = () => {
        if (typeof stickersInCanvas !== 'undefined') {
            stickersInCanvas.length = 0; // Xóa sạch mảng mà không khai báo lại
            renderCanvasAll();
        }
    };
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const idx = uploadedPhotos.length;
            const sc = Math.max(cropW / img.width, cropH / img.height);
            uploadedPhotos.push({
                img, scale: sc,
                x: (CANVAS_WIDTH - cropW) / 2,
                y: START_TOP + (idx * GAP),
                cropX: (CANVAS_WIDTH - cropW) / 2,
                cropY: START_TOP + (idx * GAP)
            });
            renderCanvasAll();
            if (uploadedPhotos.length === 4) finalizeToEdit();
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
}

function finalizeToEdit() {
    isStickerMode = true;
    renderCanvasAll();
    document.getElementById('camera-section').style.display = 'none';
    document.getElementById('edit-section').style.display = 'flex';
    document.getElementById('editcanvas').appendChild(canvas);

    // Kích hoạt hàm khởi tạo Sticker của DragandDrop.js
    if (typeof startEditingSystem === 'function') {
        startEditingSystem();
    }
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (cx - rect.left) * (CANVAS_WIDTH / rect.width),
        y: (cy - rect.top) * (CANVAS_HEIGHT / rect.height)
    };
}

function loadFrameFromUrl() {
    const encodedUrl = urlParams.get('image_url');
    if (encodedUrl && overlayFrame) {
        overlayFrame.crossOrigin = "anonymous";
        overlayFrame.src = decodeURIComponent(encodedUrl);
        overlayFrame.onload = () => renderCanvasAll();
    }
}