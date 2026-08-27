import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { Label } from '@astrale-os/ui/label'
import { CircleIcon } from "lucide-react"

const RadioGroupAnimatedInsetDemo = () => {
  return (
    <RadioGroupPrimitive data-slot='radio-group' defaultValue='english' className='grid gap-3'>
      <div className='flex items-center gap-2'>
        <RadioPrimitive.Root
          value='english'
          id='lang-english'
          data-slot='radio-group-item'
          className='border-input text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary! [&_svg]:fill-primary-foreground relative aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow,border] outline-none focus-visible:ring-3 [&_svg]:size-4 data-checked:[&_svg]:size-2.5'
        >
          <CircleIcon className='fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500' />
        </RadioPrimitive.Root>
        <Label htmlFor='lang-english'>English</Label>
      </div>

      <div className='flex items-center gap-2'>
        <RadioPrimitive.Root
          value='spanish'
          id='lang-spanish'
          data-slot='radio-group-item'
          className='border-input text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary! [&_svg]:fill-primary-foreground relative aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow,border] outline-none focus-visible:ring-3 [&_svg]:size-4 data-checked:[&_svg]:size-2.5'
        >
          <CircleIcon className='fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500' />
        </RadioPrimitive.Root>
        <Label htmlFor='lang-spanish'>Español</Label>
      </div>

      <div className='flex items-center gap-2'>
        <RadioPrimitive.Root
          value='french'
          id='lang-french'
          data-slot='radio-group-item'
          className='border-input text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary! [&_svg]:fill-primary-foreground relative aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow,border] outline-none focus-visible:ring-3 [&_svg]:size-4 data-checked:[&_svg]:size-2.5'
        >
          <CircleIcon className='fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500' />
        </RadioPrimitive.Root>
        <Label htmlFor='lang-french'>Français</Label>
      </div>
    </RadioGroupPrimitive>
  )
}

export default RadioGroupAnimatedInsetDemo
