package com.codestream.editor

import com.intellij.codeInsight.hints.presentation.BasePresentation
import com.intellij.codeInsight.hints.presentation.InlayTextMetricsStorage
import com.intellij.ide.ui.AntialiasingType
import com.intellij.openapi.editor.markup.EffectType
import com.intellij.openapi.editor.markup.TextAttributes
import com.intellij.ui.paint.EffectPainter
import java.awt.Color
import java.awt.Graphics2D
import java.awt.RenderingHints

class SlackSnippetPresentation(
    private val metricsStorage: InlayTextMetricsStorage,
    val isSmall: Boolean,
    var text: String
) : BasePresentation() {
    override val width: Int
        get() = getMetrics().getStringWidth(text)
    override val height: Int
        get() = (getMetrics().fontHeight + 1) * text.split("\n").size

    private fun getMetrics() = metricsStorage.getFontMetrics(isSmall)


    override fun paint(g: Graphics2D, attributes: TextAttributes) {
        val savedHint = g.getRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING)
        try {
            val foreground = attributes.foregroundColor
            // if (foreground != null) {
                val metrics = getMetrics()
                val font = metrics.font
                g.font = font
                g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, AntialiasingType.getKeyForCurrentScope(false))
                g.color = Color.gray//foreground

                val lines = text.split("\n")
                lines.forEachIndexed { i, s ->
                    g.drawString(s, 20, metrics.fontBaseline + (i * (metrics.fontHeight + 1)))
                }
                // g.drawString(text, 0, metrics.fontBaseline)

                val effectColor = attributes.effectColor
                if (effectColor != null) {
                    g.color = effectColor
                    when (attributes.effectType) {
                        EffectType.LINE_UNDERSCORE -> EffectPainter.LINE_UNDERSCORE.paint(g, 0, metrics.ascent, width, metrics.descent, font)
                        EffectType.BOLD_LINE_UNDERSCORE -> EffectPainter.BOLD_LINE_UNDERSCORE.paint(g, 0, metrics.ascent, width, metrics.descent, font)
                        EffectType.STRIKEOUT -> EffectPainter.STRIKE_THROUGH.paint(g, 0, metrics.ascent, width, height, font)
                        EffectType.WAVE_UNDERSCORE -> EffectPainter.WAVE_UNDERSCORE.paint(g, 0, metrics.ascent, width, metrics.descent, font)
                        EffectType.BOLD_DOTTED_LINE -> EffectPainter.BOLD_DOTTED_UNDERSCORE.paint(g, 0, metrics.ascent, width, metrics.descent, font)
                        else -> {}
                    }
                }
            // }
        }
        finally {
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, savedHint)
        }
    }

    override fun toString(): String = text
}
