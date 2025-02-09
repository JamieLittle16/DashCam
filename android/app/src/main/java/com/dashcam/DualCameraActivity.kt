package com.dashcam

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.media.MediaRecorder
import android.os.Bundle
import android.util.Size
import android.view.Surface
import android.view.TextureView
import android.widget.FrameLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat

class DualCameraActivity : AppCompatActivity() {

    private lateinit var cameraManager: CameraManager

    // TextureViews for preview: one main and one small overlay.
    private lateinit var mainTextureView: TextureView
    private lateinit var smallTextureView: TextureView

    // Camera IDs
    private var frontCameraId: String? = null
    private var backCameraId: String? = null

    // Camera devices
    private var frontCamera: CameraDevice? = null
    private var backCamera: CameraDevice? = null

    // Capture sessions
    private var frontSession: CameraCaptureSession? = null
    private var backSession: CameraCaptureSession? = null

    // MediaRecorders
    private lateinit var frontRecorder: MediaRecorder
    private lateinit var backRecorder: MediaRecorder

    // Fixed preview size (adjust as needed)
    private val previewSize = Size(1920, 1080)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dualcamera)

        mainTextureView = findViewById(R.id.mainTextureView)
        smallTextureView = findViewById(R.id.smallTextureView)

        cameraManager = getSystemService(CAMERA_SERVICE) as CameraManager

        // Get camera IDs for front and back
        try {
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val lensFacing = characteristics.get(android.hardware.camera2.CameraCharacteristics.LENS_FACING)
                if (lensFacing == android.hardware.camera2.CameraCharacteristics.LENS_FACING_FRONT) {
                    frontCameraId = id
                } else if (lensFacing == android.hardware.camera2.CameraCharacteristics.LENS_FACING_BACK) {
                    backCameraId = id
                }
            }
        } catch (e: CameraAccessException) {
            Toast.makeText(this, "Failed to access cameras: ${e.message}", Toast.LENGTH_SHORT).show()
            finish()
        }

        // Set listeners on TextureViews
        mainTextureView.surfaceTextureListener = mainSurfaceListener
        smallTextureView.surfaceTextureListener = smallSurfaceListener

        // Swap previews on click of the small preview
        smallTextureView.setOnClickListener { swapPreviews() }
    }

    private val mainSurfaceListener = object : TextureView.SurfaceTextureListener {
        override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
            openCamera(frontCameraId, true)
        }
        override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {}
        override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean = true
        override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {}
    }

    private val smallSurfaceListener = object : TextureView.SurfaceTextureListener {
        override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
            openCamera(backCameraId, false)
        }
        override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {}
        override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean = true
        override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {}
    }

    private fun openCamera(cameraId: String?, isFront: Boolean) {
        if (cameraId == null) {
            Toast.makeText(this, "Camera not found", Toast.LENGTH_SHORT).show()
            return
        }
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED ||
           ActivityCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO), 100)
            return
        }
        try {
            cameraManager.openCamera(cameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(device: CameraDevice) {
                    if (isFront) {
                        frontCamera = device
                        setupMediaRecorder(isFront)
                        createCameraSession(device, mainTextureView, frontRecorder)
                    } else {
                        backCamera = device
                        setupMediaRecorder(isFront)
                        createCameraSession(device, smallTextureView, backRecorder)
                    }
                }
                override fun onDisconnected(device: CameraDevice) {
                    device.close()
                }
                override fun onError(device: CameraDevice, error: Int) {
                    device.close()
                    Toast.makeText(this@DualCameraActivity, "Camera error: $error", Toast.LENGTH_SHORT).show()
                }
            }, null)
        } catch (e: CameraAccessException) {
            Toast.makeText(this, "Open camera error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupMediaRecorder(isFront: Boolean) {
        val recorder = MediaRecorder()
        recorder.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            // Set output file path (adjust these paths as needed)
            val outputFile = if (isFront) {
                "${externalCacheDir?.absolutePath}/front_video.mp4"
            } else {
                "${externalCacheDir?.absolutePath}/back_video.mp4"
            }
            setOutputFile(outputFile)
            setVideoEncodingBitRate(5_000_000)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setVideoSize(previewSize.width, previewSize.height)
            setVideoFrameRate(30)
            prepare()
        }
        if (isFront) {
            frontRecorder = recorder
        } else {
            backRecorder = recorder
        }
    }

    private fun createCameraSession(device: CameraDevice, textureView: TextureView, recorder: MediaRecorder) {
        val texture = textureView.surfaceTexture!!
        texture.setDefaultBufferSize(previewSize.width, previewSize.height)
        val previewSurface = Surface(texture)
        val recorderSurface = recorder.surface
        val targets = listOf(previewSurface, recorderSurface)
        device.createCaptureSession(targets, object : CameraCaptureSession.StateCallback() {
            override fun onConfigured(session: CameraCaptureSession) {
                val captureRequest = device.createCaptureRequest(CameraDevice.TEMPLATE_RECORD).apply {
                    addTarget(previewSurface)
                    addTarget(recorderSurface)
                }
                session.setRepeatingRequest(captureRequest.build(), null, null)
                // Optionally, start recording immediately or after both sessions are ready.
                if (device == frontCamera) {
                  // Example: start recording on front camera after configuration.
                  frontRecorder.start()
                } else {
                  backRecorder.start()
                }
            }
            override fun onConfigureFailed(session: CameraCaptureSession) {
                Toast.makeText(this@DualCameraActivity, "Failed to configure the capture session", Toast.LENGTH_SHORT).show()
            }
        }, null)
    }

    // Example swap: Exchange the TextureViews in their parent FrameLayouts.
    private fun swapPreviews() {
        val mainParent = mainTextureView.parent as FrameLayout
        val smallParent = smallTextureView.parent as FrameLayout

        mainParent.removeView(mainTextureView)
        smallParent.removeView(smallTextureView)

        mainParent.addView(smallTextureView)
        smallParent.addView(mainTextureView)
    }

    override fun onDestroy() {
        frontCamera?.close()
        backCamera?.close()
        super.onDestroy()
    }
}
