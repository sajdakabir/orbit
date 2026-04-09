import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  Search,
  RefreshCw,
  X,
  Database,
  Zap,
  Link2,
} from 'lucide-react'

interface ComposioTool {
  name: string
  key: string
  description: string
  logo: string
  enabled: boolean
  appId: string
  categories: string[]
}

interface ComposioConnection {
  id: string
  toolkitSlug: string
  userId: string
  status:
    | 'INITIALIZING'
    | 'ACTIVE'
    | 'EXPIRED'
    | 'FAILED'
    | 'INITIATED'
    | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export default function LibraryContent() {
  const [tools, setTools] = useState<ComposioTool[]>([])
  const [connections, setConnections] = useState<ComposioConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Data panel state
  const [selectedApp, setSelectedApp] = useState<ComposioTool | null>(null)
  const [appData, setAppData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(false)

  // Tools count cache
  const [toolsCounts, setToolsCounts] = useState<Record<string, number>>({})

  const loadTools = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const [appsResult, connectionsResult] = await Promise.all([
        window.api.composio.getApps(),
        window.api.composio.getConnections(),
      ])

      if (!appsResult.success) {
        setError(appsResult.error || 'Failed to load apps')
        return
      }

      if (!connectionsResult.success) {
        setError(connectionsResult.error || 'Failed to load connections')
        return
      }

      const filteredApps = (appsResult.data || [])
        .map((app: any) => ({
          name: app.name || app.key,
          key: app.key,
          description: app.description || `Connect with ${app.name || app.key}`,
          logo: app.logo || '',
          enabled: app.enabled || false,
          appId: app.appId || app.key,
          categories: app.categories || [],
        }))

      setTools(filteredApps)
      setConnections(connectionsResult.data || [])
    } catch (err) {
      console.error('Failed to load Composio tools:', err)
      setError('Failed to load tools. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadTools()
  }, [loadTools])

  // Listen for deep link callback when user returns from OAuth
  useEffect(() => {
    const cleanup = window.api.on(
      'composio-connected',
      (_event: any, status: string, _connectedAccountId: string) => {
        console.log('[LibraryContent] Composio callback received:', status)
        if (status === 'success') {
          loadTools(true)
        }
      },
    )
    return cleanup
  }, [loadTools])

  const handleConnect = async (tool: ComposioTool) => {
    try {
      setConnecting(tool.key)
      setError(null)

      const result = await window.api.composio.initiateConnection(tool.key)

      if (!result.success) {
        setError(result.error || `Failed to connect ${tool.name}`)
        setConnecting(null)
        return
      }

      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank')
        setTimeout(() => loadTools(true), 5000)
      }
    } catch (err) {
      console.error('Failed to connect tool:', err)
      setError(`Failed to connect ${tool.name}. Please try again.`)
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      setError(null)
      const result = await window.api.composio.disconnect(connectionId)

      if (result.success) {
        setSelectedApp(null)
        setAppData(null)
        await loadTools(true)
      } else {
        setError('Failed to disconnect. Please try again.')
      }
    } catch (err) {
      console.error('Failed to disconnect tool:', err)
      setError('Failed to disconnect. Please try again.')
    }
  }

  const handleViewData = async (tool: ComposioTool) => {
    setSelectedApp(tool)
    setLoadingData(true)
    setAppData(null)

    try {
      const result = await window.api.composio.getTools(tool.key)
      if (result.success) {
        setAppData(result.data)
        const count =
          result.data?.meta?.tools?.length || result.data?.tools?.length || 0
        setToolsCounts(prev => ({ ...prev, [tool.key]: count }))
      } else {
        setAppData({ error: result.error || 'Failed to load toolkit details' })
      }
    } catch (err) {
      console.error('Failed to fetch app data:', err)
      setAppData({ error: 'Failed to load toolkit details' })
    } finally {
      setLoadingData(false)
    }
  }

  const isConnected = (toolKey: string) => {
    return connections.some(
      conn => conn.toolkitSlug === toolKey && conn.status === 'ACTIVE',
    )
  }

  const getConnectionId = (toolKey: string) => {
    const conn = connections.find(
      c => c.toolkitSlug === toolKey && c.status === 'ACTIVE',
    )
    return conn?.id
  }

