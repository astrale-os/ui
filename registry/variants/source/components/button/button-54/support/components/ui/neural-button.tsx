'use client'

import * as React from 'react'

import { Button } from '@astrale-os/ui/button'

// BorderBeam is a standalone animation component
import { BorderBeam } from '@/components/ui/border-beam'

import { cn } from '@astrale-os/ui/class-name'

interface NeuralButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'render'> {
  children?: React.ReactNode
  render?: React.ReactElement
}

function NeuralButton({ children, render, className, ...rest }: NeuralButtonProps) {
  const neuralStyles = cn(
    'relative z-1 h-10 overflow-hidden rounded-xl border-0 bg-sky-600! px-6 text-base text-white ring-2 ring-sky-600/60! transition-transform duration-200 ease-in-out hover:scale-105 active:translate-y-0 active:scale-95 dark:bg-sky-400/60! dark:ring-sky-400/60! focus-visible:ring-3 focus-visible:ring-sky-600 dark:focus-visible:ring-sky-400/60!',
    className
  )

  const backgroundDecorations = (
    <>
      <span className='pointer-events-none absolute inset-0 -z-1 bg-linear-to-r from-neutral-900/20 to-white/20'>
        <span className='absolute inset-px rounded-[calc(var(--radius-xl)-1px)] bg-sky-600 dark:bg-sky-400/60' />
      </span>

      <svg
        width='98'
        height='40'
        viewBox='0 0 98 40'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='absolute inset-x-0 bottom-px h-12 w-full! blur-[6px]'
      >
        <g filter='url(#filter0_f_28138_7760)'>
          <path
            d='M99 37.5708C60.3329 38.179 38.3917 38.106 -1 37.5708C-1 37.5708 2.65293 34.4541 7.59896 29.7774C12.545 25.1008 81.7895 24.0613 90.3618 30.737C98.9341 37.4128 99 37.5708 99 37.5708Z'
            fill='white'
          />
        </g>
        <defs>
          <filter
            id='filter0_f_28138_7760'
            x='-28.9'
            y='-1.9'
            width='155.8'
            height='67.8'
            filterUnits='userSpaceOnUse'
            colorInterpolationFilters='sRGB'
          >
            <feFlood floodOpacity='0' result='BackgroundImageFix' />
            <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
            <feGaussianBlur stdDeviation='13.95' result='effect1_foregroundBlur_28138_7760' />
          </filter>
        </defs>
      </svg>
    </>
  )

  const overlayDecorations = (
    <>
      <span className='pointer-events-none absolute inset-0 z-1 rounded-xl [box-shadow:0px_1px_1.6px_0px_color-mix(in_oklab,white_68%,transparent)_inset]' />
      <BorderBeam colorFrom='white' colorTo='white' size={35} />
    </>
  )

  return (
    <Button render={render} nativeButton={!render} className={neuralStyles} {...rest}>
      {backgroundDecorations}
      {children}
      {overlayDecorations}
    </Button>
  )
}

export { NeuralButton, type NeuralButtonProps }
