const upload = document.getElementById('upload');
const originalImage = document.getElementById('original-image');
const image = document.getElementById('image');
const opacity = document.getElementById('opacity');
const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
const saturation = document.getElementById('saturation');
const blur = document.getElementById('blur');
const grayscale = document.getElementById('grayscale');
const blackwhite = document.getElementById('blackwhite');
const invert = document.getElementById('invert');
const sepia = document.getElementById('sepia');
const hueRotate = document.getElementById('hue-rotate');
const red = document.getElementById('red');
const green = document.getElementById('green');
const blue = document.getElementById('blue');
const thresholdT = document.getElementById('thresholdT');
const thresholdT1 = document.getElementById('thresholdT1');
const thresholdT2 = document.getElementById('thresholdT2');
const applyThreshold = document.getElementById('applyThreshold');
const applyThresholdLimits = document.getElementById('applyThresholdLimits');
const segmentImage = document.getElementById('segmentImage');
const reset = document.getElementById('reset');
const save = document.getElementById('save');
const rotate = document.getElementById('rotate');
const flip = document.getElementById('flip');
const geometricProperties = document.getElementById('geometric-properties');
const shapeDetection = document.getElementById('shape-detection');

let originalImageData = null;

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        originalImage.src = event.target.result;
        image.src = event.target.result;
        originalImageData = new Image();
        originalImageData.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function applyFilters() {
    let filters = `
        opacity(${opacity.value}%)
        brightness(${brightness.value}%)
        contrast(${contrast.value}%)
        saturate(${saturation.value}%)
        blur(${blur.value}px)
        grayscale(${grayscale.value}%)
        sepia(${sepia.value}%)
        invert(${invert.value}%)
        hue-rotate(${hueRotate.value}deg)
    `;
    if (blackwhite.value > 0) {
        filters += ` grayscale(100%) contrast(${blackwhite.value * 8}%) brightness(${blackwhite.value * 1.5}%)`;
    }
    image.style.filter = filters;
}

[opacity, brightness, contrast, saturation, blur, grayscale, blackwhite, invert, sepia, hueRotate].forEach((element) => {
    element.addEventListener('input', applyFilters);
});

document.querySelectorAll('.filters button').forEach((button) => {
    button.addEventListener('click', () => {
        let filterString = '';
        switch (button.dataset.filter) {
            case "night-vision":
                filterString = 'contrast(130%) saturate(100%) brightness(110%) grayscale(0%) hue-rotate(100deg)';
                break;
            case "cyan":
                filterString = 'hue-rotate(180deg) saturate(100%)';
                break;
            case "magenta":
                filterString = 'hue-rotate(300deg) saturate(100%)';
                break;
            case "yellow":
                filterString = 'hue-rotate(60deg) saturate(100%)';
                break;
            case "red":
                filterString = 'hue-rotate(0deg) saturate(100%)';
                break;
            case "green":
                filterString = 'hue-rotate(120deg) saturate(100%)';
                break;
            case "blue":
                filterString = 'hue-rotate(240deg) saturate(100%)';
                break;
            case "vintage":
                filterString = 'sepia(50%) contrast(90%) brightness(90%)';
                break;
            case "cold":
                filterString = 'brightness(105%) contrast(90%) saturate(90%) hue-rotate(200deg)';
                break;
            case "warm":
                filterString = 'brightness(105%) contrast(90%) saturate(90%) hue-rotate(20deg)';
                break;
            case "underwater":
                filterString = 'brightness(90%) contrast(85%) saturate(150%) hue-rotate(180deg) blur(2px)';
                break;
            case "sunset":
                filterString = 'brightness(110%) contrast(115%) saturate(120%) hue-rotate(-10deg)';
                break;
            case "bnw":
                filterString = 'grayscale(100%) contrast(800%) brightness(150%)';
                break;
        }
        image.style.filter = filterString;
    });
});

applyThreshold.addEventListener('click', () => {
    const thresholdValue = parseInt(thresholdT.value);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalImageData.width;
    canvas.height = originalImageData.height;
    ctx.drawImage(originalImageData, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
        const value = grayscale >= thresholdValue ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
    }
    ctx.putImageData(imageData, 0, 0);
    image.src = canvas.toDataURL();
});

applyThresholdLimits.addEventListener('click', () => {
    const thresholdValue1 = parseInt(thresholdT1.value);
    const thresholdValue2 = parseInt(thresholdT2.value);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalImageData.width;
    canvas.height = originalImageData.height;
    ctx.drawImage(originalImageData, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
        const value = grayscale >= thresholdValue1 && grayscale <= thresholdValue2 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
    }
    ctx.putImageData(imageData, 0, 0);
    image.src = canvas.toDataURL();
});

segmentImage.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalImageData.width;
    canvas.height = originalImageData.height;
    ctx.drawImage(originalImageData, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
        if (grayscale < 128) {
            data[i + 3] = 0;  // Set alpha to 0 to remove background
        }
    }
    ctx.putImageData(imageData, 0, 0);
    const segmentedImage = new Image();
    segmentedImage.src = canvas.toDataURL();

    // Update the main edited image with the segmented output
    image.src = segmentedImage.src;

    const segmentationOutput = document.getElementById('segmentation-output');
    segmentedImage.style.width = "100px";  // Adjust the size to match the button
    segmentedImage.style.height = "100px";
    segmentationOutput.innerHTML = '';
    segmentationOutput.appendChild(segmentedImage);
});


[red, green, blue].forEach((element) => {
    element.addEventListener('input', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalImageData.width;
        canvas.height = originalImageData.height;
        ctx.drawImage(originalImageData, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] * (red.value / 255);
            data[i + 1] = data[i + 1] * (green.value / 255);
            data[i + 2] = data[i + 2] * (blue.value / 255);
        }
        ctx.putImageData(imageData, 0, 0);
        image.src = canvas.toDataURL();
    });
});

reset.addEventListener('click', () => {
    image.src = originalImageData.src;
    opacity.value = brightness.value = contrast.value = saturation.value = 100;
    blur.value = 0;
    grayscale.value = sepia.value = invert.value = hueRotate.value = blackwhite.value = 0;
    red.value = green.value = blue.value = 255;
    image.style.filter = 'none';
});

rotate.addEventListener('click', () => {
    image.style.transform = `rotate(${(parseInt(image.style.transform.replace('rotate(', '').replace('deg)', '')) || 0) + 90}deg)`;
});

flip.addEventListener('click', () => {
    image.style.transform = image.style.transform.includes('scaleX(-1)') ? 'scaleX(1)' : 'scaleX(-1)';
});

save.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = image.src;
    a.download = 'edited-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

geometricProperties.addEventListener('click', () => {
    window.location.href = 'MachineVP2/index.html';
});

shapeDetection.addEventListener('click', () => {
    window.location.href = 'colorshape/index.html';
});
