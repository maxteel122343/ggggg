package com.aigesture.agent

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityNodeInfo

class UIElementDetector {

    fun scanScreen(rootNode: AccessibilityNodeInfo?): List<UIElement> {
        val elements = mutableListOf<UIElement>()
        traverseNodes(rootNode, elements)
        return elements
    }

    private fun traverseNodes(node: AccessibilityNodeInfo?, elements: MutableList<UIElement>) {
        if (node == null) return
        
        if (node.isClickable) {
            elements.add(UIElement(
                text = node.text?.toString() ?: "",
                contentDescription = node.contentDescription?.toString() ?: "",
                className = node.className?.toString() ?: "",
                bounds = node.toString() // Simplified for demo
            ))
        }

        for (i in 0 until node.childCount) {
            traverseNodes(node.getChild(i), elements)
        }
    }
}

data class UIElement(
    val text: String,
    val contentDescription: String,
    val className: String,
    val bounds: String
)
