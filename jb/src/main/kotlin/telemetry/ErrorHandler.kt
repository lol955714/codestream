package com.codestream.telemetry

import com.codestream.agent.AgentService
import com.codestream.protocols.agent.Ide
import com.codestream.protocols.agent.UserLoggedIn
import com.codestream.system.platform
import com.intellij.diagnostic.LogMessage
import com.intellij.openapi.diagnostic.ErrorReportSubmitter
import com.intellij.openapi.diagnostic.IdeaLoggingEvent
import com.intellij.openapi.diagnostic.SubmittedReportInfo
import com.intellij.util.Consumer
import io.sentry.Sentry
import io.sentry.connection.EventSendCallback
import io.sentry.event.Event
import io.sentry.event.UserBuilder
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.awt.Component

class ErrorHandler : ErrorReportSubmitter() {

    companion object {
        var userLoggedIn: UserLoggedIn? = null
        var agentService: AgentService? = null
        private var _consumer: Consumer<in SubmittedReportInfo>? = null
        private var _environment: String = "prod"
        var environment: String
            get() = _environment
            set(value) {
                _environment = value
                initSentry()
            }

        private fun initSentry() {
            synchronized(ErrorHandler.javaClass) {
                Sentry.init("https://7c34949981cc45848fc4e3548363bb17@sentry.io/1314159?environment=$environment&uncaught.handler.enabled=false")
                Sentry.getContext().addTag("platform", platform.name)
                Sentry.getContext().addTag("ide", Ide.name)
                Sentry.getContext().addTag("ideVersion", Ide.version)
                Sentry.getContext().addTag("ideDetail", Ide.detail)
                Sentry.getContext().addTag("source", "extension")

                Sentry.getStoredClient().addEventSendCallback(object : EventSendCallback {
                    override fun onSuccess(event: Event?) {
                        _consumer?.consume(SubmittedReportInfo(SubmittedReportInfo.SubmissionStatus.NEW_ISSUE))
                    }

                    override fun onFailure(event: Event?, exception: Exception?) {
                        _consumer?.consume(SubmittedReportInfo(SubmittedReportInfo.SubmissionStatus.FAILED))
                    }
                })
            }
        }
    }

    init {
        initSentry()
    }

    override fun getReportActionText(): String {
        return "Report to CodeStream"
    }

    override fun submit(
        events: Array<out IdeaLoggingEvent>,
        additionalInfo: String?,
        parentComponent: Component,
        consumer: Consumer<in SubmittedReportInfo>
    ): Boolean {
        _consumer = consumer

        userLoggedIn?.let {
            Sentry.getContext().user = UserBuilder()
                .setId(it.userId)
                .setUsername(it.user.username)
                .setEmail(it.user.email)
                .build()
        }

        for (event in events) {
            val logMessage = event.data as? LogMessage
            logMessage?.let {
                Sentry.capture(it.throwable)
                GlobalScope.launch {
                    agentService?.reportMessage(it.throwable)
                }
            }
        }

        return true
    }
}
