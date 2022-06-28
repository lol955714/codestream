using CodeStream.VisualStudio.Core.Models;

namespace CodeStream.VisualStudio.Shared.Models {
	public class PasswordLoginRequest {
		public string Email { get; set; }
		public string Password { get; set; }
		public string TeamId { get; set; }
	}

	public class PasswordLoginRequestType : RequestType<PasswordLoginRequest> {

		public const string MethodName = "codestream/login/password";
		public override string Method => MethodName;
	}

	public class LoginSuccessResponse {}
}
