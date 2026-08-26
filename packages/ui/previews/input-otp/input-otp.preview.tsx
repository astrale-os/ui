import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@astrale-os/ui/input-otp'
import { useState } from 'react'

export const preview = { source: '@shadcn/input-otp' } as const

export default function InputOtpPreview() {
  const [value, setValue] = useState('')
  return (
    <InputOTP maxLength={6} value={value} onChange={setValue} aria-label="Verification code">
      <InputOTPGroup>
        {[0, 1, 2].map((index) => (
          <InputOTPSlot index={index} key={index} />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {[3, 4, 5].map((index) => (
          <InputOTPSlot index={index} key={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
