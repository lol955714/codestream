using CodeStream.VisualStudio.Core.Enums;
using Microsoft.VisualStudio.Settings;

namespace CodeStream.VisualStudio.Core.Interfaces {
	public interface IVisualStudioSettingsManager {
		bool IsCodeLevelMetricsEnabled();
		bool IsCodeLensEnabled();

		ISettingsSubset GetPropertyToMonitor(VisualStudioSetting setting);
	}
}
