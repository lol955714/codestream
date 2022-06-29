using System.Collections.Generic;
using Newtonsoft.Json;

namespace CodeStream.VisualStudio.Core.Models {
	public class CodeLevelMetricsTelemetry {
		[JsonProperty("averageDuration", NullValueHandling = NullValueHandling.Ignore)]
		public IList<AverageDurationResponse> AverageDuration { get; }
		[JsonProperty("throughput", NullValueHandling = NullValueHandling.Ignore)]
		public IList<ThroughputResponse> Throughput { get; }
		[JsonProperty("errorRate", NullValueHandling = NullValueHandling.Ignore)]
		public IList<ErrorRateResponse> ErrorRate { get; }
		[JsonProperty("sinceDateFormatted", NullValueHandling = NullValueHandling.Ignore)]
		public string SinceDateFormatted { get; }
		[JsonProperty("repo", NullValueHandling = NullValueHandling.Ignore)]
		public RepoInfo Repo { get; }
		[JsonProperty("newRelicEntityGuid", NullValueHandling = NullValueHandling.Ignore)]
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
