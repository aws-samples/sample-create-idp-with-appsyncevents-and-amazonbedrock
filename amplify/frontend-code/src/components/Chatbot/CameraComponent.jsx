import { Button, useTheme } from "@aws-amplify/ui-react";
import { useState, useRef } from "react";
import { useFloating } from '@floating-ui/react';

import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

const CameraComponent = (props) => {
  const { tokens } = useTheme();

  const [videoOn, setVideoOn] = useState(false)
  const [mediaStream, setMediaStream] = useState();
  const [capturedImage, setCapturedImage] = useState();
  const [croppedImage, setCroppedImage] = useState();
  const canvasRef = useRef();
  const videoRef = useRef();
  const cropperRef = useRef(null);
  const {refs, floatingStyles} = useFloating({placement: 'top-left', strategy: 'absolute'});
  
  const onCrop = () => {
    const cropper = cropperRef.current?.cropper;
    const tmpCroppedImage = cropper.getCroppedCanvas().toDataURL();
    setCroppedImage(tmpCroppedImage);
    props.setCameraImage(tmpCroppedImage)
  };

  const startWebcam = async () => {
    resetState()
    const currentFacingMode = "environment"
    const cameraDeviceId = await switchCamera(currentFacingMode);
    const constraints = {
      audio: false,
      video: {
          deviceId: cameraDeviceId,
          facingMode: currentFacingMode,
      },
    };
    
    try {
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        videoRef.current.srcObject = stream;
        setMediaStream(stream);
        setVideoOn(true);
      });
    } catch (error) {
      console.error("Error accessing webcam", error);
    }
  };

  const captureImage = () => {
    console.log("Capture Image")
    console.log(videoRef.current)
    if (videoRef.current && canvasRef.current) {
      console.log("Creating Image")
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageDataUrl);
      stopWebcam();      
    }
  };

  const resetState = () => {
    stopWebcam();
    setCapturedImage(null);
    props.setCameraImage(null)    
  };

  const stopWebcam = () => {
    setVideoOn(false)    
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
      setMediaStream(null);
    }
  };

  const switchCamera = async (currentFacingMode) => {
    await navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((i) => i.kind == 'videoinput');
      videoDevices.forEach((device) => {
        const capabilities = (device).getCapabilities();
        if (capabilities.facingMode && capabilities.facingMode.indexOf(currentFacingMode) >= 0 && capabilities.deviceId) {
          return capabilities.deviceId;
        }
      });
    });
  }

  const imageOn = capturedImage != null;
  const videoClass = videoOn ? "cameraArea" : "cameraArea hideArea";
  const imageClass = !videoOn ? "cameraImage" : "cameraImage hideArea";
  const canvasClass = "hideArea";

  return (
    <>
    <div ref={refs.setReference} className="chatbotImageFormArea">
      <button type="button" onClick={startWebcam} className="chatbotCameraButton">
      </button>
    </div>
    <div id="cameraCanvas" ref={refs.setFloating} style={floatingStyles} className="cameraCanvasArea" aspectRatio={'cover'}>
      <>
        <>
          { imageOn && !videoOn ? (
            <>
              <Cropper
                style={{ height: "75%", width: "75%" }}
                guides={false}
                src={capturedImage}
                crop={onCrop}
                ref={cropperRef}
              />
              <div id="cameraBtnListCanvas" className="cameraBtnListCanvasArea">
                <Button color="white" borderColor={"purple"} backgroundColor={"purple"} onClick={startWebcam} size="small">
                  Recapture
                </Button>
                <Button color="white" borderColor={"purple"} backgroundColor={"purple"} onClick={resetState} size="small">
                  Close
                </Button>
              </div>
            </>
            ) : (<></>)
          }
        </>
        <video className={videoClass} ref={videoRef} playsInline={true} muted={true} autoPlay={true}/>
        { !imageOn && videoOn ? (
            <div id="cameraBtnListCanvas" className="cameraBtnListCanvasArea">
              <Button color="white" borderColor={"purple"} backgroundColor={"purple"} onClick={captureImage} size="small">
                Capture Image
              </Button>
              <Button color="white" borderColor={"purple"} backgroundColor={"purple"} onClick={resetState} size="small">
                Close
              </Button>
            </div>
          ) : (<></>)
        }
        <canvas className={canvasClass} ref={canvasRef} />
      </>
    </div>
    </>    
  );
};

export default CameraComponent;