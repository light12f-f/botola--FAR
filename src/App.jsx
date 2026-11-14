
import React, { useState, useEffect, useCallback } from 'react'

import {
  Trophy,
  Home,
  CalendarDays,
  Users,
  BarChart3,
  Shield,
  Globe,
  Menu,
  LogOut,
  RefreshCw
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
    noFinished: 'لا توجد مباريات منتهية بعد',
    login: 'تسجيل دخول المسؤول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    logging: 'جاري الدخول...',
    logout: 'تسجيل الخروج',
    noPermission: 'ليس لديك صلاحية المسؤول',
    checking: 'جاري التحقق من صلاحيات المسؤول...',
    playersTitle: 'قائمة اللاعبين',
    playedMatches: 'المباريات',
    goals: 'الأهداف',
    assists: 'التمريرات الحاسمة',
    refresh: 'تحديث البيانات',
    tournament: 'البطولة'
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
    noFinished: 'Aucun match terminé',
    login: 'Connexion administrateur',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    loginButton: 'Se connecter',
    logging: 'Connexion...',
    logout: 'Déconnexion',
    noPermission: 'Vous n’avez pas les droits administrateur',
    checking: 'Vérification des autorisations...',
    playersTitle: 'Liste des joueurs',
    playedMatches: 'Matchs',
    goals: 'Buts',
    assists: 'Passes décisives',
    refresh: 'Actualiser',
    tournament: 'Tournoi'
  }
}

