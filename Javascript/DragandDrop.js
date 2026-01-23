const printButton = document.getElementById('printBtn');
function printFinalImage() {
    console.log("Đang chuẩn bị ảnh để tải về...");
    
    // 2. Tạo ảnh từ Canvas
    const imageDataURL = canvas.toDataURL('image/png');
    
    // 3. Tạo link ảo để tải
    const link = document.createElement('a');
    link.href = imageDataURL;
    link.download = `PhotoBooth_Tet_2026.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
printButton.addEventListener('click', printFinalImage);
// Khai báo biến toàn cục (dùng var để có thể truy cập từ file khác mà không bị lỗi khai báo lại)
var stickersInCanvas = [];
var selectedSticker = null;
var isDragging = false;
var offsetX, offsetY;
var tempBackground = null;

// Lấy Canvas từ DOM (Dùng chung ID photoCanvas)
const editCanvas = document.getElementById('photoCanvas');
const editCtx = editCanvas ? editCanvas.getContext('2d') : null;

/**
 * HÀM KHỞI CHẠY HỆ THỐNG
 * Gọi hàm này ngay sau khi ảnh đã hiện trên Canvas (Chụp xong hoặc Upload xong)
 */
function startEditingSystem() {
    if (!editCanvas || !editCtx) return;

    console.log("Hệ thống Sticker đã kích hoạt!");

    // 1. Chụp lại trạng thái hiện tại của Canvas làm nền cố định
    const dataURL = editCanvas.toDataURL('image/png');
    tempBackground = new Image();
    tempBackground.src = dataURL;

    tempBackground.onload = () => {
        renderCanvas(); // Vẽ dải ảnh gốc lên trước
    };

    // 2. Gán sự kiện click cho các icon menu
    const stickerIcons = document.querySelectorAll('.sticker-item');
    stickerIcons.forEach(icon => {
        icon.onclick = function() {
            // Lấy tên file từ src của nút (ví dụ: "1.png")
            const fileName = this.src.split('/').pop();
            // Nối đường dẫn đến thư mục Sticker chứa ảnh gốc để vẽ
            const highResPath = "Sticker/" + fileName; 
            
            addNewSticker(highResPath);
        };
    });

    // 3. Thiết lập sự kiện tương tác chuột/chạm
    setupInteraction();
}

// Thêm sticker mới vào chính giữa Canvas
function addNewSticker(src) {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Tránh lỗi bảo mật khi tải ảnh (Print)
    img.src = src;

    img.onload = function() {
        const size = 50; // Kích thước sticker khi hiện ra
        const sticker = {
            img: img,
            x: editCanvas.width / 2 - size / 2, // Chính giữa chiều ngang
            y: editCanvas.height / 2 - size / 2, // Chính giữa chiều dọc
            w: size,
            h: size
        };
        stickersInCanvas.push(sticker);
        renderCanvas(); // Vẽ lại để hiện sticker mới
    };
}

// Hàm vẽ lại toàn bộ Canvas (Nền + Tất cả Sticker)
function renderCanvas() {
    if (!editCtx) return;
    
    // Xóa sạch canvas
    editCtx.clearRect(0, 0, editCanvas.width, editCanvas.height);
    
    // Vẽ ảnh nền (Dải ảnh 4 tấm + Khung)
    if (tempBackground) {
        editCtx.drawImage(tempBackground, 0, 0, editCanvas.width, editCanvas.height);
    }

    // Vẽ từng sticker trong danh sách
    stickersInCanvas.forEach(s => {
        editCtx.drawImage(s.img, s.x, s.y, s.w, s.h);
    });
}

// Xử lý kéo thả
function setupInteraction() {
    const handleStart = (e) => {
        const pos = getMousePos(e);
        // Kiểm tra xem có nhấn trúng sticker nào không (duyệt từ trên xuống dưới)
        for (let i = stickersInCanvas.length - 1; i >= 0; i--) {
            const s = stickersInCanvas[i];
            if (pos.x >= s.x && pos.x <= s.x + s.w && pos.y >= s.y && pos.y <= s.y + s.h) {
                selectedSticker = s;
                isDragging = true;
                offsetX = pos.x - s.x;
                offsetY = pos.y - s.y;
                
                // Đưa sticker đang chọn lên trên cùng lớp vẽ
                stickersInCanvas.splice(i, 1);
                stickersInCanvas.push(selectedSticker);
                return;
            }
        }
    };

    const handleMove = (e) => {
        if (!isDragging || !selectedSticker) return;
        const pos = getMousePos(e);
        selectedSticker.x = pos.x - offsetX;
        selectedSticker.y = pos.y - offsetY;
        renderCanvas();
    };

    const handleEnd = () => {
        isDragging = false;
        selectedSticker = null;
    };

    // Gán cho chuột
    editCanvas.onmousedown = handleStart;
    window.onmousemove = handleMove;
    window.onmouseup = handleEnd;

    // Gán cho cảm ứng (Điện thoại)
    editCanvas.ontouchstart = handleStart;
    window.ontouchmove = handleMove;
    window.ontouchend = handleEnd;
}

// Tính tọa độ chuột chuẩn trên Canvas
function getMousePos(e) {
    const rect = editCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (editCanvas.width / rect.width),
        y: (clientY - rect.top) * (editCanvas.height / rect.height)
    };
}