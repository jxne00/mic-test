let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioCtx, analyser, dataArray, source, canvasCtx, animationId;

const toggleBtn = document.getElementById('toggleRecord');
const player = document.getElementById('player');
const canvas = document.getElementById('waveform');

canvasCtx = canvas.getContext('2d');

toggleBtn.onclick = async () => {
    if (!isRecording) {
        // request mic access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        isRecording = true;
        toggleBtn.textContent = 'Stop Recording';
        canvas.style.display = 'block';

        // store audio
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

        mediaRecorder.onstop = () => {
            cancelAnimationFrame(animationId);
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);

            player.pause();
            player.removeAttribute('src');
            player.load();
            player.src = url;
            player.load();

            audioChunks = [];
        };

        // setup waveform
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        dataArray = new Uint8Array(analyser.fftSize);
        draw();
    } else {
        mediaRecorder.stop();
        audioCtx.close();
        isRecording = false;
        toggleBtn.textContent = 'Start Recording';
    }
};

// draw waveform
function draw() {
    animationId = requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = '#111';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#00ffe7';
    canvasCtx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}
