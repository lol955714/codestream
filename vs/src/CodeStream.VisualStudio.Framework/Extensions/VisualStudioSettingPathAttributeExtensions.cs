using System;
using System.Linq;
using CodeStream.VisualStudio.Framework.Attributes;
using CodeStream.VisualStudio.Framework.Enums;

namespace CodeStream.VisualStudio.Framework.Extensions {
	public static class VisualStudioSettingPathAttributeExtensions {
		public static VisualStudioSettingAttribute GetAttribute(this VisualStudioSetting setting) {
			var name = Enum.GetName(typeof(VisualStudioSetting), setting);

			return setting
				.GetType()
				.GetField(name)
				.GetCustomAttributes(false)
				.OfType<VisualStudioSettingAttribute>()
				.SingleOrDefault();
		}
	}
}
