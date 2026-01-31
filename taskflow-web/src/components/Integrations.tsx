'use client'

import { useState } from 'react'
import { Mail, MessageCircle, Shield, Check, ExternalLink, Info, Lock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoogleCalendarSync } from './GoogleCalendarSync'

export function Integrations() {
  const [gmailConnected, setGmailConnected] = useState(false)

  return (
    <div className="space-y-6">
      {/* Google Calendar Integration */}
      <GoogleCalendarSync />

      {/* Security Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              Jouw gegevens zijn veilig
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Al je taken en afspraken zijn beveiligd met Row Level Security.
              Alleen jij hebt toegang tot jouw data.
            </p>
          </div>
        </div>
      </div>

      {/* Gmail Integration */}
      <IntegrationCard
        icon={<Mail className="w-6 h-6" />}
        title="Gmail"
        description="Detecteer taken en afspraken uit je e-mails"
        color="red"
        isConnected={gmailConnected}
        features={[
          'Automatisch actiepunten herkennen',
          'Vergaderverzoeken importeren',
          'Deadlines uit e-mails halen'
        ]}
        onConnect={() => {
          // In productie: OAuth flow starten
          alert('Gmail integratie vereist OAuth setup in Supabase.\nZie de documentatie voor configuratie.')
        }}
        onDisconnect={() => setGmailConnected(false)}
      />

      {/* WhatsApp Integration */}
      <IntegrationCard
        icon={<MessageCircle className="w-6 h-6" />}
        title="WhatsApp"
        description="Deel berichten naar TaskFlow"
        color="green"
        isConnected={true}
        isAlwaysAvailable
        features={[
          'Deel berichten via iOS Share menu',
          'Automatische taak-detectie',
          'Datum en tijd herkenning'
        ]}
        instructions={
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <h4 className="font-medium text-sm mb-2">Hoe te gebruiken:</h4>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>1. Open een WhatsApp bericht</li>
              <li>2. Houd het bericht ingedrukt</li>
              <li>3. Tik op "Deel" of "Forward"</li>
              <li>4. Kies TaskFlow</li>
            </ol>
          </div>
        }
      />

      {/* Voice Input Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-ios">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎤</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Spraak invoer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Spreek je taken en afspraken in met natuurlijke taal.
              TaskFlow herkent automatisch datums, tijden en prioriteiten.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                '"Meeting morgen om 10"',
                '"Boodschappen doen vandaag"',
                '"Urgent: rapport afmaken"'
              ].map(example => (
                <span
                  key={example}
                  className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Info */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              Privacy & Beveiliging
            </h4>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Je data wordt versleuteld opgeslagen</li>
              <li>• Geen toegang voor derden</li>
              <li>• Integraties gebruiken alleen-lezen toegang</li>
              <li>• Je kunt altijd je data exporteren of verwijderen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

interface IntegrationCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: 'red' | 'green' | 'blue'
  isConnected: boolean
  isAlwaysAvailable?: boolean
  features: string[]
  instructions?: React.ReactNode
  onConnect?: () => void
  onDisconnect?: () => void
}

function IntegrationCard({
  icon,
  title,
  description,
  color,
  isConnected,
  isAlwaysAvailable,
  features,
  instructions,
  onConnect,
  onDisconnect
}: IntegrationCardProps) {
  const [expanded, setExpanded] = useState(false)

  const colorClasses = {
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'bg-red-500',
      text: 'text-red-700 dark:text-red-300',
      button: 'bg-red-500 hover:bg-red-600'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'bg-green-500',
      text: 'text-green-700 dark:text-green-300',
      button: 'bg-green-500 hover:bg-green-600'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
      button: 'bg-blue-500 hover:bg-blue-600'
    }
  }

  const colors = colorClasses[color]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-ios overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white', colors.icon)}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              {(isConnected || isAlwaysAvailable) && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
                  {isAlwaysAvailable ? 'Beschikbaar' : 'Verbonden'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-4 space-y-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Check className={cn('w-4 h-4', colors.text)} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {instructions}

        {/* Action Button */}
        {!isAlwaysAvailable && (
          <div className="mt-4">
            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="w-full py-3 rounded-xl font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 btn-press"
              >
                Ontkoppelen
              </button>
            ) : (
              <button
                onClick={onConnect}
                className={cn(
                  'w-full py-3 rounded-xl font-medium text-white btn-press',
                  colors.button
                )}
              >
                Verbinden
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
