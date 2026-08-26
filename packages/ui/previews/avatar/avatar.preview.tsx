import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@astrale-os/ui/avatar'

export const preview = { canvas: 'compact', source: '@shadcn/avatar' } as const

export default function AvatarPreview() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AD</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <Avatar>
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  )
}
