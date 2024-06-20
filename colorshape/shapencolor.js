document.body.classList.add("loading");

let imgElement = document.getElementById('imageOriginal');
let inputElement = document.getElementById('imageInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function() {
  mat = cv.imread(imgElement);
  cv.imshow('imageCanvas', mat);
};

let shapeCount;
let colorCounts;

document.getElementById('detectShapesButton').onclick = async function() {
  this.disabled = true;

  shapeCount = {
      "Circle": 0,
      "Triangle": 0,
      "Square": 0,
      "Rectangle": 0,
      "Quadrilateral": 0,
      "Ellipse": 0
  };

  colorCounts = {
      'yellow': 0,
      'red': 0,
      'blue': 0,
      'green': 0
  };

  let src = cv.imread('imageCanvas');
  let gray = new cv.Mat();
  
  // Convert the image to grayscale
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  
  // Calculate the average brightness grayscale
  let mean = cv.mean(gray);
  let averageBrightness = mean[0];
  
  // bright or dark
  if (averageBrightness > 255 || averageBrightness < 63) {
      cv.bitwise_not(gray, gray);
  }
  
  // Apply adaptive thresholding after potentially inverting the image
  cv.adaptiveThreshold(gray, gray, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
  
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  
  // Find contours
  cv.findContours(gray, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let dst = src.clone();

  for (let i = 0; i < contours.size(); ++i) {
      let contour = contours.get(i);
      let perimeter = cv.arcLength(contour, true);
      let epsilon = 0.01 * perimeter;
      let approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, epsilon, true);
      let numVertices = approx.rows;
      let shape;

      if (numVertices === 3) {
        shape = "Triangle";
    } else if (numVertices === 4) {
        let { width, height } = cv.boundingRect(approx);
        let aspectRatio = width / height;
        if (Math.abs(aspectRatio - 1) < 0.2) {
            shape = "Square";
            shapeCount["Quadrilateral"]++;
        } else if (aspectRatio > 1.5 && aspectRatio < 3.5) {
            shape = "Rectangle";
            shapeCount["Quadrilateral"]++;
        } else {
            shape = "Quadrilateral";
        }
    } //else if (numVertices === 5) {
        //shape = "Pentagon";
    //} 
    else {
        // Assuming you have access to the area and perimeter of the shape
        let area = cv.contourArea(approx);
        let perimeter = cv.arcLength(approx, true);
        let circularity = 4 * Math.PI * area / (perimeter * perimeter);
    
        if (circularity > 0.9 && circularity <= 1.1) { // Adjust the range as needed
            shape = "Circle";
        } else {
            shape = "Ellipse";
        }
    }
    
      shapeCount[shape]++;

      let moments = cv.moments(contour, false);
      let x = moments.m10 / moments.m00;
      let y = moments.m01 / moments.m00;
      let center = new cv.Point(x, y);

      cv.drawContours(dst, contours, i, new cv.Scalar(255, 0, 0, 255), 2, cv.LINE_8, hierarchy, 0);
      cv.putText(dst, shape, center, cv.FONT_HERSHEY_COMPLEX, 0.5, new cv.Scalar(0, 0, 255, 255), 2);

      // Draw a small circle at the centroid
      cv.circle(dst, center, 3, new cv.Scalar(0, 255, 0, 255), -1);

      contour.delete();
      approx.delete();

      let colorText = getColorText(src, x, y);
      cv.putText(dst, colorText, new cv.Point(x, y - 20), cv.FONT_HERSHEY_COMPLEX, 0.5, new cv.Scalar(0, 0, 255, 255), 2);
      colorCounts[colorText.toLowerCase()]++;
  }

  cv.imshow('imageCanvas', dst);
  src.delete();
  gray.delete();
  hierarchy.delete();
  contours.delete();
  dst.delete();

  updateCounts();

  this.disabled = false;
};

function updateCounts() {
  let shapeCountDiv = document.getElementById('shapeCount');
  shapeCountDiv.innerHTML = "<h2>Shape Count:</h2>";
  for (let shape in shapeCount) {
      shapeCountDiv.innerHTML += "<p>" + shape + ": " + shapeCount[shape] + "</p>";
  }

  let colorCountDiv = document.getElementById('colorCount');
  colorCountDiv.innerHTML = "<h2>Color Count:</h2><ul>";
  for (let color in colorCounts) {
      colorCountDiv.innerHTML += '<li>' + color + ': ' + colorCounts[color] + '</li>';
  }
  colorCountDiv.innerHTML += '</ul>';
}

function getColorText(src, x, y) {
  let pixel = src.ucharPtr(y, x);
  let r = pixel[0];
  let g = pixel[1];
  let b = pixel[2];

  let colorDistances = {
      "Yellow": Math.sqrt(Math.pow(r - 255, 2) + Math.pow(g - 255, 2) + Math.pow(b, 2)),
      "Red": Math.sqrt(Math.pow(r - 255, 2) + Math.pow(g, 2) + Math.pow(b, 2)),
      "Blue": Math.sqrt(Math.pow(r, 2) + Math.pow(g, 2) + Math.pow(b - 255, 2)),
      "Green": Math.sqrt(Math.pow(r, 2) + Math.pow(g - 255, 2) + Math.pow(b, 2))
  };

  let minDistance = Infinity;
  let detectedColor = "Unknown";
  for (let color in colorDistances) {
      if (colorDistances[color] < minDistance) {
          minDistance = colorDistances[color];
          detectedColor = color;
      }
  }

  return detectedColor;
}

document.getElementById('downloadButton').onclick = function() {
  this.href = document.getElementById("imageCanvas").toDataURL();
  this.download = "image.png";
};

function onOpenCvReady() {
  document.body.classList.remove("loading");
}
