using System;

namespace CodeStream.VisualStudio.Framework.Attributes {
	public class VisualStudioSettingAttribute : Attribute {
		public string Path { get; }

		public VisualStudioSettingAttribute(string path) {
			Path = path;
		}
	}
}
