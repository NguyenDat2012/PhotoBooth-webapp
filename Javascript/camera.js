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
let CANVAS_WIDTH, CANVAS_HEIGHT;
let camera_width, camera_height;

if(datatype ==  'portrait'){
    CANVAS_WIDTH = 295;
    CANVAS_HEIGHT = 900;
    camera_width = 245;
    camera_height = 180;
}else{
    CANVAS_WIDTH = 295;
    CANVAS_HEIGHT = 900;
    camera_width = 245;
    camera_height = 180;
}


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
        
        // Cần thiết cho Safari/iOS
        video.setAttribute('playsinline', 'true'); 
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true'); // Một số trình duyệt yêu cầu muted để autoplay

        video.onloadedmetadata = () => {
            video.play();
            video.style.transform = "scaleX(-1)";
        };
    } catch (err) {
        console.error("Lỗi camera:", err);
        alert("Không thể truy cập camera. Vui lòng cấp quyền hoặc kiểm tra kết nối https.");
    }
}

// Chỉ để lại các thông số cố định của Frame (Khung ảnh)
const CONFIG = {
    gap: 178,          // Khoảng cách nhảy giữa các ô
};

function capturePhoto() {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    
     
    const vDisplayWidth = camera_width;
    const vDisplayHeight = camera_height;
    const vDisplayLeft = video.offsetLeft;
    let vDisplayTop = video.offsetTop;

    if (total === 0) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }

    // --- BẮT ĐẦU PHẦN SỬA ĐỂ CHỐNG BÓP ẢNH ---
    
    // 1. Tính toán tỉ lệ của video và ô chứa
    const videoRatio = video.videoWidth / video.videoHeight;
    const targetRatio = vDisplayWidth / vDisplayHeight;

    let sx, sy, sw, sh;

    if (videoRatio > targetRatio) {
        sh = video.videoHeight;
        sw = sh * targetRatio;
        sx = (video.videoWidth - sw) / 2;
        sy = 0;
    } else {
        // Nếu video dài hơn ô chứa (thường gặp khi cầm điện thoại dọc)
        sw = video.videoWidth;
        sh = sw / targetRatio;
        sx = 0;
        sy = (video.videoHeight - sh) / 2;
    }

    // 2. Vẽ lên Canvas
    ctx.save();
    ctx.translate(vDisplayLeft + vDisplayWidth, vDisplayTop);
    ctx.scale(-1, 1); // Hiệu ứng lật gương

    ctx.drawImage(
        video, 
        sx, sy, sw, sh,               // CẮT phần giữa của video theo tỉ lệ ô chứa
        0, 0, vDisplayWidth, vDisplayHeight // VẼ vào đúng kích thước ô chứa
    );
    ctx.restore();
    
    // --- KẾT THÚC PHẦN SỬA ---

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
    const editContainer = document.getElementById('editcanvas');
    editContainer.appendChild(canvas);

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