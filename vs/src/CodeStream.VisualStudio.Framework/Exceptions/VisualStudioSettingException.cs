using System;
using CodeStream.VisualStudio.Framework.Enums;
using Microsoft.VisualStudio.Settings;

namespace CodeStream.VisualStudio.Framework.Exceptions {
	public class VisualStudioSettingException : Exception {
		public VisualStudioSettingException(VisualStudioSetting setting, GetValueResult valueResult)
			: base($"Failed to get {setting}. Result was: {valueResult}") { }
	}
}
