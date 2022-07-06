package com.codestream.editor

import com.codestream.agentService
import com.codestream.extensions.uri
import com.codestream.protocols.agent.GetBlameParams
import com.intellij.codeInsight.hints.presentation.InlayTextMetricsStorage
import com.intellij.codeInsight.hints.presentation.PresentationFactory
import com.intellij.codeInsight.hints.presentation.PresentationRenderer
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.event.CaretEvent
import com.intellij.openapi.editor.event.CaretListener
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.editor.event.SelectionListener
import com.intellij.openapi.editor.impl.EditorImpl
import com.intellij.openapi.project.Project
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.future.await
import kotlinx.coroutines.launch
import java.util.concurrent.CompletableFuture

class LineLevelBlameService(val project: Project) : SelectionListener {

    private val logger = Logger.getInstance(LineLevelBlameService::class.java)

    fun add(editor: Editor) {
        if (editor !is EditorImpl) return
        val uri = editor.document.uri ?: return
        val agent = project.agentService ?: return
        val presentationFactory = PresentationFactory(editor)
        val textMetricsStorage = InlayTextMetricsStorage(editor)
        val lineBlames = mutableMapOf<Int, String>()
        var isLoadingBlame: CompletableFuture<Unit>? = null
        var inlay: Disposable? = null
        var lastLine: Int = -1

        fun setInlay(line: Int, renderer: PresentationRenderer) {
            ApplicationManager.getApplication().invokeLater {
                synchronized(this) {
                        inlay?.dispose()
                        inlay = editor.inlayModel.addAfterLineEndElement(editor.visualLineStartOffset(line), false, renderer)
                }
            }
        }

        suspend fun getBlame(line: Int): String? {
            isLoadingBlame?.await()
            if (!lineBlames.containsKey(line)) {
                isLoadingBlame = CompletableFuture<Unit>()
                try {
                    var lineStart = line
                    var lineEnd = line
                    if (lineBlames.containsKey(line - 1)) {
                        lineEnd = line + 10
                    } else if (lineBlames.contains(line + 1)) {
                        lineStart = line - 10
                    } else {
                        lineStart = line - 5
                        lineEnd = line + 5
                    }
                    lineStart = lineStart.coerceAtLeast(0)
                    lineEnd = lineEnd.coerceAtMost(editor.document.lineCount - 1)

                    val blame = agent.getBlame(GetBlameParams(
                        uri,
                        lineStart,
                        lineEnd
                    )).blame
                    blame.forEachIndexed { index, s ->
                        lineBlames[index + lineStart] = s
                    }
                } catch (ex: Exception) {
                    logger.warn(ex)
                } finally {
                    isLoadingBlame?.complete(Unit)
                }
            }

            return lineBlames[line]
        }

        editor.caretModel.addCaretListener(object : CaretListener {
            override fun caretPositionChanged(e: CaretEvent) {
                if (e.newPosition.line != lastLine) {
                    lastLine = e.newPosition.line
                    GlobalScope.launch {
                        val blame = getBlame(lastLine) ?: return@launch
                        val textPresentation = presentationFactory.smallText(blame)
                        val insetPresentation = presentationFactory.inset(textPresentation, 0, 0, textMetricsStorage.getFontMetrics(true).offsetFromTop(), 0)
                        val renderer = PresentationRenderer(insetPresentation)
                        setInlay(e.newPosition.line, renderer)
                    }
                }
            }
        })

        editor.document.addDocumentListener(object : DocumentListener {
            override fun documentChanged(event: DocumentEvent) {
                lineBlames.clear()
            }
        })
    }

    fun remove(editor: Editor) {

    }

}
