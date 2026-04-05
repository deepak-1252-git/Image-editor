function toggleExtras() {
    document.getElementById('splitInput').style.display = document.getElementById('split').checked ? 'block' : 'none';
    document.getElementById('lockInput').style.display = document.getElementById('lock').checked ? 'block' : 'none';
}

document.getElementById('fileInput').onchange = (e) => {
    document.getElementById('fileLabel').innerText = `${e.target.files.length} PDF(s) Selected`;
}

document.getElementById('pdfForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerText = "Processing..."; btn.disabled = true;

    const formData = new FormData(e.target);
    const response = await fetch('/pdf_tool', { method: 'POST', body: formData });
    const data = await response.json();

    if (response.ok) {
        document.getElementById('resultArea').style.display = 'block';
        document.getElementById('downloadBtn').href = `/download/${data.filename}`;
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
        alert("Error: " + data.error);
    }
    btn.innerText = "Process PDF"; btn.disabled = false;
};