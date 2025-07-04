import { Button, useTheme } from "@aws-amplify/ui-react";
import { useState, useRef, useEffect } from "react";
import { useFloating } from "@floating-ui/react";

import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

const CameraComponent = (props) => {
  const { tokens } = useTheme();

  const [videoOn, setVideoOn] = useState(false);
  const [videoStarting, setVideoStarting] = useState(false);
  const [mediaStream, setMediaStream] = useState();
  const [capturedImage, setCapturedImage] = useState();
  const [croppedImage, setCroppedImage] = useState();
  const canvasRef = useRef();
  const videoRef = useRef();
  const cropperRef = useRef(null);
  const { refs, floatingStyles } = useFloating({
    transform: true,
    placement: "right-start",
    strategy: "absolute",
  });

  // Start webcam automatically when component mounts
  useEffect(() => {
    startWebcam();
    
    // Cleanup function to stop webcam when component unmounts
    return () => {
      stopWebcam();
    };
  }, []);

  const onCrop = () => {
    const cropper = cropperRef.current?.cropper;
    const tmpCroppedImage = cropper.getCroppedCanvas().toDataURL();
    setCroppedImage(tmpCroppedImage);
    props.setCameraImage(tmpCroppedImage);
  };

  const uploadPicture = async () => {
    const uuid = crypto.randomUUID();
    await props.uploadDocument(
      `documents/camera-${uuid}.jpeg`,
      croppedImage,
      true
    );
    resetState();
  };

  const startWebcam = async () => {
    resetState();
    const currentFacingMode = "environment";
    const cameraDeviceId = await switchCamera(currentFacingMode);
    const constraints = {
      audio: false,
      video: {
        deviceId: cameraDeviceId,
        facingMode: currentFacingMode,
      },
    };

    try {
      setVideoStarting(true);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set video on after we have the stream
      setVideoOn(true);
      setMediaStream(stream);
      
      // Use setTimeout to ensure the video element is rendered after state update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setVideoStarting(false);
        } else {
          console.error("Video element not found after render");
          setVideoStarting(false);
          setVideoOn(false);
        }
      }, 200);
      
    } catch (error) {
      console.error("Error accessing webcam", error);
      setVideoStarting(false);
      setVideoOn(false);
    }
  };

  const captureImage = async () => {
    console.log("Capture Image");
    console.log(videoRef.current);
    if (videoRef.current && canvasRef.current) {
      console.log("Creating Image");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageDataUrl);
      setCroppedImage(imageDataUrl);
      stopWebcam();
    }
  };

  const resetState = () => {
    stopWebcam();
    setCapturedImage(null);
    setCroppedImage(null);
    props.setCameraImage(null);
  };

  const closeWebcam = () => {
    props.setShowCamera(false);
    stopWebcam()
  }

  const stopWebcam = () => {
    setVideoStarting(false);
    setVideoOn(false);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
      setMediaStream(null);
    }
  };

  const switchCamera = async (currentFacingMode) => {
    await navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((i) => i.kind == "videoinput");
      videoDevices.forEach((device) => {
        const capabilities = device.getCapabilities();
        if (
          capabilities.facingMode &&
          capabilities.facingMode.indexOf(currentFacingMode) >= 0 &&
          capabilities.deviceId
        ) {
          return capabilities.deviceId;
        }
      });
    });
  };

  const imageOn = capturedImage != null;
  const videoClass = videoOn ? "cameraArea" : "cameraArea hideArea";
  const imageClass = !videoOn ? "cameraImage" : "cameraImage hideArea";
  const canvasClass = "hideArea";

  return (
    <>
      {imageOn || videoOn || videoStarting ? (
        <div
          id="cameraCanvas"
          className="cameraCanvasArea"
          aspectRatio={"cover"}
        >
            <>
              <>
                {imageOn && !videoOn ? (
                  <>
                    <div className="cropper-wrapper">
                      <Cropper
                        style={{ height: "100%", width: "100%" }}
                        guides={false}
                        src={capturedImage}
                        crop={onCrop}
                        ref={cropperRef}
                      />
                    </div>
                    <div
                      id="cameraBtnListCanvas"
                      className="cameraBtnListCanvasArea"
                    >
                      <button
                        className="modern-camera-btn primary-btn"
                        onClick={uploadPicture}
                      >
                        <span className="btn-icon">📤</span>
                        <span className="btn-text">Upload</span>
                      </button>
                      <button
                        className="modern-camera-btn secondary-btn"
                        onClick={startWebcam}
                      >
                        <span className="btn-icon">🔄</span>
                        <span className="btn-text">Recapture</span>
                      </button>
                      <button
                        className="modern-camera-btn danger-btn"
                        onClick={closeWebcam}
                      >
                        <span className="btn-icon">✕</span>
                        <span className="btn-text">Close</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </>
              <video
                className={videoClass}
                ref={videoRef}
                playsInline={true}
                muted={true}
                autoPlay={true}
              />
              {!imageOn && videoOn ? (
                <div
                  id="cameraBtnListCanvas"
                  className="cameraBtnListCanvasArea"
                >
                  <button
                    className="modern-camera-btn primary-btn"
                    onClick={captureImage}
                  >
                    <span className="btn-icon">📸</span>
                    <span className="btn-text">Capture Image</span>
                  </button>
                  <button
                    className="modern-camera-btn danger-btn"
                    onClick={closeWebcam}
                  >
                    <span className="btn-icon">✕</span>
                    <span className="btn-text">Close</span>
                  </button>
                </div>
              ) : (
                <></>
              )}
              <canvas className={canvasClass} ref={canvasRef} />
            </>
          </div>
        ) : (
          <></>
        )}
    </>
  );
};

export default CameraComponent;
