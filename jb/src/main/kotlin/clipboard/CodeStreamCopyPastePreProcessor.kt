package com.codestream.clipboard

import com.codestream.agentService
import com.codestream.extensions.lspPosition
import com.codestream.extensions.uri
import com.codestream.protocols.agent.UserDidCopyParams
import com.intellij.codeInsight.editorActions.CopyPastePreProcessor
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.RawText
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiFile
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import org.eclipse.lsp4j.Range

class CodeStreamCopyPastePreProcessor : CopyPastePreProcessor {
    override fun preprocessOnCopy(
        file: PsiFile?,
        startOffsets: IntArray?,
        endOffsets: IntArray?,
        text: String?
    ): String? {
        val agent = file?.project?.agentService
        val document = file?.let { FileDocumentManager.getInstance().getDocument(it.virtualFile) }
        val uri = document?.uri
        if (agent != null && document != null && uri != null && text != null && startOffsets != null && endOffsets != null) {
            val start = document.lspPosition(startOffsets[0])
            val end = document.lspPosition(endOffsets[0])
            val range = Range(start, end)
            GlobalScope.launch {
                agent.userDidCopy(UserDidCopyParams(range, text, uri))
            }
        }
        return null
    }

    override fun preprocessOnPaste(
        project: Project?,
        file: PsiFile?,
        editor: Editor?,
        text: String?,
        rawText: RawText?
    ): String {
        return text!!
    }
}
