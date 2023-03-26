import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import S3 from "aws-sdk/clients/s3";
import axios from "axios";

const MyUpload = () => {
  const [acceptedFiles, setAcceptedFiles] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const uploadFile = useCallback(async (file) => {
    if (!file) return;
    setIsUploading(true);
    const config = {
      accessKeyId: process.env.REACT_APP_ACESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
      region: process.env.REACT_APP_REGION,
    };
    const bucketName = process.env.REACT_APP_BUCKET;
    const s3 = new S3(config);
    const params = {
      Bucket: bucketName,
      Key: file.name,
      ContentType: file.type,
    };
    const url = await s3.getSignedUrlPromise("putObject", params);
    try {
      const response = await axios.put(url, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          setTimeout(() => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }, 20000);
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });
      if (response.status === 200) {
        setVideoUrl(s3.getSignedUrl("getObject", params));
        setUploadSuccess(true);
        alert("Your video is uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      setProgress(0);
      setAcceptedFiles([]);
      setVideoUrl(null);
    }
  }, []);

  const onDrop = useCallback(
    (files) => {
      setAcceptedFiles(files);
      if (files.length > 0) {
        const previewUrl = URL.createObjectURL(files[0]);
        setVideoUrl(previewUrl);
      }
    },
    [setAcceptedFiles, setVideoUrl]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "video/mp4",
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024, // 1 GB
  });

  return (
    <div className="App">
      <h1>You can upload video</h1>
      <h3>Click button to upload video</h3>
      <div className="container">
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          {videoUrl ? (
            <div className="video-container">
              <video src={videoUrl} controls />
            </div>
          ) : (
            <p>Drag and drop an MP4 file here, or click to select one</p>
          )}
        </div>
        <button
          onClick={() => uploadFile(acceptedFiles[0])}
          className="upload-button"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : <><i className="fas fa-arrow-up"></i> Upload</>}
        </button>
        {isUploading && progress > 0 && progress < 100 && (
          <div className="progress-bar">
            <span>{acceptedFiles[0]?.name} - {progress}%</span>
            <i className="fas fa-times cancel-upload" onClick={() => setIsUploading(false)}></i>
            <div
              className="progress-bar"
              style={{
                position: 'fixed',
                bottom: '20px',
                backgroundColor: "transparent"
              }}
            >
              <span>{progress}%</span>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${progress}%`,
                  width: '4px',
                  height: '100%',
                  backgroundColor: '#007bff',
                  transform: 'translateX(-50%)',
                }}
              ></div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#007bff',
                  borderRadius: '5px',
                  zIndex: -1,
                }}
              ></div>
            </div>
          </div>
        )}
        {uploadSuccess && (
          <div className="success-message">
            <p>Your video is uploaded successfully</p>
            {setAcceptedFiles([])}
            {setVideoUrl(null)}
          </div>
        )}

      </div>
    </div>
  )
}
   
export default MyUpload;