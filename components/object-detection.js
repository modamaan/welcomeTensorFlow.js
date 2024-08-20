"use client";
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import { throttle } from "lodash";
import party from "party-js"; // Import party-js

const ObjectDetection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCurtainOpen, setIsCurtainOpen] = useState(false);
  const [curtainWidth, setCurtainWidth] = useState("100%"); // Curtain starts fully closed
  const [confettiLaunched, setConfettiLaunched] = useState(false); // State to manage confetti launch

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const curtainRef = useRef(null);

  let detectInterval;

  // Initialize HandPose model
  async function runHandPose() {
    try {
      setIsLoading(true);
      const model = await handpose.load();
      setIsLoading(false);

      detectInterval = setInterval(() => {
        detectHandGestures(model);
      }, 100); // Check every 100ms
    } catch (error) {
      console.error("Error loading HandPose model:", error);
      setIsLoading(false);
    }
  }

  // Detect hand gestures and control curtain
  async function detectHandGestures(model) {
    if (
      canvasRef.current &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      try {
        const predictions = await model.estimateHands(video);
        const context = canvasRef.current.getContext("2d");

        // Apply transformation to mirror the canvas context
        context.save(); // Save the current context state
        context.scale(-1, 1); // Mirror horizontally
        context.translate(-video.videoWidth, 0); // Adjust translation after scaling

        renderPredictions(predictions, context);

        context.restore(); // Restore the original context state

        if (predictions.length > 0) {
          const hand = predictions[0];

          // Hand open detection logic
          const thumbTip = hand.landmarks[4]; // Thumb tip
          const indexTip = hand.landmarks[8]; // Index finger tip

          // Calculate distance between thumb tip and index finger tip
          const distance = Math.sqrt(
            Math.pow(indexTip[0] - thumbTip[0], 2) +
            Math.pow(indexTip[1] - thumbTip[1], 2)
          );

          const threshold = 50; // Adjust this value based on your testing

          const isHandOpen = distance > threshold;

          if (isHandOpen) {
            // Reduce curtain width gradually (open curtain)
            setCurtainWidth((prevWidth) => {
              const currentWidth = parseFloat(prevWidth);
              const newWidth = Math.max(currentWidth - 1, 0) + "%"; // Decrease width down to 0%

              // Trigger confetti when curtain is fully open
              if (newWidth === "0%" && !confettiLaunched) {
                party.confetti(curtainRef.current, {
                  count: party.variation.range(30, 70),
                  angle: party.variation.range(60, 120),
                  spread: party.variation.range(30, 70),
                });
                setConfettiLaunched(true);
              }

              return newWidth;
            });
            if (!isCurtainOpen) {
              setIsCurtainOpen(true);
            }
          } else {
            // Stop opening animation, keep the curtain at current width
            setIsCurtainOpen(true);
          }
        } else {
          // If no hand detected, keep the curtain in its current state
          setIsCurtainOpen(false);
        }
      } catch (error) {
        console.error("Error detecting hand gestures:", error);
      }
    }
  }

  useEffect(() => {
    runHandPose();

    return () => {
      clearInterval(detectInterval); // Cleanup interval on component unmount
    };
  }, []);

  return (
    <div className="relative">
      {/* Curtain */}
      <div
        ref={curtainRef}
        className={`fixed top-0 left-0 h-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 
        flex items-center justify-center text-white text-4xl font-bold transition-all duration-700 ease-in-out`}
        style={{ width: curtainWidth }}
      >
      </div>

      {isLoading ? (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-gray-900 p-4 rounded-md">
          Loading HandPose Model...
        </div>
      ) : (
        <div className="relative flex justify-center items-center">
          {/* webcam */}
          <Webcam
            ref={webcamRef}
            className="rounded-md w-1/4 h-1/4"
            mirrored={true}
            muted
          />
          {/* canvas */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-1/4 h-1/4"
          />
        </div>
      )}
    </div>
  );
};

// Render the predictions on the canvas
const renderPredictions = (predictions, ctx) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Fonts
  const font = "16px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";

  predictions.forEach((prediction) => {
    const landmarks = prediction.landmarks;

    // Draw hand landmarks
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });
};

// Throttled function to play audio
const playAudio = throttle(() => {
  try {
    const audio = new Audio("/public_pols-aagyi-pols.mp3");
    audio.play();
  } catch (error) {
    console.error("Error playing audio:", error);
  }
}, 2000);

export default ObjectDetection;





// import React, {useEffect, useRef, useState} from "react";
// import Webcam from "react-webcam";
// import {load as cocoSSDLoad} from "@tensorflow-models/coco-ssd";
// import * as tf from "@tensorflow/tfjs";
// import {renderPredictions} from "@/utils/render-predictions";

// let detectInterval;

// const ObjectDetection = () => {
//   const [isLoading, setIsLoading] = useState(true);

//   const webcamRef = useRef(null);
//   const canvasRef = useRef(null);

//   async function runCoco() {
//     setIsLoading(true); // Set loading state to true when model loading starts
//     const net = await cocoSSDLoad();
//     setIsLoading(false); // Set loading state to false when model loading completes

//     detectInterval = setInterval(() => {
//       runObjectDetection(net); // will build this next
//     }, 10);
//   }

//   async function runObjectDetection(net) {
//     if (
//       canvasRef.current &&
//       webcamRef.current !== null &&
//       webcamRef.current.video?.readyState === 4
//     ) {
//       canvasRef.current.width = webcamRef.current.video.videoWidth;
//       canvasRef.current.height = webcamRef.current.video.videoHeight;

//       // find detected objects
//       const detectedObjects = await net.detect(
//         webcamRef.current.video,
//         undefined,
//         0.6
//       );

//       //   console.log(detectedObjects);

//       const context = canvasRef.current.getContext("2d");
//       renderPredictions(detectedObjects, context);
//     }
//   }

//   const showmyVideo = () => {
//     if (
//       webcamRef.current !== null &&
//       webcamRef.current.video?.readyState === 4
//     ) {
//       const myVideoWidth = webcamRef.current.video.videoWidth;
//       console.log("video",webcamRef.current);
      
//       const myVideoHeight = webcamRef.current.video.videoHeight;

//       webcamRef.current.video.width = myVideoWidth;
//       webcamRef.current.video.height = myVideoHeight;
//     }
//   };

//   useEffect(() => {
//     runCoco();
//     showmyVideo();
//   }, []);

//   return (
//     <div className="mt-8">
//       {isLoading ? (
//         <div className="gradient-text">
//           <div className="gradient-text">Loading AI Model...</div>
//         </div>
//       ) : (
//         <div className="relative flex justify-center items-center gradient p-1.5 rounded-md">
//           {/* webcam */}
//           <Webcam
//             ref={webcamRef}
//             className="rounded-md w-full lg:h-[720px]"
//             muted
//           />
//           {/* canvas */}
//           <canvas
//             ref={canvasRef}
//             className="absolute top-0 left-0 z-99999 w-full lg:h-[720px]"
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default ObjectDetection;