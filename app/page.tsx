"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, Mail, Lock, Clock, Package, RefreshCw, Edit, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import {
  getCurrentLockerNumber,
  updateLockerNumber,
  subscribeToLockerUpdates,
  verifyAdminPassword,
} from "@/lib/firebase"

export default function UsurpedBoxAlert() {
  const [endTime, setEndTime] = useState(() => {
    // Get the end time (48 hours from now)
    const now = new Date()
    return new Date(now.getTime() + 48 * 60 * 60 * 1000)
  })

  const [timeLeft, setTimeLeft] = useState({
    hours: 48,
    minutes: 0,
    seconds: 0,
  })
  const [isExpired, setIsExpired] = useState(false)
  const [lockerNumber, setLockerNumber] = useState("1234") // Default locker number (numeric only)
  const [isBlinking, setIsBlinking] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [newLockerNumber, setNewLockerNumber] = useState("")
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false)
  const [isLockerNumberInvalid, setIsLockerNumberInvalid] = useState(false)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const orbitRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Set page as loaded after a short delay for animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Initialize Firebase and load data
  useEffect(() => {
    // Check URL parameters for locker number
    const getInitialData = async () => {
      try {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search)
        const lockerParam = urlParams.get("locker")

        if (lockerParam && /^\d+$/.test(lockerParam)) {
          // If valid locker number in URL, use it and update Firebase
          setLockerNumber(lockerParam)
          await updateLockerNumber(lockerParam)
        } else {
          // Otherwise, get locker number from Firebase
          const number = await getCurrentLockerNumber()
          setLockerNumber(number)

          // Update URL with the locker number from Firebase
          const url = new URL(window.location.href)
          url.searchParams.set("locker", number)
          window.history.pushState({}, "", url.toString())
        }
      } catch (error) {
        console.error("Error initializing data:", error)
      } finally {
        setIsLoadingInitialData(false)
      }
    }

    getInitialData()

    // Subscribe to real-time updates
    const unsubscribeLockerUpdates = subscribeToLockerUpdates((number) => {
      setLockerNumber(number)

      // Update URL when locker number changes
      const url = new URL(window.location.href)
      url.searchParams.set("locker", number)
      window.history.pushState({}, "", url.toString())
    })

    return () => {
      unsubscribeLockerUpdates()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date()
      const difference = endTime.getTime() - currentTime.getTime()

      if (difference <= 0) {
        clearInterval(interval)
        setIsExpired(true)
        return
      }

      // Calculate hours, minutes, seconds
      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })

      // Toggle blinking effect every second
      setIsBlinking((prev) => !prev)
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  // Format time with leading zeros
  const formatTime = (value: number) => {
    return value < 10 ? `0${value}` : value
  }

  // Handle admin authentication
  const handleAdminAuthentication = () => {
    if (verifyAdminPassword(adminPassword)) {
      setIsAdminAuthenticated(true)
      setIsPasswordIncorrect(false)
      setNewLockerNumber(lockerNumber) // Pre-fill with current locker number
    } else {
      setIsPasswordIncorrect(true)
    }
  }

  // Handle locker number update
  const handleUpdateLockerNumber = async () => {
    // Validate input
    if (!newLockerNumber) {
      setIsLockerNumberInvalid(true)
      return
    }

    if (!/^\d+$/.test(newLockerNumber)) {
      setIsLockerNumberInvalid(true)
      return
    }

    setIsUpdating(true)

    try {
      // Update Firebase with new locker number
      const success = await updateLockerNumber(newLockerNumber)

      if (success) {
        // Reset timer
        const now = new Date()
        setEndTime(new Date(now.getTime() + 48 * 60 * 60 * 1000))
        setIsExpired(false)

        // Update URL with new locker number
        const url = new URL(window.location.href)
        url.searchParams.set("locker", newLockerNumber)
        window.history.pushState({}, "", url.toString())

        // Update local state
        setLockerNumber(newLockerNumber)

        // Close dialog and reset form
        setShowAdminDialog(false)
        setAdminPassword("")
        setNewLockerNumber("")
        setIsAdminAuthenticated(false)

        toast({
          title: "Cambios Aplicados",
          description: `El número de casillero ha sido actualizado a ${newLockerNumber} y el temporizador ha sido reiniciado.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el número de casillero en la base de datos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating locker number:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el número de casillero.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle dialog open/close with stability
  const handleDialogChange = (open: boolean) => {
    if (open) {
      // Prevent background scrolling when dialog is open
      document.body.style.overflow = "hidden"
      setShowAdminDialog(true)
      // Reset form state
      setAdminPassword("")
      setNewLockerNumber("")
      setIsPasswordIncorrect(false)
      setIsLockerNumberInvalid(false)
      setIsAdminAuthenticated(false)
    } else {
      document.body.style.overflow = ""
      setShowAdminDialog(false)
      setAdminPassword("")
      setNewLockerNumber("")
      setIsPasswordIncorrect(false)
      setIsLockerNumberInvalid(false)
      setIsAdminAuthenticated(false)
    }
  }

  // Trigger admin dialog
  const triggerAdminDialog = () => {
    handleDialogChange(true)
  }

  if (isLoadingInitialData) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center">
        <div className="animate-pulse text-[#84ff38] text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative grid-pattern">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orbiting elements */}
        <div ref={orbitRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <div className="absolute w-8 h-8 bg-[#84ff38] rounded-full opacity-10 animate-orbit blur-md"></div>
          <div
            className="absolute w-6 h-6 bg-[#84ff38] rounded-full opacity-5 animate-orbit-reverse blur-md"
            style={{ animationDelay: "-5s" }}
          ></div>
          <div
            className="absolute w-10 h-10 bg-[#84ff38] rounded-full opacity-5 animate-orbit-slow blur-md"
            style={{ animationDelay: "-10s" }}
          ></div>
        </div>

        {/* Gradient spots */}
        <div className="absolute -left-20 top-1/4 w-60 h-60 rounded-full bg-[#84ff38]/10 blur-3xl"></div>
        <div className="absolute right-10 bottom-1/3 w-80 h-80 rounded-full bg-[#84ff38]/5 blur-3xl"></div>
      </div>

      {/* Top border with shimmer effect */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#84ff38]/30 animate-shimmer z-10"></div>

      <div className="max-w-3xl w-full mx-auto text-center z-10">
        {/* Header section */}
        <div className={`mb-8 opacity-0 ${isPageLoaded ? "animate-appear" : ""}`}>
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-[#84ff38] mr-4" />
            <h1 className="text-4xl md:text-6xl font-extrabold gradient-text">CASILLERO USURPADO</h1>
            <AlertTriangle className="h-12 w-12 text-[#84ff38] ml-4" />
          </div>

          <p className="text-gray-400 text-lg max-w-xl mx-auto">Sistema de alerta para casilleros usurpados</p>
        </div>

        {/* Locker visualization */}
        <div className={`mb-8 opacity-0 ${isPageLoaded ? "animate-appear stagger-1" : ""}`}>
          <div className="relative w-24 h-32 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg mx-auto animate-float">
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-10 h-1.5 bg-gray-600 rounded-full"></div>
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-900 rounded-full border border-gray-700 flex items-center justify-center">
              <div className="w-3 h-3 bg-[#84ff38] rounded-full animate-pulse"></div>
            </div>
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-1.5 bg-gray-600 rounded-full"></div>

            {/* Digital circuit lines */}
            <div className="absolute bottom-8 left-0 w-full flex justify-center space-x-1">
              <div className="w-[1px] h-3 bg-[#84ff38]/30"></div>
              <div className="w-[1px] h-5 bg-[#84ff38]/30"></div>
              <div className="w-[1px] h-2 bg-[#84ff38]/30"></div>
              <div className="w-[1px] h-4 bg-[#84ff38]/30"></div>
              <div className="w-[1px] h-3 bg-[#84ff38]/30"></div>
            </div>
          </div>
        </div>

        {/* Main content card */}
        <div className={`modern-card p-8 mb-8 opacity-0 ${isPageLoaded ? "animate-appear stagger-2" : ""}`}>
          <p className="text-xl md:text-2xl mb-6 font-medium text-white">
            Este casillero ha sido usurpado y se abrirá en:
          </p>

          {isExpired ? (
            <div className="text-4xl md:text-6xl font-bold text-[#84ff38] animate-pulse my-8 gradient-text">
              CASILLERO ABIERTO!
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 my-8">
              <div className="modern-card p-6 flex flex-col items-center hover-scale">
                <span className="text-4xl md:text-6xl font-bold text-[#84ff38]">{formatTime(timeLeft.hours)}</span>
                <span className="text-sm md:text-base text-gray-400 mt-2">HORAS</span>
              </div>
              <div className="modern-card p-6 flex flex-col items-center hover-scale">
                <span className="text-4xl md:text-6xl font-bold text-[#84ff38]">{formatTime(timeLeft.minutes)}</span>
                <span className="text-sm md:text-base text-gray-400 mt-2">MINUTOS</span>
              </div>
              <div className="modern-card p-6 flex flex-col items-center hover-scale">
                <span className="text-4xl md:text-6xl font-bold text-[#84ff38]">{formatTime(timeLeft.seconds)}</span>
                <span className="text-sm md:text-base text-gray-400 mt-2">SEGUNDOS</span>
              </div>
            </div>
          )}

          <div className="modern-card accent-card p-6 mb-6">
            <div className="text-xl text-[#84ff38] font-semibold mb-4 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>SE REQUIERE ACCIÓN URGENTE</span>
            </div>

            <div className="text-md md:text-lg text-gray-200 mb-3 flex items-center justify-center">
              <Clock className="h-5 w-5 mr-2 text-[#84ff38]" />
              <span>¡Retira tus pertenencias antes de que se acabe el tiempo!</span>
            </div>

            <div className="text-md md:text-lg text-gray-200 flex items-center justify-center">
              <Package className="h-5 w-5 mr-2 text-[#84ff38]" />
              <span>Después de la fecha límite, CEFARB abrirá este casillero.</span>
            </div>
          </div>
        </div>

        {/* Locker number section */}
        <div
          className={`modern-card p-4 inline-block mb-8 cursor-pointer hover:border-[#84ff38]/50 transition-colors duration-300 opacity-0 ${
            isPageLoaded ? "animate-appear stagger-3" : ""
          }`}
          onClick={triggerAdminDialog}
          title="Admin: Click to reset timer and edit locker number"
        >
          <div className="flex items-center justify-center">
            <Mail className="h-6 w-6 text-[#84ff38] mr-2" />
            <div className="text-xl md:text-2xl font-bold">
              Número de casillero: <span className="text-[#84ff38]">{lockerNumber}</span>
            </div>
            <Edit className="h-4 w-4 text-gray-400 ml-2 opacity-50" />
          </div>
        </div>

        {/* Footer */}
        <div
          className={`text-gray-500 flex items-center justify-center opacity-0 ${
            isPageLoaded ? "animate-appear stagger-4" : ""
          }`}
        >
          <Lock className="h-4 w-4 mr-2" />
          <p>Contáctenos para asistencia: 963 492 688</p>
        </div>
      </div>

      {/* Bottom border with shimmer effect */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-[#84ff38]/30 animate-shimmer z-10"></div>

      {/* Admin dialog with password authentication */}
      <Dialog open={showAdminDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="modern-card border-[#84ff38]/20 text-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md m-0 p-6 z-50 shadow-xl">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 rounded-full text-gray-400 hover:text-white"
              onClick={() => handleDialogChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl text-[#84ff38]">Panel de control de administración</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isAdminAuthenticated
                ? "Actualice el número de casillero y reinicie el temporizador."
                : "Ingrese la contraseña de administrador para continuar."}
            </DialogDescription>
          </DialogHeader>

          {!isAdminAuthenticated ? (
            // Password authentication form
            <div className="py-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-gray-300">
                  Contraseña
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Ingrese la contraseña de administrador"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value)
                    setIsPasswordIncorrect(false)
                  }}
                  className={`bg-gray-800/50 border-gray-700 text-white ${isPasswordIncorrect ? "border-red-500" : ""}`}
                />
                {isPasswordIncorrect && (
                  <p className="text-red-500 text-sm">Contraseña incorrecta. Inténtalo de nuevo.</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleAdminAuthentication}
                  className="bg-[#84ff38]/20 hover:bg-[#84ff38]/30 text-[#84ff38] border border-[#84ff38]/30"
                >
                  Continuar
                </Button>
              </div>
            </div>
          ) : (
            // Locker number update form
            <div className="py-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locker-number" className="text-gray-300">
                  Número de casillero
                </Label>
                <Input
                  id="locker-number"
                  type="text"
                  placeholder="Ingrese el número de casillero"
                  value={newLockerNumber}
                  onChange={(e) => {
                    setNewLockerNumber(e.target.value)
                    setIsLockerNumberInvalid(false)
                  }}
                  className={`bg-gray-800/50 border-gray-700 text-white ${
                    isLockerNumberInvalid ? "border-red-500" : ""
                  }`}
                />
                {isLockerNumberInvalid && (
                  <p className="text-red-500 text-sm">El número de casillero debe contener solo dígitos.</p>
                )}
                <p className="text-xs text-gray-500">
                  Al actualizar el número de casillero, también se reiniciará el temporizador a 48 horas.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateLockerNumber}
                  disabled={isUpdating}
                  className="bg-[#84ff38]/20 hover:bg-[#84ff38]/30 text-[#84ff38] border border-[#84ff38]/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isUpdating ? "Aplicando..." : "Aplicar cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
