"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, LogOut, Save } from "lucide-react"
import { updateLockerNumber, logoutAdmin, getCurrentUser } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

interface AdminPanelProps {
  currentLockerNumber: string
  onLockerNumberUpdate: (number: string) => void
  onLogout: () => void
}

export default function AdminPanel({ currentLockerNumber, onLockerNumberUpdate, onLogout }: AdminPanelProps) {
  const [newLockerNumber, setNewLockerNumber] = useState(currentLockerNumber)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    // Get current user email
    const user = getCurrentUser()
    if (user && user.email) {
      setAdminEmail(user.email)
    }
  }, [])

  const handleUpdateLockerNumber = async () => {
    // Validate input
    if (!newLockerNumber) {
      setError("Por favor ingrese un número de casillero")
      return
    }

    if (!/^\d+$/.test(newLockerNumber)) {
      setError("El número de casillero debe contener solo dígitos")
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const success = await updateLockerNumber(newLockerNumber)

      if (success) {
        // Update URL with new locker number
        const url = new URL(window.location.href)
        url.searchParams.set("locker", newLockerNumber)
        window.history.pushState({}, "", url.toString())

        // Call the callback to update the parent component
        onLockerNumberUpdate(newLockerNumber)

        toast({
          title: "Número de casillero actualizado",
          description: `El número de casillero ha sido actualizado a ${newLockerNumber}.`,
          variant: "default",
        })
      } else {
        setError("Error al actualizar el número de casillero. Por favor intente de nuevo.")
      }
    } catch (err) {
      setError("Error al actualizar el número de casillero. Por favor intente de nuevo.")
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    setIsUpdating(true)
    try {
      await logoutAdmin()
      onLogout()
    } catch (err) {
      console.error("Error logging out:", err)
      setError("Error al cerrar sesión. Por favor intente de nuevo.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="modern-card p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-[#84ff38] font-semibold">Panel de Administración</h2>
        {adminEmail && <div className="text-sm text-gray-400">{adminEmail}</div>}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="locker-number" className="text-gray-300">
            Número de Casillero
          </Label>
          <Input
            id="locker-number"
            type="text"
            value={newLockerNumber}
            onChange={(e) => {
              setNewLockerNumber(e.target.value)
              setError(null)
            }}
            placeholder="Ingrese el número de casillero"
            className="bg-gray-800/50 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500">El número de casillero debe contener solo dígitos.</p>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleUpdateLockerNumber}
            disabled={isUpdating}
            className="flex-1 bg-[#84ff38]/20 hover:bg-[#84ff38]/30 text-[#84ff38] border border-[#84ff38]/30"
          >
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? "Actualizando..." : "Actualizar Casillero"}
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            disabled={isUpdating}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </div>
  )
}
