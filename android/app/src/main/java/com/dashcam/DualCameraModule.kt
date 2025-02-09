package com.dashcam

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DualCameraModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DualCameraModule"
    }

    @ReactMethod
    fun launchDualCameraActivity() {
        val context = reactApplicationContext
        val intent = Intent(context, DualCameraActivity::class.java)
        // Add flag for a new activity from non-activity context:
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
