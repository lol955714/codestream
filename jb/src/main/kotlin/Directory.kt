package com.codestream

import com.codestream.agent.AgentService
import com.codestream.authentication.AuthenticationService
import com.codestream.editor.EditorService
import com.codestream.notification.NotificationComponent
import com.codestream.review.ReviewService
import com.codestream.session.SessionService
import com.codestream.settings.SettingsService
import com.codestream.telemetry.TelemetryService
import com.codestream.webview.WebViewService
import com.intellij.openapi.components.ServiceManager
import com.intellij.openapi.project.Project

val Project.codeStream: CodeStreamComponent?
    get() =
        if (!isDisposed) getComponent(CodeStreamComponent::class.java)
        else null

val Project.notificationComponent: NotificationComponent?
    get() =
        if (!isDisposed) getComponent(NotificationComponent::class.java)
        else null

val Project.agentService: AgentService?
    get() = getServiceIfNotDisposed(AgentService::class.java)

val Project.authenticationService: AuthenticationService?
    get() = getServiceIfNotDisposed(AuthenticationService::class.java)

val Project.editorService: EditorService?
    get() = getServiceIfNotDisposed(EditorService::class.java)

val Project.sessionService: SessionService?
    get() = getServiceIfNotDisposed(SessionService::class.java)

val Project.settingsService: SettingsService?
    get() = getServiceIfNotDisposed(SettingsService::class.java)

val Project.webViewService: WebViewService?
    get() = getServiceIfNotDisposed(WebViewService::class.java)

val Project.reviewService: ReviewService?
    get() = getServiceIfNotDisposed(ReviewService::class.java)

val Project.telemetryService: TelemetryService?
    get() = getServiceIfNotDisposed(TelemetryService::class.java)

fun <T : Any> Project.getServiceIfNotDisposed(serviceClass: Class<T>): T? =
    if (!isDisposed) ServiceManager.getService(this, serviceClass)
    else null
