import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@renderer/layouts/app-layout'
import { AboutPage } from '@renderer/pages/about-page'
import { CalculationPage } from '@renderer/pages/calculation-page'
import { EditorPage } from '@renderer/pages/editor-page'
import { HomePage } from '@renderer/pages/home-page'
import { ImportPage } from '@renderer/pages/import-page'
import { LogsPage } from '@renderer/pages/logs-page'
import { ScoreRulesPage } from '@renderer/pages/score-rules-page'
import { SettingsPage } from '@renderer/pages/settings-page'
import { AppRoute } from '@shared/types/app-state'
import { AppProvider } from '@renderer/context/app-context'

export function App(): React.ReactElement {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path={AppRoute.HOME} element={<HomePage />} />
            <Route path={AppRoute.IMPORT} element={<ImportPage />} />
            <Route path={AppRoute.EDITOR} element={<EditorPage />} />
            <Route path={AppRoute.CALCULATION} element={<CalculationPage />} />
            <Route path={AppRoute.SCORE_RULES} element={<ScoreRulesPage />} />
            <Route path={AppRoute.LOGS} element={<LogsPage />} />
            <Route path={AppRoute.SETTINGS} element={<SettingsPage />} />
            <Route path={AppRoute.ABOUT} element={<AboutPage />} />
            <Route path="*" element={<Navigate to={AppRoute.HOME} replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
