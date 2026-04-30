import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import HomePage from './pages/Home/HomePage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import CreatePredictionPage from './pages/CreatePrediction/CreatePredictionPage'
import PredictionDetailPage from './pages/PredictionDetail/PredictionDetailPage'
import VotePage from './pages/Vote/VotePage'
import WaitingPage from './pages/Waiting/WaitingPage'
import ResultPage from './pages/Result/ResultPage'
import ProfilePage from './pages/Profile/ProfilePage'
import HistoryPage from './pages/History/HistoryPage'
import LeaderboardPage from './pages/Leaderboard/LeaderboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Routes publiques ─── */}
        <Route path="/"        element={<HomePage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Pronostic accessible par lien sans compte (mode invité possible) */}
        <Route path="/p/:shareCode"         element={<PredictionDetailPage />} />
        <Route path="/p/:shareCode/vote"    element={<VotePage />} />
        <Route path="/p/:shareCode/waiting" element={<WaitingPage />} />
        <Route path="/p/:shareCode/result"  element={<ResultPage />} />

        {/* ─── Routes protégées (compte requis) ─── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/create"      element={<CreatePredictionPage />} />
          <Route path="/profile"     element={<ProfilePage />} />
          <Route path="/history"     element={<HistoryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
