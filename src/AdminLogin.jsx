
import { useState } from 'react'
import { supabase } from './supabase.js'

export default function AdminLogin({ onLogin, lang = 'ar' }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isArabic = lang === 'ar'

  async function handleLogin(e) {
    e.preventDefault()

    if (!password.trim()) {
      setError(isArabic ? 'أدخل كلمة المرور' : 'Entrez le mot de passe')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: 'aymankarkich9@gmail.com',
          password
        })

      if (authError) throw authError

      const { data: isAdmin, error: adminError } =
        await supabase.rpc('is_admin')

      if (adminError) throw adminError

      if (isAdmin !== true) {
        await supabase.auth.signOut()
        throw new Error(
          isArabic
            ? 'ليس لديك صلاحية المسؤول'
            : 'Accès administrateur refusé'
        )
      }

      onLogin(data.user)

    } catch (err) {
      setError(
        isArabic
          ? 'كلمة المرور غير صحيحة أو تعذر تسجيل الدخول'
          : 'Mot de passe incorrect ou connexion impossible'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '420px',
      margin: '40px auto',
      padding: '30px',
      background: '#18231f',
      border: '1px solid #30483b',
      borderRadius: '16px',
      color: 'white',
      textAlign: 'center'
    }}>
      <h2>BOTOLA FAR</h2>

      <p>
        {isArabic ? 'دخول المسؤول' : 'Accès administrateur'}
      </p>

      <form onSubmit={handleLogin}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={isArabic ? 'كلمة المرور' : 'Mot de passe'}
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '14px',
            boxSizing: 'border-box',
            borderRadius: '8px',
            background: '#101a15',
            color: 'white',
            border: '1px solid #40564a',
            marginBottom: '15px'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          {loading
            ? (isArabic ? 'جاري التحقق...' : 'Vérification...')
            : (isArabic ? 'دخول' : 'Connexion')}
        </button>
      </form>

      {error && (
        <p style={{ color: '#ff7777' }}>{error}</p>
      )}
    </div>
  )
}
