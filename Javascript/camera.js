const video = document.getElementById('video');
const overlayFrame = document.getElementById('overlayFrame');
const btncapture = document.getElementById('captureButton');
const finalImage = document.getElementById('finalImage');

const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');

const urlParams = new URLSearchParams(window.location.search);
const encodedUrl = urlParams.get('image_url');
const datatype = urlParams.get('data_type');

let total = 0;
const totalFrames = 4;
const CANVAS_WIDTH = 295;
const CANVAS_HEIGHT = 900;


async function setupCamera() {
    const constraints = {
        video: { 
            facingMode: "user",
            width: { ideal: datatype === 'portrait' ? 245 : 260 },
            height: { ideal: datatype === 'portrait' ? 180 : 279 }
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            // Áp dụng mirror cho preview video
            video.style.transform = "scaleX(-1)";
        };
    } catch (err) {
        console.error("Lỗi camera:", err);
        alert("Không thể truy cập camera.");
    }
}

// Chỉ để lại các thông số cố định của Frame (Khung ảnh)
const CONFIG = {
    gap: 178,          // Khoảng cách nhảy giữa các ô
};

function capturePhoto() {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    
    // Đảm bảo lấy thông số MỚI NHẤT từ video tại thời điểm bấm chụp
    const vDisplayWidth = 245;
    const vDisplayHeight = 180;
    const vDisplayLeft = video.offsetLeft;
    let vDisplayTop = video.offsetTop;
    console.log(`Width: ${vDisplayWidth} Height:${vDisplayHeight}`);

    if (total === 0) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }

    // 2. Vẽ ảnh lên Canvas
    ctx.save();
    // Dịch chuyển tâm đến đúng vị trí video đang hiển thị trên màn hình
    ctx.translate(vDisplayLeft + vDisplayWidth, vDisplayTop);
    ctx.scale(-1, 1); // Hiệu ứng lật gương

    // Vẽ từ video gốc lên tọa độ đích
    ctx.drawImage(
        video, 
        0, 0,           // Source X, Y: Bắt đầu cắt từ góc 0,0 của luồng video camera
        video.videoWidth, video.videoHeight, // Source W, H: Lấy hết toàn bộ khung hình camera
        0, 0,           // Destination X, Y: Vẽ tại gốc tọa độ mới (đã translate)
        vDisplayWidth,  // Destination W: Vẽ đúng bằng chiều rộng hiển thị
        vDisplayHeight  // Destination H: Vẽ đúng bằng chiều cao hiển thị
    );
    ctx.restore();
    console.log(`Đã vẽ ảnh ${total + 1} chính xác tại X:${vDisplayLeft} Y:${vDisplayTop}`);
    total++;
    if (total < totalFrames) {
        moveCameraToNextFrame(vDisplayTop);
    } else {
        setTimeout(() => {
            finalizeStrip();
        }, 100);
    }
}
function moveCameraToNextFrame(currentTop) {
    // Di chuyển video preview xuống ô tiếp theo
    const nextY = currentTop + CONFIG.gap; 
    video.style.top = nextY + "px";
}

function finalizeStrip() {
    // 1. Vẽ khung overlay lên trên cùng của 4 tấm ảnh
    if (overlayFrame.complete) {
        ctx.drawImage(overlayFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Dừng Camera để giải phóng tài nguyên
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    // 3. Ẩn phần chụp, hiện phần sửa
    document.getElementById('camera-section').style.display = 'none';
    const editSection = document.getElementById('edit-section');
    editSection.style.display = 'flex';

    // 4. DI CHUYỂN CANVAS: Đưa canvas từ camera-wrapper vào edit-section
    // Điều này đảm bảo ảnh không bị mất khi section cũ bị ẩn
    editSection.appendChild(canvas);

    console.log("Đã hoàn tất dải ảnh!");

    startEditingSystem();
}
// Giữ nguyên các hàm bổ trợ của bạn
function loadFrameFromUrl() {
   if (encodedUrl && overlayFrame) {
        // Cho phép Canvas vẽ ảnh từ URL bên ngoài
        overlayFrame.crossOrigin = "anonymous"; 
        overlayFrame.src = decodeURIComponent(encodedUrl);
        
        overlayFrame.onload = () => {
            console.log("Khung ảnh đã tải xong và sẵn sàng để vẽ.");
        };
        overlayFrame.onerror = () => {
            console.error("Không thể tải khung ảnh từ URL.");
        };
    }
}


const startCountDown = (callback) => {
    let count = 3;
    const countdownEl = document.getElementById('countdownDisplay');
    countdownEl.style.display = 'flex';
    countdownEl.textContent = count;
    
    const intervalId = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            clearInterval(intervalId);
            countdownEl.style.display = 'none';
            callback();
        }
    }, 1000);
};
document.addEventListener('DOMContentLoaded', () => {
    loadFrameFromUrl();
    setupCamera();
    btncapture.addEventListener('click', () => {
        if (total < totalFrames) {
            btncapture.style.display = 'none';
            startCountDown(() => {
                capturePhoto();
                if (total < totalFrames) btncapture.style.display = 'block';
            });
        }
    });
    
});