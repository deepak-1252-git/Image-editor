let cropper;
const image = document.getElementById('image');

document.getElementById('inputImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        // Purana cropper destroy karein
        if (cropper) {
            cropper.destroy();
        }

        image.src = event.target.result;

        // Cropper Initialize karein
        cropper = new Cropper(image, {
            viewMode: 1,      // Image container ke andar hi rahegi
            dragMode: 'move', // Canvas ko move karne ke liye
            autoCropArea: 0.8, 
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
    reader.readAsDataURL(file);

    // Optional: Background upload logic yahan rakhein agar zaroorat ho
});

function rotateRight() {
    if (cropper) cropper.rotate(90);
}

function rotateLeft() {
    if (cropper) cropper.rotate(-90);
}

async function cropImage() {
    if (!cropper) return;

    // Output size maintain karne ke liye getCroppedCanvas use karein
    let canvas = cropper.getCroppedCanvas({
        fillColor: '#fff', // PNG to JPEG conversion ke liye white background
    });

    canvas.toBlob(async (blob) => {
        let formData = new FormData();
        formData.append("image", blob, "cropped.jpg");

        let res = await fetch('/crop_rotate', {
            method: 'POST',
            body: formData
        });

        let data = await res.json();
        if(data.filename) {
            window.location.href = `/download/${data.filename}`;
        }
    }, 'image/jpeg', 0.95);
}