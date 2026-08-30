'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@astrale-os/ui/alert-dialog'
import { Badge } from '@astrale-os/ui/badge'
import { Button } from '@astrale-os/ui/button'
import { Card, CardContent } from '@astrale-os/ui/card'
import { Checkbox } from '@astrale-os/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@astrale-os/ui/dropdown-menu'
import { Input } from '@astrale-os/ui/input'
import { Label } from '@astrale-os/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@astrale-os/ui/select'
import { Separator } from '@astrale-os/ui/separator'
import { Spinner } from '@astrale-os/ui/spinner'
import { Switch } from '@astrale-os/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@astrale-os/ui/tabs'
import { Textarea } from '@astrale-os/ui/textarea'
import {
  Eye,
  EyeOff,
  Copy,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Upload,
  Download,
  Save,
  X,
  Link2,
  Lock,
  Unlock,
  Clock,
  ToggleLeft,
  KeyRound,
  Database,
  Settings2,
} from 'lucide-react'
import { useId, useState } from 'react'

type VarType = 'url' | 'secret' | 'boolean' | 'number' | 'string'
type VarGroup = 'database' | 'api-keys' | 'feature-flags' | 'general'

export interface EnvVar {
  id: number
  key: string
  value: string
  environments: string[]
  type: VarType
  group: VarGroup
  encrypted: boolean
  lastModifiedBy: string
  lastModifiedAt: string
  linked: boolean
}

