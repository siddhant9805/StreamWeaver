import { useState } from "react";
import "../styles/Settings.css";

function SettingsPage() {

  const [notifications, setNotifications] = useState(true);
  const [autoProcessing, setAutoProcessing] = useState(true);

  return (
    <div className="settings-page">

      <div className="page-header">

        <div>
          <h1>Settings</h1>
          <p>Manage your StreamWeaver preferences.</p>
        </div>

      </div>

      <div className="settings-container">

        <div className="settings-card">

          <h2>General Settings</h2>

          <div className="setting-row">

            <div>
              <h3>Enable Notifications</h3>
              <p>Receive notifications about pipeline activity.</p>
            </div>

            <label className="switch">

              <input
                type="checkbox"
                checked={notifications}
                onChange={() =>
                  setNotifications(!notifications)
                }
              />

              <span className="slider"></span>

            </label>

          </div>

          <div className="setting-row">

            <div>
              <h3>Automatic Processing</h3>
              <p>Automatically start pipeline processing.</p>
            </div>

            <label className="switch">

              <input
                type="checkbox"
                checked={autoProcessing}
                onChange={() =>
                  setAutoProcessing(!autoProcessing)
                }
              />

              <span className="slider"></span>

            </label>

          </div>

        </div>

        <div className="settings-card">

          <h2>Account</h2>

          <div className="account-info">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>

          <button className="save-settings">
            Save Settings
          </button>

        </div>

      </div>

    </div>
  );
}

export default SettingsPage;