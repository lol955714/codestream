namespace CodeStream.VisualStudio.Core.Models
{
	public class ErrorRateResponse {
		public string ErrorsPerMinute { get; set; }
		public string Namespace { get; set; }
		public string ClassName { get; set; }
		public string FunctionName { get; set; }
		public string MetricTimesliceName { get; set; }
	}
}
