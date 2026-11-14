
import React, { useState, useEffect } from 'react'

import {
  Trophy,
  Home,
  CalendarDays,
  Users,
  BarChart3,
  Shield,
  Globe,
  Menu,
  LogOut
} from 'lucide-react'

import { supabase } from './supabase.js'
import AdminDashboard from './AdminDashboard.jsx'

const translations = {
  ar: {
    home: 'الرئيسية',
    standings: 'الترتيب',
    matches: 'المباريات',
    players: 'اللاعبون',
    stats: 'الإحصائيات',
    teams: 'الفرق',
    admin: 'الإدارة',
    subtitle: 'منصة إدارة البطولة',
    welcome: 'مرحباً بك في BOTOLA FAR',
    description: 'تابع ترتيب الفرق ونتائج المباريات وإحصائيات البطولة.',
    empty: 'لا توجد بيانات حالياً',
    upcoming: 'المباريات القادمة',
    latest: 'آخر النتائج',
    language: 'Français',
    rank: 'الرتبة',
    team: 'الفريق',
    played: 'لعب',
    wins: 'فاز',
    draws: 'تعادل',
    losses: 'خسر',
    goalsFor: 'له',
    goalsAgainst: 'عليه',
    goalDifference: 'الفارق',
    points: 'النقاط',
    loading: 'جاري التحميل...',
    noFinished: 'لا توجد مباريات منتهية بعد'
  },

  fr: {
    home: 'Accueil',
    standings: 'Classement',
    matches: 'Matchs',
    players: 'Joueurs',
    stats: 'Statistiques',
    teams: 'Équipes',
    admin: 'Administration',
    subtitle: 'Plateforme de gestion du tournoi',
    welcome: 'Bienvenue sur BOTOLA FAR',
    description: 'Suivez le classement, les résultats et les statistiques du tournoi.',
    empty: 'Aucune donnée disponible',
    upcoming: 'Prochains matchs',
    latest: 'Derniers résultats',
    language: 'العربية',
    rank: 'Rang',
    team: 'Équipe',
    played: 'J',
    wins: 'V',
    draws: 'N',
    losses: 'D',
    goalsFor: 'BP',
    goalsAgainst: 'BC',
    goalDifference: 'Diff.',
    points: 'Pts',
    loading: 'Chargement...',
    noFinished: 'Aucun match terminé'
  }
}

