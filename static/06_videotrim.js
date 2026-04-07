const vFile = document.getElementById('vFile');
const player = document.getElementById('vPlayer');
const seeker = document.getElementById('vSeeker');
const vStart = document.getElementById('vStart');
const vEnd = document.getElementById('vEnd');
const vSpeed = document.getElementById('vSpeed'); // New
const vFilter = document.getElementById('vFilter'); // New
const vMute = document.getElementById('vMute'); // New

// --- LIVE PREVIEW LOGIC ---

// 1. Live Speed Preview
if (vSpeed) {
    vSpeed.onchange = () => {
        player.playbackRate = parseFloat(vSpeed.value);
    };
}

// 2. Live Filter Preview (CSS Magic)
if (vFilter) {
    vFilter.onchange = () => {
        const val = vFilter.value;
        if (val === 'bw') player.style.filter = 'grayscale(100%)';
        else if (val === 'sepia') player.style.filter = 'sepia(100%) brightness(0.9)';
        else player.style.filter = 'none';
    };
}

// 3. Live Mute Preview
if (vMute) {
    vMute.onchange = () => {
        player.muted = vMute.checked;
    };
}

// 4. Range Loop (Prevents player going out of trim range)
player.ontimeupdate = () => {
    seeker.value = player.currentTime;
    document.getElementById('curTime').innerText = formatTime(player.currentTime);

    // Loop logic: Agar End Time set hai aur current time usse bada ho jaye
    let endTime = parseFloat(vEnd.value);
    let startTime = parseFloat(vStart.value);
    if (endTime && player.currentTime >= endTime) {
        player.currentTime = startTime || 0;
    }
};

// --- REST OF THE LOGIC ---

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
            vStart.value = 0; // Default start
            document.getElementById('totTime').innerText = formatTime(player.duration);
            // Reset filters/speed on new video
            player.playbackRate = vSpeed ? parseFloat(vSpeed.value) : 1.0;
        };
    }
};

seeker.oninput = () => { player.currentTime = seeker.value; };

// Manual jump to start time when typed
vStart.oninput = () => { player.currentTime = parseFloat(vStart.value) || 0; };

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
    formData.append('remove_audio', vMute.checked);
    formData.append('speed', vSpeed.value);
    formData.append('filter', vFilter.value);
    formData.append('format', document.getElementById('vFormat').value);

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

// Drag and Drop
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
        vFile.dispatchEvent(new Event('change'));
    }
});