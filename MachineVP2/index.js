document.getElementById('imageInput').addEventListener('change', loadImage);

let originalImage, editedImage;

function loadImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            displayImage(img, 'originalCanvas');
            editedImage = img;
            displayImage(img, 'editedCanvas');
            calculateProperties(img, 'originalCanvas', 'editedCanvas');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function displayImage(img, canvasId) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
}

function calculateProperties(img, originalCanvasId, editedCanvasId) {
    const canvas = document.getElementById(originalCanvasId);
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;

    const imageArea = img.width * img.height;
    const imageCentroid = { x: img.width / 2, y: img.height / 2 };

    document.getElementById('imageArea').innerText = imageArea;
    document.getElementById('imageCentroidX').innerText = imageCentroid.x;
    document.getElementById('imageCentroidY').innerText = imageCentroid.y;

    detectObjects(img, pixels, originalCanvasId);
}

function detectObjects(img, pixels, canvasId) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');
    const width = img.width;
    const height = img.height;
    const boxes = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
                let found = false;
                for (let i = 0; i < boxes.length; i++) {
                    if (x >= boxes[i].x1 && x <= boxes[i].x2 && y >= boxes[i].y1 && y <= boxes[i].y2) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const box = findBox(x, y, pixels, width, height);
                    const centroid = calculateObjectCentroid(box, pixels, width);
                    boxes.push({ box, centroid });
                    context.strokeStyle = 'green';
                    context.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
                    context.beginPath();
                    context.arc(centroid.x, centroid.y, 5, 0, 2 * Math.PI);
                    context.strokeStyle = 'red';
                    context.stroke();
                }
            }
        }
    }
}

function calculateObjectCentroid(box, pixels, width) {
    let objectArea = 0;
    let objectCentroidX = 0;
    let objectCentroidY = 0;

    for (let y = box.y1; y <= box.y2; y++) {
        for (let x = box.x1; x <= box.x2; x++) {
            const index = (y * width + x) * 4;
            if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
                objectArea++;
                objectCentroidX += x;
                objectCentroidY += y;
            }
        }
    }

    if (objectArea > 0) {
        objectCentroidX /= objectArea;
        objectCentroidY /= objectArea;
    }

    return { x: Math.round(objectCentroidX), y: Math.round(objectCentroidY) };
}

function findBox(x, y, pixels, width, height) {
    const box = { x1: x, y1: y, x2: x, y2: y };
    const stack = [{ x, y }];
    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const index = (y * width + x) * 4;
        if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
            pixels[index] = 255;
            pixels[index + 1] = 255;
            pixels[index + 2] = 255;
            if (x < box.x1) box.x1 = x;
            if (x > box.x2) box.x2 = x;
            if (y < box.y1) box.y1 = y;
            if (y > box.y2) box.y2 = y;
            if (x > 0) stack.push({ x: x - 1, y });
            if (x < width - 1) stack.push({ x: x + 1, y });
            if (y > 0) stack.push({ x, y: y - 1 });
            if (y < height - 1) stack.push({ x, y: y + 1 });
        }
    }
    return box;
}

function resetImage() {
    displayImage(originalImage, 'editedCanvas');
}

function rotateImage() {
    const angle = parseInt(document.getElementById('rotateAngle').value) || 0;
    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempContext.translate(width / 2, height / 2);
    tempContext.rotate(angle * Math.PI / 180);
    tempContext.drawImage(canvas, -width / 2, -height / 2);
    context.clearRect(0, 0, width, height);
    context.drawImage(tempCanvas, 0, 0);
}