export default function App() {

  const [lang, setLang] = useState('ar')
  const [active, setActive] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Admin authentication
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [adminAllowed, setAdminAllowed] = useState(false)

  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authSaving, setAuthSaving] = useState(false)

  // Check admin permissions
  useEffect(() => {
    let alive = true

    async function checkAccess(currentSession) {
      if (!alive) return

      setSession(currentSession)
      setAdminAllowed(false)

      if (!currentSession) {
        setAuthLoading(false)
        setAuthMessage('')
        return
      }

      setAuthLoading(true)

      const { data, error } = await supabase.rpc('is_admin')

      if (!alive) return

      if (error) {
        setAuthMessage(error.message)
        setAdminAllowed(false)
      } else if (data === true) {
        setAdminAllowed(true)
        setAuthMessage('')
      } else {
        setAdminAllowed(false)
        setAuthMessage('هذا الحساب ليس لديه صلاحية المسؤول')
      }

      setAuthLoading(false)
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      Promise.resolve().then(() => checkAccess(newSession))
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return

      if (error) {
        setAuthMessage(error.message)
        setAuthLoading(false)
        return
      }

      checkAccess(data.session)
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

  // Admin login
  async function adminLogin(event) {
    event.preventDefault()

    setAuthSaving(true)
    setAuthMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword
      })

      if (error) throw error

      setAdminPassword('')

    } catch (error) {
      setAuthMessage(error.message || 'فشل تسجيل الدخول')
    } finally {
      setAuthSaving(false)
    }
  }

  // Admin logout
  async function adminLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setAdminAllowed(false)
    setSession(null)
    setActive('home')
    setAuthMessage('')
  }

  // Load public data
  async function loadPublicData() {

    setLoadingData(true)

    try {

      const [teamsResult, matchesResult] = await Promise.all([

        supabase
          .from('teams')
          .select('*'),

        supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true })

      ])

      if (teamsResult.error) throw teamsResult.error
      if (matchesResult.error) throw matchesResult.error

      setTeams(teamsResult.data || [])
      setMatches(matchesResult.data || [])

    } catch (error) {

      console.error('Public data error:', error)

    } finally {

      setLoadingData(false)

    }

  }

  useEffect(() => {
    loadPublicData()
  }, [])

  const t = translations[lang]

  const navigation = [

    { id: 'home', label: t.home, icon: Home },
    { id: 'standings', label: t.standings, icon: Trophy },
    { id: 'matches', label: t.matches, icon: CalendarDays },
    { id: 'players', label: t.players, icon: Users },
    { id: 'stats', label: t.stats, icon: BarChart3 },
    { id: 'teams', label: t.teams, icon: Shield },
    { id: 'admin', label: t.admin, icon: Shield }

  ]

  function teamName(id) {
    return teams.find(team => String(team.id) === String(id))?.name || '—'
  }

  // Calculate standings automatically
  const standings = teams.map(team => {

    const stats = {
      team_id: team.id,
      name: team.name,
      logo_url: team.logo_url,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0
    }

    matches
      .filter(match => match.status === 'finished')
      .forEach(match => {

        const home = String(match.home_team_id)
        const away = String(match.away_team_id)
        const current = String(team.id)

        if (home !== current && away !== current) return

        if (
          match.home_score == null ||
          match.away_score == null
        ) return

        const hs = Number(match.home_score)
        const as = Number(match.away_score)

        if (!Number.isFinite(hs) || !Number.isFinite(as)) return

        stats.played++

        if (home === current) {
          stats.goals_for += hs
          stats.goals_against += as
        } else {
          stats.goals_for += as
          stats.goals_against += hs
        }

        if (hs === as) {

          stats.draws++
          stats.points += 1

        } else if (

          (home === current && hs > as) ||
          (away === current && as > hs)

        ) {

          stats.wins++
          stats.points += 3

        } else {

          stats.losses++

        }

      })

    stats.goal_difference =
      stats.goals_for - stats.goals_against

    return stats

  }).sort((a, b) =>

    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for

  ).map((team, index) => ({

    ...team,
    rank: index + 1

  }))

  function renderStandings(compact = false) {

    if (!teams.length) {
      return <div className="empty-state">{t.empty}</div>
    }

    if (
      !loadingData &&
      standings.every(team => team.played === 0)
    ) {
      return <div className="empty-state">{t.noFinished}</div>
    }

    return (

      <div style={{
        width: '100%',
        overflowX: 'auto'
      }}>

        <table style={{
          width: '100%',
          minWidth: compact ? '420px' : '650px',
          borderCollapse: 'collapse',
          textAlign: 'center'
        }}>

          <thead>

            <tr style={{
              borderBottom: '1px solid rgba(255,255,255,0.15)'
            }}>

              <th style={{ padding: '12px 8px' }}>{t.rank}</th>
              <th style={{ padding: '12px 8px', textAlign: 'start' }}>{t.team}</th>
              <th style={{ padding: '12px 8px' }}>{t.played}</th>
              <th style={{ padding: '12px 8px' }}>{t.wins}</th>
              <th style={{ padding: '12px 8px' }}>{t.draws}</th>
              <th style={{ padding: '12px 8px' }}>{t.losses}</th>

              {!compact && (
                <>
                  <th style={{ padding: '12px 8px' }}>{t.goalsFor}</th>
                  <th style={{ padding: '12px 8px' }}>{t.goalsAgainst}</th>
                  <th style={{ padding: '12px 8px' }}>{t.goalDifference}</th>
                </>
              )}

              <th style={{ padding: '12px 8px' }}>{t.points}</th>

            </tr>

          </thead>

          <tbody>

            {standings.map(team => (

              <tr
                key={team.team_id}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: team.rank === 1
                    ? 'rgba(212,175,55,0.10)'
                    : 'transparent'
                }}
              >

                <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                  {team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : team.rank === 3 ? '🥉' : team.rank}
                </td>

                <td style={{
                  padding: '12px 8px',
                  textAlign: 'start',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>

                    {team.logo_url && (
                      <img
                        src={team.logo_url}
                        alt=""
                        width="28"
                        height="28"
                        style={{ objectFit: 'contain' }}
                      />
                    )}

                    {team.name}

                  </div>

                </td>

                <td>{team.played}</td>
                <td>{team.wins}</td>
                <td>{team.draws}</td>
                <td>{team.losses}</td>

                {!compact && (
                  <>
                    <td>{team.goals_for}</td>
                    <td>{team.goals_against}</td>
                    <td>{team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}</td>
                  </>
                )}

                <td style={{
                  padding: '12px 8px',
                  fontWeight: 'bold',
                  color: '#d4af37'
                }}>
                  {team.points}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    )

  }

  function renderMatches(list) {

    if (!list.length) {
      return <div className="empty-state">{t.empty}</div>
    }

    return list.map(match => (

      <div className="admin-record" key={match.id}>

        <div className="admin-record-info">

          <strong>
            {teamName(match.home_team_id)}
            {'  '}
            {match.home_score ?? '-'}
            {' : '}
            {match.away_score ?? '-'}
            {'  '}
            {teamName(match.away_team_id)}
          </strong>

          <small>
            {match.match_date
              ? new Date(match.match_date).toLocaleString(
                  lang === 'ar' ? 'ar-MA' : 'fr-FR'
                )
              : '—'}
          </small>

        </div>

      </div>

    ))

  }

  function renderTeams() {

    if (!teams.length) {
      return <div className="empty-state">{t.empty}</div>
    }

    return teams.map(team => (

      <div className="admin-record" key={team.id}>

        <div className="admin-record-info">
          <strong>{team.name}</strong>
        </div>

        {team.logo_url && (
          <img
            src={team.logo_url}
            alt={team.name}
            width="42"
            height="42"
            style={{ objectFit: 'contain' }}
          />
        )}

      </div>

    ))

  }

  return (

    <div
      className="app"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >

      <header className="topbar">

        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <Menu size={22} />
        </button>

        <div className="brand">

          <div className="brand-icon">
            <Trophy size={25} />
          </div>

          <div>
            <h1>
              BOTOLA <span>FAR</span>
            </h1>
            <p>{t.subtitle}</p>
          </div>

        </div>

        <button
          className="language-button"
          onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
        >
          <Globe size={18} />
          {t.language}
        </button>

      </header>

      <div className="layout">

        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>

          <p className="nav-heading">
            {lang === 'ar' ? 'القائمة الرئيسية' : 'MENU PRINCIPAL'}
          </p>

          {navigation.map(item => {

            const Icon = item.icon

            return (

              <button
                key={item.id}
                className={`nav-item ${
                  active === item.id ? 'active' : ''
                }`}
                onClick={() => {
                  setActive(item.id)
                  setMenuOpen(false)

                  if (item.id !== 'admin') {
                    loadPublicData()
                  }
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>

            )

          })}

          <div className="sidebar-footer">
            BOTOLA FAR © 2026
          </div>

        </aside>

        <main className="main-content">

          <div className="page-heading">

            <div>
              <span className="eyebrow">BOTOLA FAR</span>

              <h2>
                {active === 'home'
                  ? t.welcome
                  : navigation.find(
                      item => item.id === active
                    )?.label}
              </h2>

              <p>{t.description}</p>
            </div>

            <div className="live-indicator">
              <span></span>
              {lang === 'ar' ? 'البطولة' : 'Tournoi'}
            </div>

          </div>

          {/* HOME */}

          {active === 'home' && (

            <div className="dashboard">

              <section className="welcome-card">

                <div className="welcome-content">
                  <span className="welcome-tag">
                    FOOTBALL TOURNAMENT
                  </span>

                  <h2>BOTOLA FAR</h2>
                  <p>{t.description}</p>
                </div>

                <Trophy
                  className="hero-trophy"
                  size={90}
                />

              </section>

              <div className="section-grid">

                <section className="panel">

                  <div className="panel-heading">
                    <Trophy size={19} />
                    <h3>{t.standings}</h3>
                  </div>

                  {loadingData
                    ? <div className="empty-state">{t.loading}</div>
                    : renderStandings(true)
                  }

                </section>

                <section className="panel">

                  <div className="panel-heading">
                    <CalendarDays size={19} />
                    <h3>{t.latest}</h3>
                  </div>

                  {loadingData
                    ? <div className="empty-state">{t.loading}</div>
                    : renderMatches(
                        matches.filter(m => m.status === 'finished')
                      )
                  }

                </section>

                <section className="panel full-panel">

                  <div className="panel-heading">
                    <CalendarDays size={19} />
                    <h3>{t.upcoming}</h3>
                  </div>

                  {loadingData
                    ? <div className="empty-state">{t.loading}</div>
                    : renderMatches(
                        matches.filter(m => m.status === 'scheduled')
                      )
                  }

                </section>

              </div>

            </div>

          )}

          {/* ADMIN */}

          {active === 'admin' && (

            <div className="dashboard">

              {authLoading ? (

                <section className="panel empty-state">
                  جاري التحقق من صلاحيات المسؤول...
                </section>

              ) : !session ? (

                <section className="panel" style={{
                  maxWidth: '450px',
                  margin: '30px auto',
                  padding: '25px'
                }}>

                  <div className="panel-heading">
                    <Shield size={22} />
                    <h3>تسجيل دخول المسؤول</h3>
                  </div>

                  <form
                    onSubmit={adminLogin}
                    style={{
                      display: 'grid',
                      gap: '18px',
                      marginTop: '20px'
                    }}
                  >

                    <label className="admin-field">
                      <span>البريد الإلكتروني</span>

                      <input
                        type="email"
                        value={adminEmail}
                        onChange={e => setAdminEmail(e.target.value)}
                        placeholder="البريد الإلكتروني"
                        autoComplete="username"
                        required
                      />
                    </label>

                    <label className="admin-field">
                      <span>كلمة المرور</span>

                      <input
                        type="password"
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        placeholder="كلمة المرور"
                        autoComplete="current-password"
                        required
                      />
                    </label>

                    {authMessage && (
                      <div className="admin-message">
                        {authMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="admin-primary"
                      disabled={authSaving}
                    >
                      {authSaving ? 'جاري الدخول...' : 'تسجيل الدخول'}
                    </button>

                  </form>

                </section>

              ) : !adminAllowed ? (

                <section className="panel" style={{
                  padding: '25px',
                  textAlign: 'center'
                }}>

                  <Shield size={35} />

                  <h3>ليس لديك صلاحية المسؤول</h3>

                  <p>{authMessage}</p>

                  <button
                    className="admin-primary"
                    onClick={adminLogout}
                  >
                    <LogOut size={17} />
                    تسجيل الخروج
                  </button>

                </section>

              ) : (

                <>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
      