export default function App() {
  const [lang, setLang] = useState('ar')
  const [active, setActive] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [playerStats, setPlayerStats] = useState([])

  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState('')

  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [adminAllowed, setAdminAllowed] = useState(false)

  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authSaving, setAuthSaving] = useState(false)

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

  // تحميل البيانات العامة
  const loadPublicData = useCallback(async () => {
    setLoadingData(true)
    setDataError('')

    try {
      const [teamResult, matchResult, playerResult, statsResult] =
        await Promise.all([
          supabase.from('teams').select('*'),
          supabase.from('matches').select('*'),
          supabase.from('players').select('*'),
          supabase.from('player_stats').select('*')
        ])

      const failed = [
        teamResult,
        matchResult,
        playerResult,
        statsResult
      ].find(result => result.error)

      if (failed) throw failed.error

      setTeams(teamResult.data || [])

      setMatches(
        (matchResult.data || []).sort((a, b) =>
          new Date(a.match_date || 0) -
          new Date(b.match_date || 0)
        )
      )

      setPlayers(playerResult.data || [])
      setPlayerStats(statsResult.data || [])

    } catch (error) {
      console.error('Public data error:', error)
      setDataError(error.message || 'Error loading data')
    } finally {
      setLoadingData(false)
    }
  }, [])

  // التحقق من صلاحيات المسؤول
  useEffect(() => {
    let alive = true

    async function checkAccess(currentSession) {
      if (!alive) return

      setSession(currentSession)
      setAdminAllowed(false)
      setAuthMessage('')

      if (!currentSession) {
        setAuthLoading(false)
        return
      }

      setAuthLoading(true)

      try {
        const { data, error } = await supabase.rpc('is_admin')

        if (!alive) return

        if (error) throw error

        if (data === true) {
          setAdminAllowed(true)
          setAuthMessage('')
        } else {
          setAdminAllowed(false)
          setAuthMessage(t.noPermission)
        }

      } catch (error) {
        if (!alive) return

        setAdminAllowed(false)
        setAuthMessage(error.message || t.noPermission)

      } finally {
        if (alive) setAuthLoading(false)
      }
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

  // تحميل البيانات عند فتح الموقع
  useEffect(() => {
    loadPublicData()
  }, [loadPublicData])

  // تسجيل دخول المسؤول
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

  // تسجيل الخروج
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

  function teamName(id) {
    return teams.find(
      team => String(team.id) === String(id)
    )?.name || '—'
  }

  function playerName(id) {
    return players.find(
      player => String(player.id) === String(id)
    )?.full_name || '—'
  }

  // حساب الترتيب تلقائياً
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

        if (
          !Number.isFinite(hs) ||
          !Number.isFinite(as)
        ) return

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
          stats.points++
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

  // جدول الترتيب
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
      <div style={{ width: '100%', overflowX: 'auto' }}>
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
              <th>{t.rank}</th>
              <th style={{ textAlign: 'start' }}>{t.team}</th>
              <th>{t.played}</th>
              <th>{t.wins}</th>
              <th>{t.draws}</th>
              <th>{t.losses}</th>

              {!compact && <>
                <th>{t.goalsFor}</th>
                <th>{t.goalsAgainst}</th>
                <th>{t.goalDifference}</th>
              </>}

              <th>{t.points}</th>
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
                <td>
                  {team.rank === 1 ? '🥇' :
                    team.rank === 2 ? '🥈' :
                    team.rank === 3 ? '🥉' :
                    team.rank}
                </td>

                <td style={{
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

                {!compact && <>
                  <td>{team.goals_for}</td>
                  <td>{team.goals_against}</td>
                  <td>
                    {team.goal_difference > 0
                      ? `+${team.goal_difference}`
                      : team.goal_difference}
                  </td>
                </>}

                <td style={{
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

  // عرض المباريات
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

  // عرض الفرق
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

  // عرض اللاعبين
  function renderPlayers() {
    if (!players.length) {
      return <div className="empty-state">{t.empty}</div>
    }

    return players.map(player => (
      <div className="admin-record" key={player.id}>
        <div className="admin-record-info">
          <strong>{player.full_name}</strong>
          <small>
            {teamName(player.team_id)}
            {' • '}
            {player.position || '—'}
            {' • #'}
            {player.jersey_number ?? '—'}
          </small>
        </div>
      </div>
    ))
  }

  // عرض إحصائيات اللاعبين
  function renderStats() {
    if (!playerStats.length) {
      return <div className="empty-state">{t.empty}</div>
    }

    return playerStats.map(stat => (
      <div className="admin-record" key={stat.id}>
        <div className="admin-record-info">
          <strong>{playerName(stat.player_id)}</strong>
          <small>
            {t.playedMatches}: {stat.appearances ?? 0}
            {' • '}
            {t.goals}: {stat.goals ?? 0}
            {' • '}
            {t.assists}: {stat.assists ?? 0}
          </small>
        </div>
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
            <h1>BOTOLA <span>FAR</span></h1>
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
                  : navigation.find(item => item.id === active)?.label}
              </h2>
              <p>{t.description}</p>
            </div>

            <div className="live-indicator">
              <span></span>
              {t.tournament}
            </div>
          </div>

          {dataError && (
            <div className="admin-message">
              {dataError}
            </div>
          )}

          {/* الرئيسية */}
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

                <Trophy className="hero-trophy" size={90} />
              </section>

              <div className="section-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <Trophy size={19} />
                    <h3>{t.standings}</h3>
                  </div>

                  {loadingData
                    ? <div className="empty-state">{t.loading}</div>
                    : renderStandings(true)}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <CalendarDays size={19} />
                    <h3>{t.latest}</h3>
                  </div>

                  {loadingData
                    ? <div className="empty-state">{t.loading}</div>
                    : renderMatches(
                        matches
                          .filter(m => m.status === 'finished')
                          .slice()
                          .reverse()
                          .slice(0, 5)
                      )}
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
                      )}
                </section>
              </div>
            </div>
          )}

          {/* الترتيب */}
          {active === 'standings' && (
            <section className="panel">
              <div className="panel-heading">
                <Trophy size={19} />
                <h3>{t.standings}</h3>
              </div>

              {loadingData
                ? <div className="empty-state">{t.loading}</div>
                : renderStandings(false)}
            </section>
          )}

          {/* المباريات */}
          {active === 'matches' && (
            <section classN