  const filteredTools = tools.filter(tool => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const connectedCount = tools.filter(t => isConnected(t.key)).length

  // Separate connected and available apps
  const connectedApps = filteredTools.filter(t => isConnected(t.key))
  const availableApps = filteredTools.filter(t => !isConnected(t.key))

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 py-8 flex items-center justify-center h-[640px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#2A2B2E] border-t-white/60 animate-spin" />
          <p className="text-sm text-[#6B6D6F] mt-1">Loading apps...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-8 py-8 h-[640px] overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Library
          </h1>
          <p className="text-[13px] text-[#6B6D6F] mt-0.5">
            {connectedCount > 0
              ? `${connectedCount} connected · ${tools.length} available`
              : 'Connect your apps and integrations'}
          </p>
        </div>
        <button
          onClick={() => loadTools(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[13px] text-[#6B6D6F] hover:text-white/80 transition-colors disabled:opacity-40"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-5 px-4 py-3 bg-red-500/5 border border-red-500/15 rounded-lg">
          <p className="text-[13px] text-red-400/90">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4B4D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#161819] border border-[#2A2B2E] rounded-lg text-[13px] text-white placeholder-[#4A4B4D] focus:outline-none focus:border-[#3a3a3b] transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* App List */}
        <div className={selectedApp ? 'w-1/2' : 'w-full'}>
          {filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#4A4B4D]">
              <Search className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium text-[#6B6D6F]">
                No apps found
              </p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              {/* Connected Section */}
              {connectedApps.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-medium text-[#6B6D6F] uppercase tracking-wider">
                      Connected
                    </span>
                  </div>
                  <div className="border border-[#2A2B2E] rounded-xl overflow-hidden divide-y divide-[#2A2B2E]">
                    {connectedApps.map(tool => {
                      const connectionId = getConnectionId(tool.key)
                      return (
                        <ToolRow
                          key={tool.key}
                          tool={tool}
                          connected={true}
                          connecting={false}
                          selected={selectedApp?.key === tool.key}
                          toolsCount={toolsCounts[tool.key]}
                          onConnect={() => handleConnect(tool)}
                          onDisconnect={() =>
                            connectionId && handleDisconnect(connectionId)
                          }
                          onViewData={() => handleViewData(tool)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Available Section */}
              {availableApps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-[12px] font-medium text-[#6B6D6F] uppercase tracking-wider">
                      Available
                    </span>
                    <span className="text-[11px] text-[#4A4B4D]">
                      {availableApps.length}
                    </span>
                  </div>
                  <div className="border border-[#2A2B2E] rounded-xl overflow-hidden divide-y divide-[#2A2B2E]">
                    {availableApps.map(tool => {
                      const isConnectingThis = connecting === tool.key
                      return (
                        <ToolRow
                          key={tool.key}
                          tool={tool}
                          connected={false}
                          connecting={isConnectingThis}
                          selected={selectedApp?.key === tool.key}
                          toolsCount={toolsCounts[tool.key]}
                          onConnect={() => handleConnect(tool)}
                          onDisconnect={() => {}}
                          onViewData={() => handleViewData(tool)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Data Panel */}
        {selectedApp && (
          <div className="w-1/2 bg-[#161819] border border-[#2A2B2E] rounded-xl p-5 h-fit max-h-[480px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                {selectedApp.logo ? (
                  <img
                    src={selectedApp.logo}
                    alt={selectedApp.name}
                    className="w-6 h-6 rounded-md"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-[#2A2B2E] flex items-center justify-center">
                    <Database className="w-3.5 h-3.5 text-[#6B6D6F]" />
                  </div>
                )}
                <h3 className="text-[13px] font-medium text-white">
                  {selectedApp.name}
                  <span className="text-[#4A4B4D] font-normal ml-2">
                    Tools
                  </span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedApp(null)
                  setAppData(null)
                }}
                className="text-[#4A4B4D] hover:text-white/70 transition-colors p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 rounded-full border-2 border-[#2A2B2E] border-t-white/40 animate-spin" />
              </div>
            ) : appData?.error ? (
              <p className="text-[13px] text-red-400/80">{appData.error}</p>
            ) : appData ? (
              <DataPanel data={appData} appName={selectedApp.name} />
            ) : (
              <p className="text-[13px] text-[#4A4B4D]">No data available</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 pb-4 text-center">
        <p className="text-[11px] text-[#3a3a3b]">
          Powered by{' '}
          <a
            href="https://composio.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4A4B4D] hover:text-[#6B6D6F] transition-colors"
          >
            Composio
          </a>
        </p>
      </div>
    </div>
  )
}

// Data Panel showing toolkit tools
function DataPanel({ data, appName }: { data: any; appName: string }) {
  const tools = data.meta?.tools || data.tools || []
  const description = data.meta?.description || ''

  return (
    <div className="space-y-2">
      {description && (
        <p className="text-[12px] text-[#6B6D6F] mb-3 leading-relaxed">
          {description}
        </p>
      )}

      {tools.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] text-[#4A4B4D] font-medium uppercase tracking-wider mb-2">
            {tools.length} tool{tools.length !== 1 ? 's' : ''} available
          </p>
          {tools.slice(0, 20).map((tool: any, i: number) => (
            <div
              key={tool.slug || tool.name || i}
              className="px-3 py-2.5 bg-[#1C1E21] rounded-lg group hover:bg-[#1F2123] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-[#4A4B4D] group-hover:text-[#6B6D6F] shrink-0 transition-colors" />
                <span className="text-[12px] font-medium text-[#B0B1B3] group-hover:text-white truncate transition-colors">
                  {tool.display_name || tool.name || tool.slug}
                </span>
              </div>
              {tool.description && (
                <p className="text-[11px] text-[#4A4B4D] mt-1 ml-5 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              )}
            </div>
          ))}
          {tools.length > 20 && (
            <p className="text-[11px] text-[#4A4B4D] text-center pt-2">
              +{tools.length - 20} more tools
            </p>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-[#4A4B4D]">
          No individual tools listed for {appName}.
        </p>
      )}
    </div>
  )
}

// Tool Row Component (list layout)
interface ToolRowProps {
  tool: ComposioTool
  connected: boolean
  connecting: boolean
  selected: boolean
  toolsCount?: number
  onConnect: () => void
  onDisconnect: () => void
  onViewData: () => void
}

function ToolRow({
  tool,
  connected,
  connecting,
  selected,
  toolsCount,
  onConnect,
  onDisconnect,
  onViewData,
}: ToolRowProps) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[#161819] ${
        selected ? 'bg-[#161819]' : 'bg-transparent'
      }`}
    >
      {/* Logo with connected indicator */}
      <div className="relative shrink-0">
        {tool.logo ? (
          <img
            src={tool.logo}
            alt={tool.name}
            className="w-9 h-9 rounded-lg object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-[#1F2123] flex items-center justify-center">
            <span className="text-sm font-semibold text-[#6B6D6F]">
              {tool.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {connected && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-[#111213]" />
        )}
      </div>

      {/* Name & Description */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-medium text-white leading-tight">
          {tool.name}
        </h3>
        <p className="text-[12px] text-[#6B6D6F] mt-0.5 truncate">
          {tool.description}
        </p>
      </div>

      {/* Tools Count */}
      {toolsCount !== undefined && toolsCount > 0 && (
        <div className="flex items-center gap-1.5 shrink-0 text-[#6B6D6F]">
          <Link2 className="w-3.5 h-3.5" />
          <span className="text-[13px]">{toolsCount}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {connected ? (
          <>
            <button
              onClick={onViewData}
              className="px-4 py-1.5 text-[12px] font-medium text-white/90 bg-[#232527] hover:bg-[#2A2D30] border border-[#2A2B2E] rounded-full transition-colors"
            >
              Manage
            </button>
            <button
              onClick={onDisconnect}
              className="px-4 py-1.5 text-[12px] font-medium text-white bg-[#111213] hover:bg-[#1A1C1E] border border-[#2A2B2E] rounded-full transition-colors"
            >
              Reconnect
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting || !tool.enabled}
            className="px-5 py-1.5 text-[12px] font-medium text-white bg-[#111213] hover:bg-[#1A1C1E] border border-[#2A2B2E] rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Connecting...
              </span>
            ) : (
              'Connect'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
