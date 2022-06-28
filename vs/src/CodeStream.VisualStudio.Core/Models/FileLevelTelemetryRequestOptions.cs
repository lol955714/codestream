namespace CodeStream.VisualStudio.Core.Models
{
	public class FileLevelTelemetryRequestOptions {
		public bool IncludeThroughput { get; set; }
		public bool IncludeAverageDuration { get; set; }
		public bool IncludeErrorRate { get; set; }
	}
}
