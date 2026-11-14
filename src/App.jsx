
import React, { useState } from 'react'
import {
  Trophy, Home, CalendarDays, Users,
  BarChart3, Shield, Globe, Menu
} from 'lucide-react'

import ConnectionTest from '../ConnectionTest.jsx'
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
    connection: 'اختبار الاتصال بقاعدة البيانات',
    connectionDescription: 'التحقق من اتصال المنصة بقاعدة بيانات Supabase.'
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
    connection: 'Test de connexion à la base de données',
    connectionDescription: 'Vérifier la connexion à Supabase.'
  }
}

export default function App() {
  const [lang, setLang] = useState('ar')
  const [active, setActive] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

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

  return (
    <div className="app" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
                className={`nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActive(item.id)
                  setMenuOpen(false)
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
              {lang === 'ar' ? 'البطولة' : 'Tournoi'}
            </div>
          </div>

          {active === 'home' ? (
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
                  <div className="empty-state">{t.empty}</div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <CalendarDays size={19} />
                    <h3>{t.latest}</h3>
                  </div>
                  <div className="empty-state">{t.empty}</div>
                </section>

                <section className="panel full-panel">
                  <div className="panel-heading">
                    <CalendarDays size={19} />
                    <h3>{t.upcoming}</h3>
                  </div>
                  <div className="empty-state">{t.empty}</div>
                </section>
              </div>
            </div>
          ) : active === 'admin' ? (
            <div className="dashboard">
              <section className="panel page-panel">
                <div className="panel-heading">
                  <Shield size={20} />
                  <h3>{t.connection}</h3>
                </div>

                <p>{t.connectionDescription}</p>

                <ConnectionTest />
              </section>
            </div>
          ) : (
            <section className="panel page-panel">
              <div className="empty-state">{t.empty}</div>
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
