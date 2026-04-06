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

const togglePassword = document.querySelector('#togglePassword');
const password = document.querySelector('#pdfPassword');

togglePassword.addEventListener('click', function (e) {
    // toggle the type attribute
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    
    // toggle the eye / eye-slash icon
    this.classList.toggle('fa-eye-slash');
});

const uploadBox = document.querySelector('.upload-box');
const fileInput = document.getElementById('fileInput');

// 1. Jab file box ke upar ho
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault(); // Default open file behavior roko
    uploadBox.classList.add('drag-over');
});

// 2. Jab mouse box se bahar chala jaye
uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('drag-over');
});

// 3. Jab file DROP ho jaye
uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files; // Input field ko drop ki hui files assign karo
        
        // Manual change event trigger karo taaki aapka purana logic (width/height pre-fill) chal sake
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }
});