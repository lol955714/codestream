using System.Threading.Tasks;
using CodeStream.VisualStudio.Core.Models;
using CodeStream.VisualStudio.Framework.Enums;

namespace CodeStream.VisualStudio.Framework.Interfaces {
	public interface ICodeLevelMetricsCallbackService {
		CodeLevelMetricStatus GetClmStatus();
		int GetVisualStudioPid();
		string GetEditorFormat();
		Task InitializeRpcAsync(string dataPointId);
		Task<GetFileLevelTelemetryResponse> GetTelemetryAsync(string codeNamespace, string functionName);
	}
}
