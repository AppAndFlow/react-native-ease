import { AppRegistry, Platform } from 'react-native';
import App from './src/App';

AppRegistry.registerComponent('EaseExample', () => App);

if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root');
  AppRegistry.runApplication('EaseExample', { rootTag });
}
