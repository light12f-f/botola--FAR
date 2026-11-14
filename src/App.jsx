
import React, { useState, useEffect } from 'react'

import {
  Trophy,
  Home,
  CalendarDays,
  Users,
  BarChart3,
  Shield,
  Globe,
  Menu
} from 'lucide-react'

import { supabase } from './supabase.js'
import AdminLogin from './AdminLogin.jsx'
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
    language: 'Français'
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
    language: 'العربية'
  }
}

export default function App() {

  const [lang, setLang] = useState('ar')
  const [active, setActive] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const [adminUser, setAdminUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // ADMIN SESSION
  useEffect(() => {

    let mounted = true

    async function checkAdminSession() {

      try {

        const { data, error } =
          await supabase.auth.getSession()

        if (error) throw error

        const session = data.session

        if (session) {

          const { data: isAdmin, error: adminError } =
            await supabase.rpc('is_admin')

          if (adminError || isAdmin !== true) {

            await supabase.auth.signOut()

          } else if (mounted) {

            setAdminUser(session.user)

          }
        }

      } catch (error) {

        console.error('Session check error:', error)

      } finally {

        if (mounted) {
          setAuthLoading(false)
        }

      }
    }

    checkAdminSession()

    const { data: listener } =
      supabase.auth.onAuthStateChange((event, session) => {

        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setAdminUser(null)
        }

        if (event === 'SIGNED_IN' && session) {
          setAdminUser(session.user)
        }

      })

    return () => {

      mounted = false
      listener.subscription.unsubscribe()

    }

  }, [])

  // LOAD PUBLIC DATA
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

    return teams.find(team => team.id === id)?.name || '—'

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

      {/* HEADER */}

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

        {/* SIDEBAR */}

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

        {/* MAIN CONTENT */}

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
                    ? <div className="empty-state">...</div>
                    : renderTeams()
                  }

                </section>

                <section className="panel">

                  <div className="panel-heading">
                    <CalendarDays size={19} />
                    <h3>{t.latest}</h3>
                  </div>

                  {loadingData
                    ? <div className="empty-state">...</div>
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
                    ? <div className="empty-state">...</div>
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

                <section className="panel page-panel">
                  {lang === 'ar'
                    ? 'جاري التحقق من الجلسة...'
                    : 'Vérification de session...'}
                </section>

              ) : adminUser ? (

                <div className="admin-page">

                  <AdminDashboard lang={lang} />

                  <button
                    className="admin-logout"
                    onClick={async () => {

                      const { error } =
                        await supabase.auth.signOut()

                      if (!error) {
                        setAdminUser(null)
                      }

                    }}
                  >
                    {lang === 'ar'
                      ? 'تسجيل الخروج'
                      : 'Déconnexion'}
                  </button>

                </div>

              ) : (

                <AdminLogin
                  lang={lang}
                  onLogin={setAdminUser}
                />

              )}

            </div>

          )}

          {/* OTHER PAGES */}

          {active === 'teams' && (

            <section className="panel page-panel">

              <div className="panel-heading">
                <Shield size={19} />
                <h3>{t.teams}</h3>
              </div>

              {loadingData
                ? <div className="empty-state">...</div>
                : renderTeams()
              }

            </section>

          )}

          {active === 'matches' && (

            <section className="panel page-panel">

              <div className="panel-heading">
                <CalendarDays size={19} />
                <h3>{t.matches}</h3>
              </div>

              {loadingData
                ? <div className="empty-state">...</div>
                : renderMatches(matches)
              }

            </section>

          )}

          {active === 'standings' && (

            <section className="panel page-panel">

              <div className="panel-heading">
                <Trophy size={19} />
                <h3>{t.standings}</h3>
              </div>

              <div className="empty-state">
                {t.empty}
              </div>

            </section>

          )}

          {active === 'players' && (

            <section className="panel page-panel">

              <div className="panel-heading">
                <Users size={19} />
                <h3>{t.players}</h3>
              </div>

              <div className="empty-state">
                {t.empty}
              </div>

            </section>

          )}

          {active === 'stats' && (

            <section className="panel page-panel">

              <div className="panel-heading">
                <BarChart3 size={19} />
                <h3>{t.stats}</h3>
              </div>

              <div className="empty-state">
                {t.empty}
              </div>

            </section>

          )}

          <footer className="footer">
            BOTOLA FAR — Football Management Platform
          </footer>

        </main>

      </div>

    </div>

  )

                    }