const allVariables: EnvVar[] = [
  {
    id: 1,
    key: 'DATABASE_URL',
    value: 'postgresql://user:pass@db.example.com:5432/mydb',
    environments: ['production', 'preview'],
    type: 'url',
    group: 'database',
    encrypted: true,
    lastModifiedBy: 'John',
    lastModifiedAt: '2h ago',
    linked: true,
  },
  {
    id: 2,
    key: 'DATABASE_POOL_SIZE',
    value: '20',
    environments: ['production'],
    type: 'number',
    group: 'database',
    encrypted: false,
    lastModifiedBy: 'Sarah',
    lastModifiedAt: '1d ago',
    linked: false,
  },
  {
    id: 3,
    key: 'REDIS_URL',
    value: 'redis://default:abc123@redis.example.com:6379',
    environments: ['production', 'preview'],
    type: 'url',
    group: 'database',
    encrypted: true,
    lastModifiedBy: 'John',
    lastModifiedAt: '3h ago',
    linked: true,
  },
  {
    id: 4,
    key: 'REDIS_URL',
    value: 'redis://localhost:6379',
    environments: ['development'],
    type: 'url',
    group: 'database',
    encrypted: false,
    lastModifiedBy: 'John',
    lastModifiedAt: '3h ago',
    linked: true,
  },
  {
    id: 5,
    key: 'STRIPE_SECRET_KEY',
    value: 'sk_live_51abc123def456ghi789jkl',
    environments: ['production'],
    type: 'secret',
    group: 'api-keys',
    encrypted: true,
    lastModifiedBy: 'Admin',
    lastModifiedAt: '5d ago',
    linked: false,
  },
  {
    id: 6,
    key: 'STRIPE_SECRET_KEY',
    value: 'sk_test_51abc123def456ghi789jkl',
    environments: ['development', 'preview'],
    type: 'secret',
    group: 'api-keys',
    encrypted: true,
    lastModifiedBy: 'Admin',
    lastModifiedAt: '5d ago',
    linked: false,
  },
  {
    id: 7,
    key: 'NEXT_PUBLIC_API_URL',
    value: 'https://api.myapp.com/v1',
    environments: ['production', 'preview', 'development'],
    type: 'url',
    group: 'api-keys',
    encrypted: false,
    lastModifiedBy: 'Sarah',
    lastModifiedAt: '12h ago',
    linked: true,
  },
  {
    id: 8,
    key: 'SENTRY_DSN',
    value: 'https://abc123@o456.ingest.sentry.io/789',
    environments: ['production', 'preview'],
    type: 'url',
    group: 'api-keys',
    encrypted: true,
    lastModifiedBy: 'Mike',
    lastModifiedAt: '2d ago',
    linked: true,
  },
  {
    id: 9,
    key: 'OPENAI_API_KEY',
    value: 'sk-proj-abc123def456ghi789jklmno',
    environments: ['production', 'preview', 'development'],
    type: 'secret',
    group: 'api-keys',
    encrypted: true,
    lastModifiedBy: 'John',
    lastModifiedAt: '1h ago',
    linked: true,
  },
  {
    id: 10,
    key: 'ENABLE_DARK_MODE',
    value: 'true',
    environments: ['production', 'preview', 'development'],
    type: 'boolean',
    group: 'feature-flags',
    encrypted: false,
    lastModifiedBy: 'Sarah',
    lastModifiedAt: '6h ago',
    linked: true,
  },
  {
    id: 11,
    key: 'ENABLE_BETA_FEATURES',
    value: 'false',
    environments: ['production'],
    type: 'boolean',
    group: 'feature-flags',
    encrypted: false,
    lastModifiedBy: 'Mike',
    lastModifiedAt: '1d ago',
    linked: false,
  },
  {
    id: 12,
    key: 'ENABLE_BETA_FEATURES',
    value: 'true',
    environments: ['development', 'preview'],
    type: 'boolean',
    group: 'feature-flags',
    encrypted: false,
    lastModifiedBy: 'Mike',
    lastModifiedAt: '1d ago',
    linked: false,
  },
  {
    id: 13,
    key: 'NEXT_PUBLIC_SITE_URL',
    value: 'https://myapp.vercel.app',
    environments: ['production'],
    type: 'url',
    group: 'general',
    encrypted: false,
    lastModifiedBy: 'Admin',
    lastModifiedAt: '7d ago',
    linked: false,
  },
  {
    id: 14,
    key: 'NEXT_PUBLIC_SITE_URL',
    value: 'http://localhost:3000',
    environments: ['development'],
    type: 'url',
    group: 'general',
    encrypted: false,
    lastModifiedBy: 'Admin',
    lastModifiedAt: '7d ago',
    linked: false,
  },
  {
    id: 15,
    key: 'NODE_ENV',
    value: 'production',
    environments: ['production'],
    type: 'string',
    group: 'general',
    encrypted: false,
    lastModifiedBy: 'System',
    lastModifiedAt: '30d ago',
    linked: false,
  },
  {
    id: 16,
    key: 'LOG_LEVEL',
    value: 'info',
    environments: ['production', 'preview'],
    type: 'string',
    group: 'general',
    encrypted: false,
    lastModifiedBy: 'John',
    lastModifiedAt: '4h ago',
    linked: true,
  },
  {
    id: 17,
    key: 'MAX_UPLOAD_SIZE',
    value: '10485760',
    environments: ['production', 'preview', 'development'],
    type: 'number',
    group: 'general',
    encrypted: false,
    lastModifiedBy: 'Sarah',
    lastModifiedAt: '3d ago',
    linked: true,
  },
]

type TypeBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'

const typeConfig: Record<VarType, { label: string; variant: TypeBadgeVariant }> = {
  url: { label: 'URL', variant: 'outline' },
  secret: { label: 'Secret', variant: 'destructive' },
  boolean: { label: 'Bool', variant: 'secondary' },
  number: { label: 'Num', variant: 'default' },
  string: { label: 'Str', variant: 'ghost' },
}

const groupConfig: Record<VarGroup, { label: string; icon: typeof Database }> = {
  database: { label: 'Database', icon: Database },
  'api-keys': { label: 'API Keys', icon: KeyRound },
  'feature-flags': { label: 'Feature Flags', icon: ToggleLeft },
  general: { label: 'General', icon: Settings2 },
}

const envBadgeVariant = (env: string) => {
  switch (env) {
    case 'production':
      return 'default' as const
    case 'preview':
      return 'secondary' as const
    case 'development':
      return 'outline' as const
    default:
      return 'secondary' as const
  }
}

