package clm

import com.codestream.agent.AgentService
import com.codestream.protocols.agent.CSRepo
import com.codestream.protocols.agent.FileLevelTelemetryResult
import com.codestream.protocols.agent.MethodLevelTelemetryAverageDuration
import com.codestream.webview.JxBrowserEngineService
import com.codestream.webview.WebViewService
import com.intellij.codeInsight.hints.presentation.DynamicDelegatePresentation
import com.intellij.codeInsight.hints.presentation.OnHoverPresentation
import com.intellij.codeInsight.hints.presentation.PresentationRenderer
import com.intellij.codeInsight.hints.presentation.TextInlayPresentation
import com.intellij.codeInsight.hints.presentation.WithAttributesPresentation
import com.intellij.testFramework.TestDataPath
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.testFramework.registerServiceInstance
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.junit.BeforeClass

@Suppress("UnstableApiUsage")
@TestDataPath("csTestData")
class CLMLanguageComponentTest : BasePlatformTestCase() {
    val mockAgentService = mockk<AgentService>(relaxed = true)
    val mockJxBrowserEngineService = mockk<JxBrowserEngineService>(relaxed = true)
    val mockWebViewService = mockk<WebViewService>(relaxed = true)

    @BeforeClass
    fun init() {
        System.setProperty("TEST_MODE", "true")
    }

    override fun getTestDataPath(): String {
        return "csTestData"
    }

    fun initMocks() {
        project.registerServiceInstance(AgentService::class.java, mockAgentService)
        project.registerServiceInstance(JxBrowserEngineService::class.java, mockJxBrowserEngineService)
        project.registerServiceInstance(WebViewService::class.java, mockWebViewService)

        // Mimic the actual implementation
        val slot = slot<() -> Unit>()
        every { mockAgentService.onDidStart(capture(slot)) } answers { slot.captured() }
    }

    fun `test python method`() {
        initMocks()

        val result = FileLevelTelemetryResult(
            null, CSRepo("123", "repo", "remote"), null, listOf(
                MethodLevelTelemetryAverageDuration(
                    null, null, "hello_world", "d", 3.333f
                )
            ), null, null, null, null, 1, "abcd-1234", null, null, "fooNamespace", "/src/app.py"
        )

        coEvery { mockAgentService.fileLevelTelemetry(any()) } coAnswers {
            result
        }

        myFixture.configureByFile("app.py")

        myFixture.doHighlighting() // Force inlays to resolve (requires 'java' plugin in build.gradle

        val inlayBlock = myFixture.editor.inlayModel.getBlockElementsInRange(
            0, 1000
        )[0]

        val lineNo = myFixture.editor.document.getLineNumber(inlayBlock.bounds!!.y)

        lineNo shouldBe 16

        val presentation = (inlayBlock.renderer as PresentationRenderer).presentation as OnHoverPresentation
        val dynamicDelegatePresentation: DynamicDelegatePresentation =
            presentation.presentation as DynamicDelegatePresentation
        val withAttributesPresentation: WithAttributesPresentation =
            dynamicDelegatePresentation.delegate as WithAttributesPresentation
        val textPresentation: TextInlayPresentation = withAttributesPresentation.presentation as TextInlayPresentation
        textPresentation.text.trim() shouldBe "avg duration: 3.333ms | throughput: n/a | error rate: n/a - since 30 minutes ago"
    }
}
