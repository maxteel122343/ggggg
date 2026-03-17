package com.aigesture.agent

class GestureExecutor(private val accessibilityService: AccessibilityGestureService) {

    fun executeSequence(gestures: List<Gesture>) {
        gestures.forEach { gesture ->
            accessibilityService.executeGesture(
                gesture.type,
                gesture.x,
                gesture.y,
                gesture.duration
            )
            Thread.sleep(gesture.delay)
        }
    }
}

data class Gesture(
    val type: String,
    val x: Float,
    val y: Float,
    val duration: Long,
    val delay: Long
)
