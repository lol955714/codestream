using CodeStream.VisualStudio.Framework.Enums;
using Microsoft.VisualStudio.Settings;

namespace CodeStream.VisualStudio.Framework.Interfaces {
	public interface IVisualStudioSettingsManager {
		bool IsCodeLevelMetricsEnabled();
		bool IsCodeLensEnabled();

		ISettingsSubset GetPropertyToMonitor(VisualStudioSetting setting);
	}
}
