const vFile = document.getElementById('vFile');
const player = document.getElementById('vPlayer');
const seeker = document.getElementById('vSeeker');
const vStart = document.getElementById('vStart');
const vEnd = document.getElementById('vEnd');

// Load Video
vFile.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('vName').innerText = file.name;
        document.getElementById('no-video').style.display = 'none';
        player.src = URL.createObjectURL(file);

        player.onloadedmetadata = () => {
            seeker.max = player.duration;
            vEnd.value = player.duration.toFixed(1);
            document.getElementById('totTime').innerText = formatTime(player.duration);
        };
    }
};

// Seek Update
player.ontimeupdate = () => {
    seeker.value = player.currentTime;
    document.getElementById('curTime').innerText = formatTime(player.currentTime);
};

seeker.oninput = () => { player.currentTime = seeker.value; };

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Submit Action
document.getElementById('renderBtn').onclick = async () => {
    if (!vFile.files[0]) { alert("Pehle video select karo!"); return; }

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    const formData = new FormData();
    formData.append('video', vFile.files[0]);
    formData.append('start', vStart.value);
    formData.append('end', vEnd.value);
    formData.append('remove_audio', document.getElementById('vMute').checked);

    try {
        const res = await fetch('/video_trim', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            window.location.href = `/download/${data.filename}`;
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) {
        alert("Server error!");
    } finally {
        overlay.style.display = 'none';
    }
};

// Drag and Drop Logic for Video
const fileDropArea = document.querySelector('.video-main');

fileDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropArea.style.borderColor = "var(--v-accent)";
    fileDropArea.style.background = "rgba(99, 102, 241, 0.08)";
});

fileDropArea.addEventListener('dragleave', () => {
    fileDropArea.style.borderColor = "var(--v-border)";
    fileDropArea.style.background = "rgba(255, 255, 255, 0.02)";
});

fileDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
        vFile.files = files;
        // Trigger manual change to load video
        const event = new Event('change');
        vFile.dispatchEvent(event);
    }
});