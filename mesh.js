//intialize needed variables
const video = document.getElementById("video");
const effectsCanvas = document.getElementById("effectsCanvas");
let ctx,effectsCtx;
let videoWidth, videoHeight; 
let closedColour = 'rgba(255,153,204,0.5)';
let openColour = 'rgba(141, 0, 57, 0.5)';
let filter = 0;
let lastFilter = 3;

//open and size camera
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            videoWidth = video.videoWidth;
            videoHeight = video.videoHeight;
            video.width = videoWidth;
            video.height = videoHeight;
            resolve(video);
        }; 
    });
}

//create and size canvas
async function setupCanvas() {

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    effectsCanvas.width = videoWidth;
    effectsCanvas.height = videoHeight;

    ctx = canvas.getContext('2d');
    effectsCtx = effectsCanvas.getContext('2d');

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    effectsCtx.translate(canvas.width, 0);
    effectsCtx.scale(-1, 1);

    ctx.fillStyle = "green";
}

//detect all tracked points location on the face
async function loadFaceLandmarkDetectionModel() {
    return faceLandmarksDetection
                .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
                      {maxFaces: 1});
}

async function renderPrediction() {
    const predictions = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: false
    });

    ctx.drawImage(
        video, 0, 0, video.width, video.height, 0, 0, canvas.width, canvas.height);
    
    if (filter == 0){

    //start filter 1
    //filter 1 colors in the lips of the face and changes colors when the mouth is open
    if (predictions.length > 0) {
    predictions.forEach(prediction => {
        const keypoints = prediction.scaledMesh;

        //start upper lip
        let x = keypoints[61][0];
        let y = keypoints[61][1];

        ctx.beginPath();
        ctx.moveTo(x, y);

        const upperlipkeys = [185, 40, 39, 37, 0, 267, 269, 270, 409, 291,308,415,310,311,312,13,82,81,80,191,78];
        for (let a = 0; a < upperlipkeys.length; a++) {
            x = keypoints[upperlipkeys[a]][0];
            y = keypoints[upperlipkeys[a]][1];
            ctx.lineTo(x, y);
        }
        ctx.closePath();

        let lipTop = keypoints[13][1];
        let lipBottom = keypoints[14][1];
        let threshold = 4.0;

        //If mouth is open, Turn top lip Green
        if (lipBottom - lipTop > threshold) {
            ctx.fillStyle = openColour;
        } else {
            ctx.fillStyle = closedColour;
        }

        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 153, 204, 0.75)';
        ctx.stroke();

        //start lower lip
        ctx.beginPath();
        x = keypoints[146][0];
        y = keypoints[146][1];
        ctx.moveTo(x, y);

        const lowerlipkeys = [91, 181, 84, 17, 314, 405, 321, 375, 291,308,324,318,402,317,14,87,178,88,95,78];
        
        for (let b = 0; b < lowerlipkeys.length; b++) {
            x = keypoints[lowerlipkeys[b]][0];
            y = keypoints[lowerlipkeys[b]][1];
            ctx.lineTo(x, y);
        }

        ctx.closePath();

        //left lip corner
        leftX = keypoints[78][0];
        //right lip corner   
        rightX = keypoints[308][0];
        //find vertical axis
        centerY = (keypoints[14][1] + keypoints[87][1]) / 2;

        //add a gradient to the lip
        const gradient = ctx.createLinearGradient(leftX, centerY, rightX, centerY);
        gradient.addColorStop(0, "rgba(255, 153, 204, 0.5)");
        gradient.addColorStop(1, "rgba(0, 153, 204, 0.5)");

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 153, 204, 0.75)';
        ctx.stroke();


            });
        }
    //start filter 2
    //filter 2 positions an image of crown on the forehead
    } else if (filter == 1){
    if (predictions.length > 0) {
    predictions.forEach(prediction => {
        const keypoints = prediction.scaledMesh;

        //add crown
        const crown = document.getElementById("crown");
        leftx = keypoints[21][0];
        lefty = keypoints[21][1];
        rightx = keypoints[251][0];
        righty = keypoints[251][1];

        crownWidth = rightx-leftx;
        crownHeight = 100;

        ctx.drawImage(crown,leftx,lefty-90,crownWidth,crownHeight);

        });
    }

    //start filter 3
    //filter 3 shows what points on the face are beign tracked by drawing a point on each location
    } else if (filter == 2) {

    //Generating points for landmarks 
    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;
            for (let i = 0; i < keypoints.length; i++) {
                const x = keypoints[i][0];
                const y = keypoints[i][1];

                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, 1.5 * Math.PI);
                ctx.fillStyle = 'rgb(131, 15, 255)';
                ctx.fill();
            }
        });
    }
    //start filter 4
    //filter 4 draws points on the screen when someone opens theire mouth. Point will be assigned a color randomly.
    } else  if (filter == 3){
        if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;

            let lipTop = keypoints[13];
            let lipBottom = keypoints[14];
            let threshold = 4.0;
            let x = lipTop[0]; 
            let y = lipTop[1]; 
            
            //determine colour of point
            let colourState = (Math.random() * 50);

            //if mouth is open, draw circle
            if ((lipBottom[1] - lipTop[1]) > threshold) {
                effectsCtx.beginPath();
                effectsCtx.arc(x, y, 2, 0, 2 * Math.PI);
                if (colourState < 25){
                    effectsCtx.fillStyle = 'rgb(255, 8, 123)';
                } else {
                    effectsCtx.fillStyle = 'rgb(1, 196, 255)';
                }
                
                effectsCtx.fill();
            } else {
                //Do nothing because mouth is not open
            }
        });
    }
    } else {
        //Error
    }
    //end of filters

    window.requestAnimationFrame(renderPrediction);
}

//start the setup of the program
async function main() {
    //Set up camera
    await setupCamera();

    //Set up canvas
    await setupCanvas();

    //Load the model
    model = await loadFaceLandmarkDetectionModel();

    //Render Face Mesh Prediction
    renderPrediction();
}

function nextFilter(){

    //If at the last filter, return to first. This forms a loop thats scrolls through filters each time the button is pressed.
    if (filter == lastFilter){
        filter = 0;
    } else {
        //Go to next filter
        filter = filter+1
    }

}

//Generate new lip colors randomly for filter 1 
function nextColour(){
    let r = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    openColour = `rgba(${r}, ${g}, ${b}, 0.5)`;
    r = Math.floor(Math.random() * 256);
    b = Math.floor(Math.random() * 256);
    g = Math.floor(Math.random() * 256);
    closedColour = `rgba(${r}, ${g}, ${b}, 0.5)`;
}

//return to the default lip colors for filter 1
function orginalColour(){
    closedColour = 'rgba(255,153,204,0.5)';
    openColour = 'rgba(141, 0, 57, 0.5)';

}

//reset the canvas
function clearCanvas(){
    effectsCtx.clearRect(0, 0, canvas.width, canvas.height);
}

main();