function mirrorImage(direction) {
    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    if (direction === 'vertical') {
        tempContext.scale(1, -1);
        tempContext.drawImage(canvas, 0, -canvas.height);
    } else {
        tempContext.scale(-1, 1);
        tempContext.drawImage(canvas, -canvas.width, 0);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(tempCanvas, 0, 0);
}

function translateImage() {
    const dx = parseInt(document.getElementById('translateX').value) || 0;
    const dy = parseInt(document.getElementById('translateY').value) || 0;
    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Get the image data of the entire canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Get the background color from the top-left corner
    const topLeftIndex = 0 * 4;
    const bgColor = `rgb(${pixels[topLeftIndex]}, ${pixels[topLeftIndex + 1]}, ${pixels[topLeftIndex + 2]})`;

    // Fill the temp canvas with the background color
    tempContext.fillStyle = bgColor;
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original image with the specified translation
    tempContext.putImageData(imageData, dx, dy);

    // Clear the original canvas and draw the translated image
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(tempCanvas, 0, 0);
}

function showHistogram() {
    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const histSize = 256;
    let histRed = new Array(histSize).fill(0);
    let histGreen = new Array(histSize).fill(0);
    let histBlue = new Array(histSize).fill(0);

    for (let i = 0; i < pixels.length; i += 4) {
        histRed[pixels[i]]++;
        histGreen[pixels[i + 1]]++;
        histBlue[pixels[i + 2]]++;
    }

    const histogramCanvas = document.getElementById('histogramCanvas');
    const histContext = histogramCanvas.getContext('2d');
    histogramCanvas.width = 768;
    histogramCanvas.height = 256;
    histContext.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

    drawHistogram(histContext, histRed, 'red', 0);
    drawHistogram(histContext, histGreen, 'green', 256);
    drawHistogram(histContext, histBlue, 'blue', 512);

    const histRedValue = Math.max(...histRed);
    const histGreenValue = Math.max(...histGreen);
    const histBlueValue = Math.max(...histBlue);

    document.getElementById('histRed').innerText = histRedValue;
    document.getElementById('histGreen').innerText = histGreenValue;
    document.getElementById('histBlue').innerText = histBlueValue;
}

function drawHistogram(context, data, color, offsetX) {
    const max = Math.max(...data);
    context.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
        const height = (data[i] / max) * context.canvas.height;
        context.fillRect(offsetX + i, context.canvas.height - height, 1, height);
    }
}

function binaryProjection(direction) {
    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const projection = direction === 'horizontal' ? new Array(canvas.width).fill(0) : new Array(canvas.height).fill(0);

    if (direction === 'horizontal') {
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
                    projection[x]++;
                }
            }
        }
    } else {
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
                    projection[y]++;
                }
            }
        }
    }

    const binaryProjectionCanvas = document.getElementById('binaryProjectionCanvas');
    const binaryContext = binaryProjectionCanvas.getContext('2d');
    binaryProjectionCanvas.width = 512;
    binaryProjectionCanvas.height = 256;
    binaryContext.clearRect(0, 0, binaryProjectionCanvas.width, binaryProjectionCanvas.height);

    drawProjection(binaryContext, projection, direction);
}

function drawProjection(context, data, direction) {
    context.fillStyle = 'black';
    if (direction === 'horizontal') {
        for (let i = 0; i < data.length; i++) {
            context.fillRect(i * 2, 256 - data[i] / 2, 2, data[i] / 2);
        }
    } else {
        for (let i = 0; i < data.length; i++) {
            context.fillRect(0, i * 2, data[i] / 2, 2);
        }
    }
}

function boxObjects() {
    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const boxes = [];

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
                let found = false;
                for (let i = 0; i < boxes.length; i++) {
                    if (x >= boxes[i].x1 && x <= boxes[i].x2 && y >= boxes[i].y1 && y <= boxes[i].y2) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const box = findBox(x, y, pixels, canvas.width, canvas.height);
                    boxes.push(box);
                    context.strokeStyle = 'green';
                    context.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
                }
            }
        }
    }

    boxes.forEach(box => {
        const centroid = calculateObjectCentroid(box, pixels, canvas.width);
        context.beginPath();
        context.arc(centroid.x, centroid.y, 5, 0, 2 * Math.PI);
        context.strokeStyle = 'red';
        context.stroke();
    });

    context.strokeStyle = 'green';
    context.strokeRect(0, 0, canvas.width, canvas.height);
}

function applyFilter(type) {
    const kernelMap = {
        smoothing: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
        gaussianBlur: [1 / 16, 2 / 16, 1 / 16, 2 / 16, 4 / 16, 2 / 16, 1 / 16, 2 / 16, 1 / 16],
        sharpening: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        meanRemoval: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
        emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2]
    };

    const kernel = kernelMap[type];
    if (!kernel) return;

    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const output = new Uint8ClampedArray(pixels.length);

    const applyKernel = (x, y) => {
        let r = 0, g = 0, b = 0, a = 0;
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const px = (x + kx + width) % width;
                const py = (y + ky + height) % height;
                const index = (py * width + px) * 4;
                const weight = kernel[(ky + 1) * 3 + (kx + 1)];
                r += pixels[index] * weight;
                g += pixels[index + 1] * weight;
                b += pixels[index + 2] * weight;
                a += pixels[index + 3] * weight;
            }
        }
        return [r, g, b, a];
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const [r, g, b, a] = applyKernel(x, y);
            const index = (y * width + x) * 4;
            output[index] = r;
            output[index + 1] = g;
            output[index + 2] = b;
            output[index + 3] = a;
        }
    }

    for (let i = 0; i < pixels.length; i++) {
        pixels[i] = output[i];
    }

    context.putImageData(new ImageData(output, width, height), 0, 0);
}

