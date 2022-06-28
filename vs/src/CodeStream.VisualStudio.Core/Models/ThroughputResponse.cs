namespace CodeStream.VisualStudio.Core.Models
{
	public class ThroughputResponse {
		public string RequestsPerMinute { get; set; }
		public string Namespace { get; set; }
		public string ClassName { get; set; }
		public string FunctionName { get; set; }
		public string MetricTimesliceName { get; set; }
	}
}
