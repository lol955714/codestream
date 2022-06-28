using System.Collections.Generic;
using CodeStream.VisualStudio.Core.Models;

namespace CodeStream.VisualStudio.Shared.Models
{
	public class GetFileLevelTelemetryRequestType : RequestType<GetFileLevelTelemetryRequest> {
		public const string MethodName = "codestream/newrelic/fileLevelTelemetry";
		public override string Method => MethodName;
	}

	public class GetFileLevelTelemetryRequest {
		public string FilePath { get; set; }
		public string LanguageId { get; set; }
		public bool ResetCache { get; set; }
		public FileLevelTelemetryFunctionLocator Locator { get; set; }
		public FileLevelTelemetryRequestOptions Options { get; set; }
	}

	public class GetFileLevelTelemetryResponse {
		public RepoInfo Repo { get; set; }
		public bool IsConnected { get; set; }
		public IList<ThroughputResponse> Throughput { get; set; } = new List<ThroughputResponse>();
		public IList<AverageDurationResponse> AverageDuration { get; set; } = new List<AverageDurationResponse>();
		public IList<ErrorRateResponse> ErrorRate { get; set; } = new List<ErrorRateResponse>();
		public long? LastUpdateDate { get; set; }
		public bool HasAnyData { get; set; }
		public string SinceDateFormatted { get; set; }
		public long NewRelicAccountId { get; set; }
		public string NewRelicEntityGuid { get; set; }
		public string NewRelicEntityName { get; set; }
		public string NewRelicUrl { get; set; }
		public IList<EntityAccount> NewRelicEntityAccounts { get; set; } = new List<EntityAccount>();
		public string NewRelicAlertSeverity { get; set; }
		public string CodeNamespace { get; set; }
		public string RelativeFilePath { get; set; }
		public Error Error { get; set; }
	}
}