export interface EnvVariablesProps {
  defaultVariables?: EnvVar[]
  onCreateVariable?(variable: EnvVar): Promise<void> | void
  onUpdateVariable?(variable: EnvVar): Promise<void> | void
  onDeleteVariable?(variable: EnvVar): Promise<void> | void
  onCopyValue?(variable: EnvVar): Promise<void> | void
}

export function EnvVariables({
  defaultVariables = allVariables,
  onCreateVariable,
  onUpdateVariable,
  onDeleteVariable,
  onCopyValue,
}: EnvVariablesProps = {}) {
  const [variables, setVariables] = useState<EnvVar[]>(defaultVariables)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnvVar | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const fieldId = useId()
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('production')
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newEnvs, setNewEnvs] = useState<string[]>(['development'])
  const [newEncrypted, setNewEncrypted] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>('all')

  const toggleReveal = (id: number) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredVars = variables.filter(
    (v) =>
      v.environments.includes(activeTab) &&
      (search === '' || v.key.toLowerCase().includes(search.toLowerCase())) &&
      (groupFilter === 'all' || v.group === groupFilter),
  )

  const groupedVars = (Object.keys(groupConfig) as VarGroup[]).reduce(
    (acc, group) => {
      const vars = filteredVars.filter((v) => v.group === group)
      if (vars.length > 0) acc[group] = vars
      return acc
    },
    {} as Record<VarGroup, EnvVar[]>,
  )

  const bulkText = filteredVars.map((v) => `${v.key}=${v.value}`).join('\n')

  const totalCount = variables.filter((v) => v.environments.includes(activeTab)).length

  const handleExport = () => {
    navigator.clipboard.writeText(bulkText)
  }

  const resetForm = () => {
    setShowAddForm(false)
    setNewKey('')
    setNewValue('')
    setNewEnvs(['development'])
    setNewEncrypted(false)
  }

  const toggleNewEnv = (env: string) => {
    setNewEnvs((prev) => (prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]))
  }

  const runAction = async (
    busyMessage: string,
    successMessage: string,
    errorMessage: string,
    perform: () => Promise<void> | void,
    apply: () => void,
  ) => {
    setPendingMessage(busyMessage)
    setStatus(null)
    try {
      await perform()
      apply()
      setStatus({ tone: 'success', message: successMessage })
    } catch {
      setStatus({ tone: 'error', message: errorMessage })
    } finally {
      setPendingMessage(null)
    }
  }

  const handleSave = async () => {
    const key = newKey.trim()
    if (key === '') {
      setStatus({ tone: 'error', message: 'Enter a variable name before saving.' })
      return
    }
    const editing = editingId === null ? undefined : variables.find((v) => v.id === editingId)
    const newType: VarType = newEncrypted ? 'secret' : 'string'
    const variable: EnvVar = {
      id: editing ? editing.id : Math.max(0, ...variables.map((v) => v.id)) + 1,
      key,
      value: newValue,
      environments: newEnvs,
      type: editing ? editing.type : newType,
      group: editing ? editing.group : 'general',
      encrypted: newEncrypted,
      lastModifiedBy: 'You',
      lastModifiedAt: 'just now',
      linked: editing ? editing.linked : false,
    }
    await runAction(
      editing ? 'Updating variable…' : 'Adding variable…',
      editing ? `Updated ${key}.` : `Added ${key}.`,
      editing ? 'Could not update the variable.' : 'Could not add the variable.',
      () => (editing ? onUpdateVariable?.(variable) : onCreateVariable?.(variable)),
      () => {
        setVariables((prev) =>
          editing ? prev.map((v) => (v.id === variable.id ? variable : v)) : [...prev, variable],
        )
        setEditingId(null)
        resetForm()
      },
    )
  }

  const handleEdit = (envVar: EnvVar) => {
    setEditingId(envVar.id)
    setShowAddForm(true)
    setNewKey(envVar.key)
    setNewValue(envVar.value)
    setNewEnvs(envVar.environments)
    setNewEncrypted(envVar.encrypted)
    setStatus(null)
  }

  const handleCopy = async (envVar: EnvVar) => {
    await runAction(
      'Copying value…',
      `Copied the value of ${envVar.key} to the clipboard.`,
      `Could not copy the value of ${envVar.key}.`,
      () => (onCopyValue ? onCopyValue(envVar) : navigator.clipboard.writeText(envVar.value)),
      () => undefined,
    )
  }

  const handleDelete = async (envVar: EnvVar) => {
    setDeleteTarget(null)
    await runAction(
      'Deleting variable…',
      `Deleted ${envVar.key}.`,
      `Could not delete ${envVar.key}.`,
      () => onDeleteVariable?.(envVar),
      () => {
        setVariables((prev) => prev.filter((v) => v.id !== envVar.id))
        if (editingId === envVar.id) {
          setEditingId(null)
          resetForm()
        }
      },
    )
  }

  const statusMessage = status === null ? '' : status.message
  const statusToneClass = status?.tone === 'error' ? 'text-destructive' : 'text-muted-foreground'

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              Environment Variables
              <Badge variant="secondary" className="font-mono text-xs">
                {totalCount}
              </Badge>
            </h2>
            <p className="text-muted-foreground text-sm">
              Manage variables, secrets, and feature flags across environments.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="bulk-edit" className="text-xs">
              Bulk Edit
            </Label>
            <Switch id="bulk-edit" checked={bulkEditMode} onCheckedChange={setBulkEditMode} />
          </div>
        </div>
      </div>
      <Separator className="my-4" />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
          <Upload size={14} className="mr-2" />
          Import .env
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download size={14} className="mr-2" />
          Export .env
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null)
            setNewKey('')
            setNewValue('')
            setNewEnvs(['development'])
            setNewEncrypted(false)
            setShowAddForm(true)
          }}
        >
          <Plus size={14} className="mr-2" />
          Add Variable
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`mt-2 flex items-center gap-1.5 text-sm ${statusToneClass}`}
      >
        {pendingMessage === null ? (
          statusMessage
        ) : (
          <>
            <Spinner aria-hidden className="size-3.5" />
            {pendingMessage}
          </>
        )}
      </p>

      {showImport && (
        <Card className="mt-4 py-0 shadow-none">
          <CardContent className="p-4">
            <Label htmlFor={`${fieldId}-import`} className="text-xs">
              Paste your .env file contents below
            </Label>
            <Textarea
              id={`${fieldId}-import`}
              placeholder={'DATABASE_URL=postgresql://...\nAPI_KEY=sk_live_...'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="mt-2 min-h-[100px] font-mono text-sm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowImport(false)
                  setImportText('')
                }}
              >
                Cancel
              </Button>
              <Button size="sm">Import Variables</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card className="mt-4 py-0 shadow-none">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-medium">
              {editingId === null ? 'New Variable' : 'Edit Variable'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`${fieldId}-key`} className="text-xs">
                  Key
                </Label>
                <Input
                  id={`${fieldId}-key`}
                  placeholder="VARIABLE_NAME"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor={`${fieldId}-value`} className="text-xs">
                  Value
                </Label>
                <Input
                  id={`${fieldId}-value`}
                  placeholder="value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-6">
              <div>
                <Label className="text-xs">Environments</Label>
                <div className="mt-1 flex gap-2">
                  {['production', 'preview', 'development'].map((env) => (
                    <div key={env} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`new-env-${env}`}
                        checked={newEnvs.includes(env)}
                        onCheckedChange={() => toggleNewEnv(env)}
                      />
                      <Label htmlFor={`new-env-${env}`} className="text-xs capitalize">
                        {env}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="new-encrypt"
                  checked={newEncrypted}
                  onCheckedChange={(checked) => setNewEncrypted(checked as boolean)}
                />
                <Label htmlFor="new-encrypt" className="text-xs">
                  Encrypt value
                </Label>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingId(null)
                  resetForm()
                }}
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={pendingMessage !== null}
                onClick={() => void handleSave()}
              >
                <Save size={14} className="mr-1" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-4" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={groupFilter}
              onValueChange={(value) => {
                if (value !== null) setGroupFilter(value)
              }}
            >
              <SelectTrigger aria-label="Filter by group" className="w-[140px] text-sm">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="api-keys">API Keys</SelectItem>
                <SelectItem value="feature-flags">Feature Flags</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-56">
              <Search
                size={14}
                className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
              />
              <Input
                aria-label="Filter variables"
                placeholder="Filter variables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </div>

        {['production', 'preview', 'development'].map((env) => (
          <TabsContent key={env} value={env} className="mt-4">
            {bulkEditMode ? (
              <Card className="py-0 shadow-none">
                <CardContent className="p-4">
                  <Label htmlFor={`${fieldId}-bulk-${env}`} className="text-xs">
                    Raw .env format ({env})
                  </Label>
                  <Textarea
                    id={`${fieldId}-bulk-${env}`}
                    defaultValue={bulkText}
                    className="mt-2 min-h-[300px] font-mono text-sm"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button size="sm">
                      <Save size={14} className="mr-2" />
                      Apply Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.keys(groupedVars).length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No variables found.
                  </p>
                ) : (
                  (Object.entries(groupedVars) as [VarGroup, EnvVar[]][]).map(([group, vars]) => {
                    const GroupIcon = groupConfig[group].icon
                    return (
                      <div key={group}>
                        <div className="mb-2 flex items-center gap-2">
                          <GroupIcon size={14} className="text-muted-foreground" />
                          <h3 className="text-sm font-medium">{groupConfig[group].label}</h3>
                          <Badge variant="secondary" className="text-[10px]">
                            {vars.length}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {vars.map((envVar) => (
                            <Card key={envVar.id} className="rounded-lg py-0 shadow-none">
                              <CardContent className="p-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="sm:min-w-[180px]">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm font-medium">
                                        {envVar.key}
                                      </span>
                                      {envVar.linked && (
                                        <Link2 size={12} className="text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-1 basis-full items-center gap-1.5 sm:basis-auto">
                                    <Badge
                                      variant={typeConfig[envVar.type].variant}
                                      className="text-[10px]"
                                    >
                                      {typeConfig[envVar.type].label}
                                    </Badge>
                                    <Input
                                      readOnly
                                      aria-label={`Value of ${envVar.key}`}
                                      value={
                                        revealed[envVar.id] ? envVar.value : '••••••••••••••••'
                                      }
                                      className="font-mono text-sm"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={
                                        revealed[envVar.id]
                                          ? `Hide value of ${envVar.key}`
                                          : `Reveal value of ${envVar.key}`
                                      }
                                      aria-pressed={Boolean(revealed[envVar.id])}
                                      className="shrink-0"
                                      onClick={() => toggleReveal(envVar.id)}
                                    >
                                      {revealed[envVar.id] ? (
                                        <EyeOff size={14} />
                                      ) : (
                                        <Eye size={14} />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                    {envVar.encrypted ? (
                                      <Badge variant="default" className="gap-1 text-[10px]">
                                        <Lock size={10} />
                                        Encrypted
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="gap-1 text-[10px]">
                                        <Unlock size={10} />
                                        Plain
                                      </Badge>
                                    )}
                                    {envVar.environments.map((e) => (
                                      <Badge
                                        key={e}
                                        variant={envBadgeVariant(e)}
                                        className="text-[10px]"
                                      >
                                        {e.slice(0, 4)}
                                      </Badge>
                                    ))}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label={`Actions for ${envVar.key}`}
                                          className="shrink-0"
                                        >
                                          <MoreVertical size={14} />
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEdit(envVar)}>
                                        <Pencil size={14} className="mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => void handleCopy(envVar)}>
                                        <Copy size={14} className="mr-2" />
                                        Copy Value
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => setDeleteTarget(envVar)}
                                      >
                                        <Trash2 size={14} className="mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-3 text-[11px] sm:pl-[180px]">
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    Modified by {envVar.lastModifiedBy} {envVar.lastModifiedAt}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-4 flex justify-end">
        <Button>
          <Save size={14} className="mr-2" />
          Save Changes
        </Button>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variable?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === null
                ? ''
                : `${deleteTarget.key} is removed from every environment it is set in. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget !== null) void handleDelete(deleteTarget)
              }}
            >
              <Trash2 size={14} className="mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
