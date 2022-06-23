using CodeStream.VisualStudio.Framework.Attributes;

namespace CodeStream.VisualStudio.Framework.Enums {
	public enum VisualStudioSetting {
		[VisualStudioSetting("TextEditorGlobalOptions.IsCodeLensEnabled")]
		IsCodeLensEnabled,

		[VisualStudioSetting("TextEditorGlobalOptions.CodeLensDisabledProviders")]
		CodeLensDisabledProviders
	}
}
