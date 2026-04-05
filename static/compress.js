const imageInput = document.getElementById('imageInput');
    const compressForm = document.getElementById('compressForm');

    // Pre-fill target size (50% of original)
    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const sizeKB = file.size / 1024;
            document.getElementById('fileLabel').innerText = file.name;
            document.getElementById('fileSizeInfo').innerText = `Current Size: ${sizeKB.toFixed(2)} KB`;
            document.getElementById('targetSize').value = Math.round(sizeKB * 0.5);
        }
    });

    compressForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        
        btnText.innerText = "Compressing... Please wait";
        btn.disabled = true;

        const formData = new FormData(compressForm);
        try {
            const response = await fetch('/compressor', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
                document.getElementById('resultArea').style.display = 'block';
                document.getElementById('resOrig').innerText = data.original_size;
                document.getElementById('resComp').innerText = data.compressed_size;
                document.getElementById('resRed').innerText = data.reduction;
                document.getElementById('resDownload').href = `/download/${data.filename}`;
                
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        } catch (error) {
            alert("Error in compression. Try a different image.");
        }

        btnText.innerText = "Compress Now";
        btn.disabled = false;
    };