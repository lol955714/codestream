﻿using System;
using System.ComponentModel;
using CodeStream.VisualStudio.Core.Logging;
using CodeStream.VisualStudio.Core.Models;
using CodeStream.VisualStudio.UI.Settings;

namespace CodeStream.VisualStudio.UnitTests.Stubs
{
    public class OptionsDialogPageStub : IOptionsDialogPage
    {
        public event PropertyChangedEventHandler PropertyChanged {
	        add { throw new NotSupportedException(); }
	        remove { }
        }

		public string Email { get; set; }        
        public bool ShowAvatars { get; set; }        
        public string ServerUrl { get; set; }
        public string Team { get; set; }
        public void Save() { }
        public void Load() { }

		public void SaveSettingsToStorage() {
			throw new NotImplementedException();
		}

		public void LoadSettingsFromStorage() {
			throw new NotImplementedException();
		}

		public TraceLevel TraceLevel { get; set; }
        public bool AutoSignIn { get; set; }
        public bool AutoHideMarkers { get; set; }
        public bool ShowMarkerGlyphs { get; set; }
        public bool ProxyStrictSsl { get; set; }
        public string ProxyUrl { get; set; }
        public ProxySupport ProxySupport { get; set; }
        public bool StrictSSL { get; set; }
        public Proxy Proxy { get; }
    }
}
