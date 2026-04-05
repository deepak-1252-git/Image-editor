const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');

// Pre-fill width/height on selection
fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        document.getElementById('fileLabel').innerText = file.name;
        const img = new Image();
        img.onload = function() {
            document.getElementById('fileSizeDisplay').innerText = `Original: ${img.width}x${img.height}px`;
            
            // Smart Setting: Default mein 50% size set kar do
            document.getElementById('targetWidth').value = Math.round(img.width * 0.5);
            document.getElementById('targetHeight').value = Math.round(img.height * 0.5);
        };
        img.src = URL.createObjectURL(file);
    }
});
// Jab Width change ho
document.getElementById('targetWidth').addEventListener('input', function() {
    const img = new Image();
    const file = fileInput.files[0];
    if (file) {
        img.onload = function() {
            const ratio = img.height / img.width;
            document.getElementById('targetHeight').value = Math.round(document.getElementById('targetWidth').value * ratio);
        };
        img.src = URL.createObjectURL(file);
    }
});
// Handle Form Submission with AJAX
uploadForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    
    btnText.innerText = "Processing...";
    btn.disabled = true;

    const formData = new FormData(uploadForm);
    const response = await fetch('/resizer', {
        method: 'POST',
        body: formData
    });

    const data = await response.json(); // Hum route ko JSON return karne ke liye modify karenge

    if (response.ok) {
        document.getElementById('resultArea').style.display = 'block';
        document.getElementById('resImg').src = `/outputs/${data.filename}`;
        document.getElementById('resRes').innerText = `${data.resolution[0]} x ${data.resolution[1]} px`;
        document.getElementById('resSize').innerText = `${data.file_size} KB`;
        document.getElementById('resDownload').href = `/download/${data.filename}`;
        
        // Scroll to result
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
        alert("Something went wrong!");
    }

    btnText.innerText = "Process & Resize";
    btn.disabled = false;
};
