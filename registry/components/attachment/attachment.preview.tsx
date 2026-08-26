import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from './attachment.js'

export const preview = { source: '@shadcn/attachment' } as const

export default function AttachmentPreview() {
  return (
    <Attachment>
      <AttachmentMedia>TS</AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>domain.ts</AttachmentTitle>
        <AttachmentDescription>12 KB</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  )
}
