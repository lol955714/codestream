package com.codestream.telemetry

class TelemetryOptions(
    val browserIngestKey: String?,
    val accountId: String?,
    val webviewAppId: String?,
    val webviewAgentId: String?,
    val telemetryEndpoint: String?,
    val licenseIngestKey: String?,
    val error: String?
) {
    fun webviewOptions(): WebviewTelemetryOptions? {
        val requiredProperties = listOf(browserIngestKey, accountId, webviewAppId, webviewAgentId)
        return if (requiredProperties.none { it.isNullOrBlank() }) {
            WebviewTelemetryOptions(browserIngestKey!!, accountId!!, webviewAppId!!, webviewAgentId!!)
        } else {
            null
        }
    }

    fun agentOptions(): AgentTelemetryOptions? {
        val requiredProperties = listOf(telemetryEndpoint, licenseIngestKey)
        return if (requiredProperties.none { it.isNullOrBlank() }) {
            AgentTelemetryOptions(telemetryEndpoint!!, licenseIngestKey!!)
        } else {
            null
        }
    }
}

class WebviewTelemetryOptions(
    val browserIngestKey: String,
    val accountId: String,
    val webviewAppId: String,
    val webviewAgentId: String
)

class AgentTelemetryOptions(
    val telemetryEndpoint: String,
    val licenseIngestKey: String
) {
    fun environment(): Map<String, String> = mapOf(
        "NEW_RELIC_HOST" to telemetryEndpoint,
        "NEW_RELIC_LOG_ENABLED" to "false",
        "NEW_RELIC_APP_NAME" to "lsp-agent",
        "NEW_RELIC_LICENSE_KEY" to licenseIngestKey
    )
}