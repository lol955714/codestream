using System.Collections.Generic;

namespace CodeStream.VisualStudio.Core.Models {
	public class CodeLevelMetricsTelemetry {
		public IList<AverageDurationResponse> AverageDuration { get; }
		public IList<ThroughputResponse> Throughput { get; }
		public IList<ErrorRateResponse> ErrorRate { get; }
		public string SinceDateFormatted { get; }
		public RepoInfo Repo { get; }
		public string NewRelicEntityGuid { get; }

		public CodeLevelMetricsTelemetry() {
			AverageDuration = new List<AverageDurationResponse>();
			Throughput = new List<ThroughputResponse>();
			ErrorRate = new List<ErrorRateResponse>();
			Repo = new RepoInfo();
		}

		public CodeLevelMetricsTelemetry(
			IList<AverageDurationResponse> averageDuration,
			IList<ThroughputResponse> throughput,
			IList<ErrorRateResponse> errorRate,
			string sinceDateFormatted,
			RepoInfo repo,
			string newRelicEntityGuid) {
			AverageDuration = averageDuration;
			Throughput = throughput;
			ErrorRate = errorRate;
			SinceDateFormatted = sinceDateFormatted;
			Repo = repo;
			NewRelicEntityGuid = newRelicEntityGuid;
		}
	}
}
