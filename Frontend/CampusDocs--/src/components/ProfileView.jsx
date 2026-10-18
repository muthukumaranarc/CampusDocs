import SettingsView from './SettingsView'
import './ProfileView.css'

export default function ProfileView(props) {
  return <SettingsView initialTab="overview" {...props} />
}