function applyCustomFilter() {
    const kernelSize = 3;
    const kernel = [];

    for (let i = 0; i < kernelSize; i++) {
        kernel[i] = [];
        for (let j = 0; j < kernelSize; j++) {
            const inputId = `kernel${i}${j}`;
            kernel[i][j] = parseFloat(document.getElementById(inputId).value) || 0;
        }
    }

    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const output = new Uint8ClampedArray(pixels.length);

    const applyKernel = (x, y) => {
        let r = 0, g = 0, b = 0, a = 0;
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const px = (x + kx + width) % width;
                const py = (y + ky + height) % height;
                const index = (py * width + px) * 4;
                const weight = kernel[ky + 1][kx + 1];
                r += pixels[index] * weight;
                g += pixels[index + 1] * weight;
                b += pixels[index + 2] * weight;
                a += pixels[index + 3] * weight;
            }
        }
        return [r, g, b, a];
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const [r, g, b, a] = applyKernel(x, y);
            const index = (y * width + x) * 4;
            output[index] = r;
            output[index + 1] = g;
            output[index + 2] = b;
            output[index + 3] = a;
        }
    }

    for (let i = 0; i < pixels.length; i++) {
        pixels[i] = output[i];
    }

    context.putImageData(new ImageData(output, width, height), 0, 0);
}

function saveImage() {
    const canvas = document.getElementById('editedCanvas');
    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = canvas.toDataURL();
    link.click();
}

function detectCentroids() {
    const canvas = document.getElementById('editedCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const objects = [];

    // Identify objects and their centroids
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
                let found = false;
                for (let i = 0; i < objects.length; i++) {
                    if (x >= objects[i].x1 && x <= objects[i].x2 && y >= objects[i].y1 && y <= objects[i].y2) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const box = findBox(x, y, pixels, canvas.width, canvas.height);
                    const centroid = calculateObjectCentroid(box, pixels, canvas.width);
                    objects.push({ box, centroid });
                }
            }
        }
    }

    // Draw centroids
    objects.forEach(obj => {
        const { centroid } = obj;
        context.beginPath();
        context.arc(centroid.x, centroid.y, 5, 0, 2 * Math.PI);
        context.strokeStyle = 'blue';
        context.stroke();
    });
}

function calculateObjectCentroid(box, pixels, width) {
    let objectArea = 0;
    let objectCentroidX = 0;
    let objectCentroidY = 0;

    for (let y = box.y1; y <= box.y2; y++) {
        for (let x = box.x1; x <= box.x2; x++) {
            const index = (y * width + x) * 4;
            if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
                objectArea++;
                objectCentroidX += x;
                objectCentroidY += y;
            }
        }
    }

    if (objectArea > 0) {
        objectCentroidX /= objectArea;
        objectCentroidY /= objectArea;
    }

    return { x: objectCentroidX, y: objectCentroidY };
}

function findBox(x, y, pixels, width, height) {
    const box = { x1: x, y1: y, x2: x, y2: y };
    const stack = [{ x, y }];
    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const index = (y * width + x) * 4;
        if (pixels[index] < 255 || pixels[index + 1] < 255 || pixels[index + 2] < 255) {
            pixels[index] = 255;
            pixels[index + 1] = 255;
            pixels[index + 2] = 255;
            if (x < box.x1) box.x1 = x;
            if (x > box.x2) box.x2 = x;
            if (y < box.y1) box.y1 = y;
            if (y > box.y2) box.y2 = y;
            if (x > 0) stack.push({ x: x - 1, y });
            if (x < width - 1) stack.push({ x: x + 1, y });
            if (y > 0) stack.push({ x, y: y - 1 });
            if (y < height - 1) stack.push({ x, y: y + 1 });
        }
    }
    return box;
}
