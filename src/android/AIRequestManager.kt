package com.aigesture.agent

import android.content.Context
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AIRequestManager(private val apiKey: String) {

    private val generativeModel = GenerativeModel(
        modelName = "gemini-3-flash-preview",
        apiKey = apiKey
    )

    suspend fun requestAction(command: String, screenContext: String): String = withContext(Dispatchers.IO) {
        val prompt = """
            You are an Android Gesture Agent. 
            User Command: $command
            Screen Context: $screenContext
            Respond with a JSON array of actions:
            { "actions": [ { "gesture": "tap", "x": 500, "y": 1200 } ] }
        """.trimIndent()

        val response = generativeModel.generateContent(prompt)
        return@withContext response.text ?: "{}"
    }
}
