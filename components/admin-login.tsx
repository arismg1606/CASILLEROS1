"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { loginAdmin } from "@/lib/firebase"

interface AdminLoginProps {
  onLoginSuccess: () => void
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!email || !password) {
      setError("Por favor ingrese su correo electrónico y contraseña")
      setIsLoading(false)
      return
    }

    try {
      const success = await loginAdmin(email, password)
      if (success) {
        onLoginSuccess()
      } else {
        setError("Credenciales inválidas. Por favor intente de nuevo.")
      }
    } catch (err) {
      setError("Error al iniciar sesión. Por favor intente de nuevo.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modern-card p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl text-[#84ff38] font-semibold mb-4">Acceso de Administrador</h2>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">
            Correo Electrónico
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="bg-gray-800/50 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-gray-800/50 border-gray-700 text-white"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#84ff38]/20 hover:bg-[#84ff38]/30 text-[#84ff38] border border-[#84ff38]/30"
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </div>
  )
}
