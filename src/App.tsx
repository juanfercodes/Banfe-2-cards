import { AuthProvider } from './components/auth/AuthProvider';
import './i18n';
import { LanguageProvider } from './i18n/LanguageProvider';
import { Routes } from './routes';

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </LanguageProvider>
  );
}
