
import React, { useEffect, useState } from 'react'
import {
  Users, Shield, CalendarDays, BarChart3,
  Plus, Pencil, Trash2, RefreshCw, Save, X
} from 'lucide-react'
import { supabase } from './supabase.js'

const sections = [
  { id: 'teams', label: 'الفرق', icon: Shield },
  { id: 'matches', label: 'المباريات', icon: CalendarDays },
  { id: 'players', label: 'اللاعبون', icon: Users },
  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 }
]

const emptyForms = {
  teams: { name: '', logo_url: '' },
  players: {
    full_name: '', team_id: '', jersey_number: '',
    position: ''
  },
  matches: {
    home_team_id: '', away_team_id: '',
    home_score: 0, away_score: 0,
    match_date: '', round_number: 1,
    leg: '', status: 'scheduled'
  },
  stats: {
    player_id: '', appearances: 0, goals: 0,
    assists: 0, yellow_cards: 0, red_cards: 0
  }
}

export default function AdminDashboard({ lang = 'ar' }) {
  const ar = lang === 'ar'
  const [section, setSection] = useState('teams')
  const [data, setData] = useState({
    teams: [], players: [], matches: [], stats: []
  })
  const [form, setForm] = useState(emptyForms.teams)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const labels = {
    teams: ar ? 'إدارة الفرق' : 'Gestion des équipes',
    players: ar ? 'إدارة اللاعبين' : 'Gestion des joueurs',
    matches: ar ? 'إدارة المباريات' : 'Gestion des matchs',
    stats: ar ? 'إحصائيات اللاعبين' : 'Statistiques des joueurs',
    add: ar ? 'إضافة جديد' : 'Ajouter',
    edit: ar ? 'تعديل' : 'Modifier',
    delete: ar ? 'حذف' : 'Supprimer',
    save: ar ? 'حفظ البيانات' : 'Enregistrer',
    cancel: ar ? 'إلغاء' : 'Annuler',
    loading: ar ? 'جاري تحميل البيانات...' : 'Chargement...',
    empty: ar ? 'لا توجد بيانات' : 'Aucune donnée',
    name: ar ? 'الاسم' : 'Nom',
    logo: ar ? 'رابط الشعار' : 'URL du logo',
    team: ar ? 'الفريق' : 'Équipe',
    number: ar ? 'رقم القميص' : 'Numéro',
    position: ar ? 'المركز' : 'Poste',
    home: ar ? 'الفريق المستضيف' : 'Équipe domicile',
    away: ar ? 'الفريق الضيف' : 'Équipe visiteuse',
    date: ar ? 'تاريخ المباراة' : 'Date du match',
    round: ar ? 'رقم الجولة' : 'Journée',
    leg: ar ? 'الدور' : 'Phase',
    status: ar ? 'الحالة' : 'Statut',
    score: ar ? 'النتيجة' : 'Score',
    player: ar ? 'اللاعب' : 'Joueur',
    appearances: ar ? 'المشاركات' : 'Apparitions',
    goals: ar ? 'الأهداف' : 'Buts',
    assists: ar ? 'التمريرات الحاسمة' : 'Passes décisives',
    yellow: ar ? 'بطاقات صفراء' : 'Cartons jaunes',
    red: ar ? 'بطاقات حمراء' : 'Cartons rouges'
  }

  async function loadData() {
    setLoading(true)
    setMessage('')

    try {
      const tables = ['teams', 'players', 'matches', 'player_stats']
      const results = await Promise.all(
        tables.map(table =>
          supabase.from(table).select('*').order(
            table === 'player_stats' ? 'updated_at' : 'created_at',
            { ascending: false }
          )
        )
      )

      const failed = results.find(result => result.error)
      if (failed) throw failed.error

      setData({
        teams: results[0].data || [],
        players: results[1].data || [],
        matches: results[2].data || [],
        stats: results[3].data || []
      })
    } catch (error) {
      setMessage(error.message || 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForms[section] })
    setShowForm(true)
    setMessage('')
  }

  function openEdit(item) {
    setEditing(item.id)
    const values = { ...emptyForms[section], ...item }

    if (section === 'matches' && values.match_date) {
      values.match_date = new Date(values.match_date)
        .toISOString().slice(0, 16)
    }

    setForm(values)
    setShowForm(true)
    setMessage('')
  }

  function changeField(key, value) {
    setForm(previous => ({ ...previous, [key]: value }))
  }

  async function saveData(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const table = section === 'stats' ? 'player_stats' : section
      const payload = { ...form }

      if (section === 'teams') {
        if (!payload.name.trim()) throw new Error('اسم الفريق مطلوب')
      }

      if (section === 'players') {
        if (!payload.full_name.trim() || !payload.team_id) {
          throw new Error('الاسم والفريق مطلوبان')
        }
        payload.jersey_number = payload.jersey_number === ''
          ? null : Number(payload.jersey_number)
      }

      if (section === 'matches') {
        if (!payload.home_team_id || !payload.away_team_id) {
          throw new Error('خاصك تختار الفريقين')
        }
        if (payload.home_team_id === payload.away_team_id) {
          throw new Error('لا يمكن اختيار نفس الفريق مرتين')
        }
        if (!payload.match_date) throw new Error('تاريخ المباراة مطلوب')

        payload.home_score = Number(payload.home_score)
        payload.away_score = Number(payload.away_score)
        payload.round_number = Number(payload.round_number)
        payload.match_date = new Date(payload.match_date).toISOString()
      }

      if (section === 'stats') {
        if (!payload.player_id) throw new Error('اختار اللاعب')
        for (const key of [
          'appearances', 'goals', 'assists',
          'yellow_cards', 'red_cards'
        ]) {
          payload[key] = Number(payload[key])
        }
        delete payload.id
        delete payload.updated_at
        payload.updated_at = new Date().toISOString()
      }

      if (editing) {
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', editing)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from(table)
          .insert(payload)

        if (error) throw error
      }

      setShowForm(false)
      setEditing(null)
      await loadData()
      setMessage(ar ? 'تم حفظ البيانات بنجاح' : 'Enregistré avec succès')
    } catch (error) {
      setMessage(error.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  async function deleteData(id) {
    const confirmed = window.confirm(
      ar ? 'واش متأكد من الحذف؟' : 'Confirmer la suppression ?'
    )
    if (!confirmed) return

    const table = section === 'stats' ? 'player_stats' : section

    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      await loadData()
      setMessage(ar ? 'تم الحذف بنجاح' : 'Supprimé avec succès')
    } catch (error) {
      setMessage(error.message)
    }
  }

  function teamName(id) {
    return data.teams.find(team => team.id === id)?.name || '—'
  }

  function playerName(id) {
    return data.players.find(player => player.id === id)?.full_name || '—'
  }

  function input(key, label, type = 'text') {
    return (
      <label className="admin-field" key={key}>
        <span>{label}</span>
        <input
          type={type}
          value={form[key] ?? ''}
          onChange={e => changeField(key, e.target.value)}
          required={['name', 'full_name', 'match_date'].includes(key)}
        />
      </label>
    )
  }

  function selectField(key, label, options) {
    return (
      <label className="admin-field" key={key}>
        <span>{label}</span>
        <select
          value={form[key] ?? ''}
          onChange={e => changeField(key, e.target.value)}
          required
        >
          <option value="">-- {label} --</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  function renderForm() {
    if (section === 'teams') {
      return <>
        {input('name', labels.name)}
        {input('logo_url', labels.logo, 'url')}
      </>
    }

    if (section === 'players') {
      return <>
        {input('full_name', labels.name)}
        {selectField('team_id', labels.team,
          data.teams.map(t => ({ value: t.id, label: t.name })))}
        {input('jersey_number', labels.number, 'number')}
        {selectField('position', labels.position,
          ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
            .map(v => ({ value: v, label: v })))}
      </>
    }

    if (section === 'matches') {
      return <>
        {selectField('home_team_id', labels.home,
          data.teams.map(t => ({ value: t.id, label: t.name })))}
        {selectField('away_team_id', labels.away,
          data.teams.map(t => ({ value: t.id, label: t.name })))}
        {input('match_date', labels.date, 'datetime-local')}
        {input('round_number', labels.round, 'number')}
        {input('leg', labels.leg)}
        {selectField('status', labels.status, [
          { value: 'scheduled', label: ar ? 'قادمة' : 'À venir' },
          { value: 'live', label: ar ? 'مباشرة' : 'En direct' },
          { value: 'finished', label: ar ? 'انتهت' : 'Terminée' }
        ])}
        <div className="admin-score-fields">
          {input('home_score', ar ? 'أهداف المستضيف' : 'Score domicile', 'number')}
          {input('away_score', ar ? 'أهداف الضيف' : 'Score visiteur', 'number')}
        </div>
      </>
    }

    return <>
      {selectField('player_id', labels.player,
        data.players.map(p => ({
          value: p.id,
          label: p.full_name
        })))}
      {input('appearances', labels.appearances, 'number')}
      {input('goals', labels.goals, 'number')}
      {input('assists', labels.assists, 'number')}
      {input('yellow_cards', labels.yellow, 'number')}
      {input('red_cards', labels.red, 'number')}
    </>
  }

  function renderRows() {
    const list = data[section]

    if (!list.length) {
      return <div className="empty-state">{labels.empty}</div>
    }

    return list.map(item => {
      let title = ''
      let details = ''

      if (section === 'teams') {
        title = item.name
        details = item.logo_url || '—'
      } else if (section === 'players') {
        title = item.full_name
        details = `${teamName(item.team_id)} • ${item.position || '—'} • #${item.jersey_number ?? '—'}`
      } else if (section === 'matches') {
        title = `${teamName(item.home_team_id)} × ${teamName(item.away_team_id)}`
        details = `${item.home_score ?? 0} - ${item.away_score ?? 0} • ${item.status}`
      } else {
        title = playerName(item.player_id)
        details = `${labels.goals}: ${item.goals} • ${labels.assists}: ${item.assists} • ${labels.appearances}: ${item.appearances}`
      }

      return (
        <div className="admin-record" key={item.id}>
          <div className="admin-record-info">
            <strong>{title}</strong>
            <small>{details}</small>
          </div>

          <div className="admin-record-actions">
            <button className="admin-icon-button"
              onClick={() => openEdit(item)} aria-label="Edit">
              <Pencil size={17} />
            </button>
            <button className="admin-icon-button danger"
              onClick={() => deleteData(item.id)} aria-label="Delete">
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-welcome">
        <div>
          <span>BOTOLA FAR</span>
          <h2>{ar ? 'لوحة تحكم المسؤول' : 'Administration'}</h2>
          <p>{ar ? 'إدارة محتوى البطولة' : 'Gestion du tournoi'}</p>
        </div>
        <button className="admin-refresh" onClick={loadData}>
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="admin-tabs">
        {sections.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={section === item.id ? 'selected' : ''}
              onClick={() => {
                setSection(item.id)
                setForm({ ...emptyForms[item.id] })
                setEditing(null)
                setShowForm(false)
                setMessage('')
              }}
            >
              <Icon size={18} />
              {ar ? item.label : ({
                teams: 'Équipes',
                matches: 'Matchs',
                players: 'Joueurs',
                stats: 'Statistiques'
              })[item.id]}
            </button>
          )
        })}
      </div>

      <section className="panel admin-content">
        <div className="admin-content-heading">
          <h3>{labels[section]}</h3>
          <button className="admin-primary" onClick={openAdd}>
            <Plus size={17} />
            {labels.add}
          </button>
        </div>

        {message && <div className="admin-message">{message}</div>}

        {showForm && (
          <form className="admin-form" onSubmit={saveData}>
            <div className="admin-form-heading">
              <strong>{editing ? labels.edit : labels.add}</strong>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={19} />
              </button>
            </div>

            <div className="admin-form-grid">
              {renderForm()}
            </div>

            <div className="admin-form-actions">
              <button type="button" className="admin-secondary"
                onClick={() => setShowForm(false)}>
                {labels.cancel}
              </button>
              <button type="submit" className="admin-primary" disabled={saving}>
                <Save size={17} />
                {saving ? '...' : labels.save}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="empty-state">{labels.loading}</div>
        ) : (
          <div className="admin-record-list">{renderRows()}</div>
        )}
      </section>
    </div>
  )
            }
                
