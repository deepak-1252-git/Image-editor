let cropper;
const image = document.getElementById('image');

document.getElementById('inputImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        // Purana cropper destroy karein
        if (cropper) { cropper.destroy(); }

        image.src = event.target.result;

        // Cropper Initialize karein
        cropper = new Cropper(image, {
            // preview: '.preview-container',
            viewMode: 1,      // Image container ke andar hi rahegi
            dragMode: 'move', // Canvas ko move karne ke liye
            autoCropArea: 1, 
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            checkOrientation: false,
            responsive: true,
        });
    };
    reader.readAsDataURL(file);
});
// function for rotation
function rotateRight() {
    if (cropper) cropper.rotate(90);
}

function rotateLeft() {
    if (cropper) cropper.rotate(-90);
}
// function for aspected ratio
function setAspectRatio(ratio) {
    cropper.setAspectRatio(parseFloat(ratio));
}
// function for mirror
let flipH = 1, flipV = 1;
function flipHorizontal() {
    flipH = flipH === 1 ? -1 : 1;
    cropper.scaleX(flipH);
}
function flipVertical() {
    flipV = flipV === 1 ? -1 : 1;
    cropper.scaleY(flipV);
}
// reset 
function resetEditor() {
    cropper.reset();
}

async function cropImage(btn) {
    if (!cropper) return;

    const overlay = document.getElementById('loadingOverlay');
    const downloadBtn = btn;

    // 1. Spinner dikhao aur button disable karo
    overlay.style.display = 'flex';
    downloadBtn.disabled = true;
    downloadBtn.innerText = "Processing...";

    // Cropped Canvas nikalna shuru
    let canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    // Blob conversion start
    canvas.toBlob(async (blob) => {
        if (!blob) {
            console.error("Canvas empty hai!");
            hideLoading(overlay, downloadBtn);
            return;
        }

        let formData = new FormData();
        formData.append("image", blob, "cropped.jpg");

        try {
            // Server par bhejna start
            let res = await fetch('/crop_rotate', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                let data = await res.json();
                
                // 2. Download trigger karein
                window.location.href = `/download/${data.filename}`;

                // Download ke turant baad hide nahi karenge, 
                // 1.5s ka delay denge taaki browser download start kar sake
                setTimeout(() => hideLoading(overlay, downloadBtn), 900);
            } else {
                throw new Error("Server error!");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Upload fail ho gaya!");
            hideLoading(overlay, downloadBtn);
        }
    }, 'image/jpeg', 0.95);
}

// Ye function spinner hatane aur button wapas sahi karne ke liye hai
function hideLoading(overlay, btn) {
    overlay.style.display = 'none';
    btn.disabled = false;
    btn.innerText = "Download";
}