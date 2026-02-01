let stickersInCanvas = [];
let selectedSticker = null;
let isDragging = false;
let offsetX, offsetY;
let tempBackground = null;

const editCanvas = document.getElementById('photoCanvas');
const editCtx = editCanvas ? editCanvas.getContext('2d') : null;

function startEditingSystem() {
    if (!editCanvas || !editCtx) return;

    const dataURL = editCanvas.toDataURL('image/png');
    tempBackground = new Image();
    tempBackground.src = dataURL;
    tempBackground.onload = () => renderCanvas();

    document.querySelectorAll('.sticker-item').forEach(icon => {
        icon.onclick = function() {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = "Sticker/" + this.src.split('/').pop();
            img.onload = () => {
                stickersInCanvas.push({ img, x: 110, y: 400, w: 70, h: 70 });
                renderCanvas();
            };
        };
    });
    setupInteraction();
}

function renderCanvas() {
    editCtx.clearRect(0, 0, editCanvas.width, editCanvas.height);
    if (tempBackground) editCtx.drawImage(tempBackground, 0, 0, editCanvas.width, editCanvas.height);
    stickersInCanvas.forEach(s => editCtx.drawImage(s.img, s.x, s.y, s.w, s.h));
}

function setupInteraction() {
    const getPos = (e) => {
        const rect = editCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        // Tỉ lệ chuẩn hóa tọa độ khi có transform: scale()
        return {
            x: (clientX - rect.left) * (295 / rect.width),
            y: (clientY - rect.top) * (900 / rect.height)
        };
    };

    const handleStart = (e) => {
        const pos = getPos(e);
        for (let i = stickersInCanvas.length - 1; i >= 0; i--) {
            const s = stickersInCanvas[i];
            if (pos.x >= s.x && pos.x <= s.x + s.w && pos.y >= s.y && pos.y <= s.y + s.h) {
                selectedSticker = s;
                isDragging = true;
                offsetX = pos.x - s.x; offsetY = pos.y - s.y;
                stickersInCanvas.push(stickersInCanvas.splice(i, 1)[0]);
                return;
            }
        }
    };

    const handleMove = (e) => {
        if (!isDragging || !selectedSticker) return;
        const pos = getPos(e);
        selectedSticker.x = pos.x - offsetX;
        selectedSticker.y = pos.y - offsetY;
        renderCanvas();
    };

    editCanvas.onmousedown = editCanvas.ontouchstart = handleStart;
    window.onmousemove = window.ontouchmove = handleMove;
    window.onmouseup = window.ontouchend = () => { isDragging = false; selectedSticker = null; };
}

document.getElementById('printBtn').onclick = () => {
    const link = document.createElement('a');
    link.href = editCanvas.toDataURL();
    link.download = 'Tet_2026.png';
    link.click();
};

document.getElementById('ResetBtn').onclick = () => {
    stickersInCanvas = [];
    renderCanvas();
};

document.getElementById('printBtn').onclick = () => {
    const link = document.createElement('a');
    link.href = editCanvas.toDataURL();
    link.download = 'Tet_2026.png';
    link.click();
};

document.getElementById('homeBtn').onclick = () => {
    setTimeout(() => (window.location.href = 'index.html'), 100);
};