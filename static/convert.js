const fileInput = document.getElementById('fileInput');
    fileInput.onchange = () => {
        const count = fileInput.files.length;
        document.getElementById('fileLabel').innerText = count > 1 ? `${count} Files Selected` : fileInput.files[0].name;
    };

    document.getElementById('convertForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.innerText = "Converting..."; btn.disabled = true;

        const formData = new FormData(e.target);
        const response = await fetch('/convertor', { method: 'POST', body: formData });
        const data = await response.json();

        if (response.ok) {
            const list = document.getElementById('fileList');
            list.innerHTML = '';
            data.files.forEach(file => {
                list.innerHTML += `
                    <div class="result-item">
                        <div class="d-flex align-items:center">
                            <span class="badge bg-primary me-3">${file.type}</span>
                            <span style="font-size:0.9rem">${file.name}</span>
                        </div>
                        <a href="/download/${file.name}" class="btn-dl">Download</a>
                    </div>`;
            });
            document.getElementById('resultArea').style.display = 'block';
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
        btn.innerText = "Convert Files"; btn.disabled = false;
    };