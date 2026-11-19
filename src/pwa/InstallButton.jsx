import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';

// Shows an "Install app" button when the browser reports that StudyFlow can be installed.
export default function InstallButton({ className = 'nav-link' }) {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const onPrompt = (event) => { event.preventDefault(); setPromptEvent(event); };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!promptEvent) return null;
  async function install() {
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }
  return <button className={className} onClick={install}><Icon name="download" size={19} /><span className="nav-text">Install app</span></button>;
}
