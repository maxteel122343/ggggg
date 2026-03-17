package com.aigesture.agent

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.Toast

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val apiKeyInput = findViewById<EditText>(R.id.apiKeyInput)
        val saveBtn = findViewById<Button>(R.id.saveBtn)
        val permissionBtn = findViewById<Button>(R.id.permissionBtn)
        val startBtn = findViewById<Button>(R.id.startBtn)

        saveBtn.setOnClickListener {
            val key = apiKeyInput.text.toString()
            // Save to SharedPreferences
            Toast.makeText(this, "API Key Salva", Toast.LENGTH_SHORT).show()
        }

        permissionBtn.setOnClickListener {
            checkOverlayPermission()
            checkAccessibilityPermission()
        }

        startBtn.setOnClickListener {
            startService(Intent(this, OverlayService::class.java))
        }
    }

    private fun checkOverlayPermission() {
        if (!Settings.canDrawOverlays(this)) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
            startActivityForResult(intent, 123)
        }
    }

    private fun checkAccessibilityPermission() {
        // Open accessibility settings
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        startActivity(intent)
    }
}
